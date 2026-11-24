/** Raw Slack payloads. These never leave `adapters/integrations/slack`. */
export interface SlackRawMessage {
  ts: string;
  text?: string;
  user?: string;
  thread_ts?: string;
  subtype?: string;
}

export interface SlackUser {
  id: string;
  name?: string;
  real_name?: string;
  profile?: { display_name?: string; real_name?: string; image_72?: string };
}

export interface SlackSearchMatch extends SlackRawMessage {
  channel: { id: string; name?: string; is_im?: boolean };
}

export interface SlackEvent {
  type: string;
  channel: string;
  channel_type?: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  subtype?: string;
  bot_id?: string;
}

export interface SlackEventEnvelope {
  type: "url_verification" | "event_callback";
  challenge?: string;
  team_id?: string;
  event?: SlackEvent;
  authorizations?: { user_id: string; team_id: string; is_bot: boolean }[];
}
