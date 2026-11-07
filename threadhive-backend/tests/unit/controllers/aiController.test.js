import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/services/aiService.js", () => ({
  rephraseText: vi.fn(),
  REPHRASE_TYPES: ["title", "body", "comment"],
}));

import { rephrase } from "../../../src/controllers/aiController.js";
import { rephraseText } from "../../../src/services/aiService.js";

describe("aiController.rephrase", () => {
  let res;
  beforeEach(() => {
    vi.clearAllMocks();
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  });

  it("returns rephrased text", async () => {
    rephraseText.mockResolvedValue("Nice");
    await rephrase({ body: { text: "nice?", type: "title" } }, res);
    expect(rephraseText).toHaveBeenCalledWith("nice?", "title");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { text: "Nice" } }),
    );
  });

  it.each([
    [{}],
    [{ text: "   ", type: "body" }],
    [{ text: 5, type: "body" }],
    [{ text: "a".repeat(5001), type: "body" }],
    [{ text: "ok", type: "bad" }],
    [{ text: "ok" }],
  ])("rejects invalid input with 400: %j", async (body) => {
    await expect(rephrase({ body }, res)).rejects.toMatchObject({ statusCode: 400 });
    expect(rephraseText).not.toHaveBeenCalled();
  });

  it("rejects when body is undefined", async () => {
    await expect(rephrase({}, res)).rejects.toMatchObject({ statusCode: 400 });
  });
});
