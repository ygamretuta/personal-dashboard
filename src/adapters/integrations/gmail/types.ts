/** Raw Gmail payloads. These never leave `adapters/integrations/gmail`. */
export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailPart {
  mimeType: string;
  headers?: GmailHeader[];
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  internalDate: string; // epoch ms as a string
  payload: GmailPart & { headers: GmailHeader[] };
}

export interface GmailThread {
  id: string;
  messages: GmailMessage[];
}
