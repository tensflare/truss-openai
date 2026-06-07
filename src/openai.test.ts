import { describe, it, expect, vi } from "vitest";
import { TrussOpenAIMiddleware } from "./index.js";

describe("TrussOpenAIMiddleware", () => {
  it("wrapHandoff records and returns result", async () => {
    const mw = new TrussOpenAIMiddleware({
      apiUrl: "http://localhost:4000",
      apiKey: "tr_test",
      mandateId: "mnd_test",
    });

    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

    const handoffFn = vi.fn().mockResolvedValue("handoff complete");
    const wrapped = mw.wrapHandoff(handoffFn);
    const result = await wrapped({ sourceAgent: "agent_a", targetAgent: "agent_b" });

    expect(result).toBe("handoff complete");
    expect(handoffFn).toHaveBeenCalledWith({ sourceAgent: "agent_a", targetAgent: "agent_b" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("wrapRun records and returns result", async () => {
    const mw = new TrussOpenAIMiddleware({
      apiUrl: "http://localhost:4000",
      apiKey: "tr_test",
      mandateId: "mnd_test",
    });

    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

    const runFn = vi.fn().mockResolvedValue("run output");
    const wrapped = mw.wrapRun(runFn);
    const result = await wrapped({ messages: ["hello"], agent: "assistant" });

    expect(result).toBe("run output");
    expect(runFn).toHaveBeenCalledWith({ messages: ["hello"], agent: "assistant" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not throw on fetch failure", async () => {
    const mw = new TrussOpenAIMiddleware({
      apiUrl: "http://localhost:4000",
      apiKey: "tr_test",
      mandateId: "mnd_test",
    });

    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const handoffFn = vi.fn().mockResolvedValue("survivor");
    const wrapped = mw.wrapHandoff(handoffFn);
    const result = await wrapped({ sourceAgent: "a", targetAgent: "b" });

    expect(result).toBe("survivor");
  });
});
