import { createHash } from "node:crypto";

export interface TrussOpenAIOptions {
  apiUrl: string;
  apiKey: string;
  mandateId: string;
}

const hash = (data: string) => `sha256:${createHash("sha256").update(data).digest("hex")}`;

interface HandoffEvent {
  sourceAgent: string;
  targetAgent: string;
  context?: Record<string, unknown>;
}

interface AgentRunInput {
  messages: unknown[];
  agent?: string;
}

export class TrussOpenAIMiddleware {
  private apiUrl: string;
  private apiKey: string;
  private mandateId: string;

  constructor(opts: TrussOpenAIOptions) {
    this.apiUrl = opts.apiUrl;
    this.apiKey = opts.apiKey;
    this.mandateId = opts.mandateId;
  }

  wrapHandoff(handoffFn: (event: HandoffEvent) => Promise<unknown>): (event: HandoffEvent) => Promise<unknown> {
    const self = this;
    return async (event: HandoffEvent) => {
      const result = await handoffFn(event);
      try {
        await fetch(`${self.apiUrl}/actions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${self.apiKey}`,
          },
          body: JSON.stringify({
            mandate_id: self.mandateId,
            action_type: "openai_handoff",
            input_hash: hash(JSON.stringify(event)),
            output_hash: hash(JSON.stringify(result)),
          }),
        });
      } catch {
        // fail open
      }
      return result;
    };
  }

  wrapRun(runFn: (input: AgentRunInput) => Promise<unknown>): (input: AgentRunInput) => Promise<unknown> {
    const self = this;
    return async (input: AgentRunInput) => {
      const result = await runFn(input);
      try {
        await fetch(`${self.apiUrl}/actions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${self.apiKey}`,
          },
          body: JSON.stringify({
            mandate_id: self.mandateId,
            action_type: "openai_agent_run",
            input_hash: hash(JSON.stringify(input)),
            output_hash: hash(JSON.stringify(result)),
          }),
        });
      } catch {
        // fail open
      }
      return result;
    };
  }
}
