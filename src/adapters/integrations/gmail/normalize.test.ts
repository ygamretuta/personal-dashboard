import { describe, expect, it } from "vitest";
import { buildReplyMessage, extractBody, normalizeGmailThread, parseAddress } from "./normalize";
import type { GmailMessage, GmailThread } from "./types";

const encode = (text: string) => Buffer.from(text).toString("base64url");

function message(
  overrides: Partial<GmailMessage> & {
    text?: string;
    html?: string;
    from?: string;
    subject?: string;
  } = {},
): GmailMessage {
  const {
    text,
    html,
    from = "Dana Whitfield <dana@northwind.example>",
    subject = "Interview loop",
    ...rest
  } = overrides;
  const parts = [
    ...(text !== undefined ? [{ mimeType: "text/plain", body: { data: encode(text) } }] : []),
    ...(html !== undefined ? [{ mimeType: "text/html", body: { data: encode(html) } }] : []),
  ];
  return {
    id: "m1",
    threadId: "t1",
    labelIds: ["INBOX", "UNREAD"],
    internalDate: "1700000000000",
    payload: {
      mimeType: "multipart/alternative",
      headers: [
        { name: "From", value: from },
        { name: "Subject", value: subject },
      ],
      parts,
    },
    ...rest,
  };
}

const thread = (...messages: GmailMessage[]): GmailThread => ({ id: "t1", messages });

describe("Gmail normalizer", () => {
  it("normalizes a thread into a feed item", () => {
    const item = normalizeGmailThread(thread(message({ text: "Panel confirmed for Thursday." })));
    expect(item).toMatchObject({
      id: "gmail:t1",
      source: "gmail",
      kind: "email",
      title: "Interview loop",
      body: "Panel confirmed for Thursday.",
      sender: { name: "Dana Whitfield", handle: "dana@northwind.example" },
      status: "unread",
      priority: "normal",
      receivedAt: "2023-11-14T22:13:20.000Z",
    });
    expect(item.url).toBe("https://mail.google.com/mail/u/0/#inbox/t1");
  });

  it("represents the thread by its newest unread message", () => {
    const old = message({ id: "a", text: "old", labelIds: ["INBOX"] });
    const fresh = message({ id: "b", text: "fresh", internalDate: "1700000100000" });
    expect(normalizeGmailThread(thread(old, fresh)).body).toBe("fresh");
  });

  it("maps labels to priority", () => {
    expect(
      normalizeGmailThread(thread(message({ text: "x", labelIds: ["UNREAD", "IMPORTANT"] })))
        .priority,
    ).toBe("high");
    expect(
      normalizeGmailThread(
        thread(message({ text: "x", labelIds: ["UNREAD", "CATEGORY_PROMOTIONS"] })),
      ).priority,
    ).toBe("low");
  });

  it("falls back when there is no subject", () => {
    expect(normalizeGmailThread(thread(message({ text: "x", subject: "" }))).title).toBe(
      "(no subject)",
    );
  });

  it("truncates the preview but keeps the body", () => {
    const item = normalizeGmailThread(thread(message({ text: "word ".repeat(100) })));
    expect(item.preview.length).toBeLessThanOrEqual(200);
    expect(item.body.length).toBeGreaterThan(200);
  });
});

describe("Gmail body extraction", () => {
  it("falls back to HTML converted to text", () => {
    const body = extractBody(
      message({ html: "<p>Hello&nbsp;there</p><style>x{}</style><p>Bye &amp; thanks</p>" }).payload,
    );
    expect(body).toBe("Hello there\nBye & thanks");
  });

  it("drops the quoted earlier conversation", () => {
    const text = "Sounds good.\n\nOn Mon, Nov 20, Sam <sam@x.com> wrote:\n> earlier text";
    expect(extractBody(message({ text }).payload)).toBe("Sounds good.");
  });

  it("returns an empty body when there is no text part", () => {
    expect(extractBody(message().payload)).toBe("");
  });
});

describe("address parsing", () => {
  it("handles names, quotes and bare addresses", () => {
    expect(parseAddress('"Okafor, Sam" <sam@acme.example>')).toEqual({
      name: "Okafor, Sam",
      email: "sam@acme.example",
    });
    expect(parseAddress("<billing@x.example>")).toEqual({
      name: "billing@x.example",
      email: "billing@x.example",
    });
    expect(parseAddress("solo@x.example")).toEqual({
      name: "solo@x.example",
      email: "solo@x.example",
    });
  });
});

describe("reply message", () => {
  const decode = (raw: string) => Buffer.from(raw, "base64url").toString("utf8");

  it("threads the reply with Re:, In-Reply-To and References", () => {
    const mime = decode(
      buildReplyMessage({
        to: "dana@x.com",
        subject: "Interview",
        text: "Thanks!",
        inReplyTo: "<b@x>",
        references: "<a@x>",
      }),
    );
    expect(mime).toContain("Subject: Re: Interview");
    expect(mime).toContain("In-Reply-To: <b@x>");
    expect(mime).toContain("References: <a@x> <b@x>");
    expect(mime.split("\r\n\r\n")[1]).toBe(Buffer.from("Thanks!").toString("base64"));
  });

  it("does not double the Re: prefix", () => {
    expect(decode(buildReplyMessage({ to: "a@b.c", subject: "Re: Hi", text: "x" }))).toContain(
      "Subject: Re: Hi\r\n",
    );
  });

  it("cannot be used to inject extra headers", () => {
    const mime = decode(
      buildReplyMessage({
        to: "a@b.c\r\nBcc: evil@x.com",
        subject: "Hi\r\nBcc: evil@x.com",
        text: "x",
      }),
    );
    expect(mime.split("\r\n").some((line) => line.startsWith("Bcc:"))).toBe(false);
  });

  it("encodes non-ASCII subjects", () => {
    expect(decode(buildReplyMessage({ to: "a@b.c", subject: "Café", text: "x" }))).toContain(
      "=?UTF-8?B?",
    );
  });
});
