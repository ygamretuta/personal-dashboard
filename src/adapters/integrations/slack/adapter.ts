import { TIME } from "@/lib/constants";
import type { FeedItem } from "@/features/feed/types";
import type { ConnectedAccount, IntegrationAdapter } from "../types";
import { createSlackClient, type SlackClient } from "./client";
import {
  isDirectChannel,
  normalizeSlackMessage,
  parseExternalId,
  type SlackMessageContext,
} from "./normalize";
import type { SlackEvent, SlackRawMessage, SlackSearchMatch, SlackUser } from "./types";

const DEFAULT_LOOKBACK_MS = TIME.DAY_MS;
const MAX_DIRECT_CONVERSATIONS = 10;
const MESSAGES_PER_CONVERSATION = 10;
const MAX_MENTIONS = 20;

type ClientFactory = (token: string) => SlackClient;

/** Slack account ids are stored as `teamId:userId`. */
export const parseAccountId = (externalAccountId: string) => {
  const [teamId, userId] = externalAccountId.split(":");
  return { teamId, userId };
};

function displayName(user: SlackUser): string {
  return (
    user.profile?.display_name ||
    user.profile?.real_name ||
    user.real_name ||
    user.name ||
    "Someone"
  );
}

/** Looks users up once per fetch; failures degrade to a generic name rather than failing the sync. */
function createUserResolver(client: SlackClient) {
  const cache = new Map<string, Promise<SlackMessageContext["sender"]>>();
  return (userId: string | undefined) => {
    if (!userId) return Promise.resolve({ name: "Someone" });
    if (!cache.has(userId)) {
      cache.set(
        userId,
        client
          .call<{ user: SlackUser }>("users.info", { user: userId })
          .then(({ user }) => ({
            name: displayName(user),
            avatarUrl: user.profile?.image_72,
            handle: user.name,
          }))
          .catch(() => ({ name: "Someone" })),
      );
    }
    return cache.get(userId)!;
  };
}

async function toItem(
  resolve: ReturnType<typeof createUserResolver>,
  raw: SlackRawMessage,
  channelId: string,
  channelName?: string,
): Promise<FeedItem> {
  return normalizeSlackMessage(raw, { channelId, channelName, sender: await resolve(raw.user) });
}

const isHumanMessage = (message: SlackRawMessage, selfId: string) =>
  !message.subtype && Boolean(message.user) && message.user !== selfId;

export function createSlackAdapter(
  clientFactory: ClientFactory = createSlackClient,
): IntegrationAdapter & {
  itemFromEvent(account: ConnectedAccount, event: SlackEvent): Promise<FeedItem | null>;
} {
  return {
    source: "slack",

    async fetchItems(account, since) {
      const client = clientFactory(account.accessToken);
      const { userId: selfId } = parseAccountId(account.externalAccountId);
      const oldest = ((since?.getTime() ?? Date.now() - DEFAULT_LOOKBACK_MS) / 1000).toString();
      const resolve = createUserResolver(client);

      const [mentions, direct] = await Promise.all([
        fetchMentions(client, selfId, oldest, resolve),
        fetchDirectMessages(client, selfId, oldest, resolve),
      ]);
      return [...new Map([...direct, ...mentions].map((item) => [item.id, item])).values()];
    },

    async performAction(account, item, action, payload) {
      const client = clientFactory(account.accessToken);
      const { channelId, ts, threadTs } = parseExternalId(item.externalId);

      if (action === "reply") {
        const text = payload?.text?.trim();
        if (!text) throw new Error("A reply needs some text");
        const thread = isDirectChannel(channelId) ? undefined : (threadTs ?? ts);
        await client.call("chat.postMessage", { channel: channelId, text, thread_ts: thread });
        return;
      }
      if (action === "markRead")
        await client.call("conversations.mark", { channel: channelId, ts });
      // open, archive and snooze are local to the app; Slack has nothing to update.
    },

    async itemFromEvent(account, event) {
      const { userId: selfId } = parseAccountId(account.externalAccountId);
      const isDirect = event.channel_type === "im";
      const mentionsMe = event.text?.includes(`<@${selfId}>`);
      if (event.type !== "message" || !isHumanMessage(event, selfId) || !(isDirect || mentionsMe))
        return null;
      const client = clientFactory(account.accessToken);
      return toItem(createUserResolver(client), event, event.channel);
    },
  };
}

async function fetchMentions(
  client: SlackClient,
  selfId: string,
  oldest: string,
  resolve: ReturnType<typeof createUserResolver>,
) {
  const { messages } = await client.call<{ messages: { matches: SlackSearchMatch[] } }>(
    "search.messages",
    {
      query: `<@${selfId}>`,
      sort: "timestamp",
      sort_dir: "desc",
      count: MAX_MENTIONS,
    },
  );
  const matches = messages.matches.filter(
    (match) => isHumanMessage(match, selfId) && Number(match.ts) >= Number(oldest),
  );
  return Promise.all(
    matches.map((match) => toItem(resolve, match, match.channel.id, match.channel.name)),
  );
}

async function fetchDirectMessages(
  client: SlackClient,
  selfId: string,
  oldest: string,
  resolve: ReturnType<typeof createUserResolver>,
) {
  const { channels } = await client.call<{ channels: { id: string }[] }>("conversations.list", {
    types: "im",
    exclude_archived: true,
    limit: MAX_DIRECT_CONVERSATIONS,
  });
  const histories = await Promise.all(
    channels.map(async ({ id }) => {
      const { messages } = await client.call<{ messages: SlackRawMessage[] }>(
        "conversations.history",
        {
          channel: id,
          oldest,
          limit: MESSAGES_PER_CONVERSATION,
        },
      );
      return Promise.all(
        messages
          .filter((message) => isHumanMessage(message, selfId))
          .map((message) => toItem(resolve, message, id)),
      );
    }),
  );
  return histories.flat();
}

export const slackAdapter = createSlackAdapter();
