import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCreate = vi.fn();
const ctor = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(opts) {
      ctor(opts);
      this.interactions = { create: mockCreate };
    }
  },
}));
vi.mock("../../../src/services/threadService.js");
vi.mock("../../../src/services/commentService.js");

import { summarizeThread, rephraseText } from "../../../src/services/aiService.js";
import { fetchThreadById } from "../../../src/services/threadService.js";
import { getCommentsByThread } from "../../../src/services/commentService.js";

describe("aiService.summarizeThread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    fetchThreadById.mockResolvedValue({ title: "T", content: "C" });
    getCommentsByThread.mockResolvedValue([{ user: { name: "Ann" }, content: "Nice" }]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns trimmed summary and builds client with the loaded key", async () => {
    mockCreate.mockResolvedValue({ output_text: "  A summary.  " });
    const result = await summarizeThread("id1");
    expect(result).toBe("A summary.");
    expect(ctor).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(mockCreate.mock.calls[0][0].input).toContain("Ann: Nice");
  });

  it("handles threads with no comments", async () => {
    getCommentsByThread.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ output_text: "ok" });
    await summarizeThread("id1");
    expect(mockCreate.mock.calls[0][0].input).toContain("(no comments yet)");
  });

  it("throws 500 when API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(summarizeThread("id1")).rejects.toMatchObject({ statusCode: 500 });
  });

  it("throws 502 when Gemini call fails", async () => {
    mockCreate.mockRejectedValue(new Error("boom"));
    await expect(summarizeThread("id1")).rejects.toMatchObject({
      statusCode: 502,
      message: "Failed to generate summary",
    });
  });

  it("throws 502 on empty output", async () => {
    mockCreate.mockResolvedValue({ output_text: "   " });
    await expect(summarizeThread("id1")).rejects.toMatchObject({ statusCode: 502 });
  });
});

describe("aiService.rephraseText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns trimmed rephrased text, sending original as input", async () => {
    mockCreate.mockResolvedValue({ output_text: "  Better text.  " });
    const result = await rephraseText("bad txt", "comment");
    expect(result).toBe("Better text.");
    expect(ctor).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(mockCreate.mock.calls[0][0].input).toBe("bad txt");
  });

  it("uses type-specific guidance", async () => {
    mockCreate.mockResolvedValue({ output_text: "x" });
    await rephraseText("t", "title");
    expect(mockCreate.mock.calls[0][0].system_instruction).toContain("thread title");
  });

  it("throws 400 for invalid type", async () => {
    await expect(rephraseText("t", "nope")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 500 when API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(rephraseText("t", "body")).rejects.toMatchObject({ statusCode: 500 });
  });

  it("throws 502 on Gemini failure and on empty output", async () => {
    mockCreate.mockRejectedValue(new Error("boom"));
    await expect(rephraseText("t", "body")).rejects.toMatchObject({
      statusCode: 502,
      message: "Failed to rephrase text",
    });
    mockCreate.mockResolvedValue({ output_text: " " });
    await expect(rephraseText("t", "body")).rejects.toMatchObject({ statusCode: 502 });
  });
});
