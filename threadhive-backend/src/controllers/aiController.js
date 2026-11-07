import { rephraseText, REPHRASE_TYPES } from "../services/aiService.js";
import { createAppError } from "../utils/createAppError.js";

const MAX_TEXT_LENGTH = 5000;

// POST /api/ai/rephrase
export const rephrase = async (req, res) => {
  const { text, type } = req.body || {};

  if (typeof text !== "string" || !text.trim()) {
    throw createAppError("Text is required", 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw createAppError(`Text must be at most ${MAX_TEXT_LENGTH} characters`, 400);
  }
  if (!REPHRASE_TYPES.includes(type)) {
    throw createAppError(`Type must be one of: ${REPHRASE_TYPES.join(", ")}`, 400);
  }

  const rephrased = await rephraseText(text, type);
  res.status(200).json({
    success: true,
    message: "Text rephrased successfully",
    data: { text: rephrased },
  });
};
