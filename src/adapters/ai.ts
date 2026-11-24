import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-opus-5-5";
const DEFAULT_MAX_TOKENS = 2000; // thinking tokens count toward this, so leave headroom
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export class AiRefusalError extends Error {
  constructor() {
    super("The model declined to answer");
  }
}

export const isAiConfigured = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY);

interface GenerateJsonInput {
  system: string;
  prompt: string;
  /** JSON Schema the response must match. */
  schema: Record<string, unknown>;
  maxTokens?: number;
}

/** Server-side only. Returns the model's JSON text; callers validate it. */
export async function generateJson({
  system,
  prompt,
  schema,
  maxTokens = DEFAULT_MAX_TOKENS,
}: GenerateJsonInput): Promise<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const response = await client.beta.messages.create({
    model: process.env.BRIEF_MODEL ?? DEFAULT_MODEL,
    max_tokens: maxTokens,
    betas: [FALLBACK_BETA],
    fallbacks: "default", // if a safety classifier declines, the API retries on a fallback model
    system,
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") throw new AiRefusalError();
  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") throw new Error("The model returned no text");
  return text.text;
}
