import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { fetchThreadById } from "./threadService.js";
import { getCommentsByThread } from "./commentService.js";
import { createAppError } from "../utils/createAppError.js";

dotenv.config();

const MODEL = "gemini-3.8-flash";

const SYSTEM_INSTRUCTION =
  "You summarize forum threads. Write exactly one concise paragraph of plain text " +
  "(no markdown, no bullet points, no headings) that captures the thread's main topic " +
  "and the key points, opinions, and any consensus or disagreement in the comments.";

// Client is created lazily (per call) so it is constructed only after the
// API key has been loaded from the environment.
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createAppError("AI service is not configured", 500);
  }
  return new GoogleGenAI({ apiKey });
};

const buildPrompt = (thread, comments) => {
  const commentLines = comments.length
    ? comments
        .map((c, i) => `${i + 1}. ${c.user?.name || "Anonymous"}: ${c.content}`)
        .join("\n")
    : "(no comments yet)";

  return `Thread title: ${thread.title}\n\nThread content:\n${thread.content}\n\nComments:\n${commentLines}`;
};

export const summarizeThread = async (threadId) => {
  const thread = await fetchThreadById(threadId); // throws 404 if missing
  const comments = await getCommentsByThread(threadId);
  const client = getClient();

  let text;
  try {
    const interaction = await client.interactions.create({
      model: MODEL,
      system_instruction: SYSTEM_INSTRUCTION,
      input: buildPrompt(thread, comments),
    });
    text = interaction.output_text;
  } catch (err) {
    console.error("Gemini summarize error:", err?.message || err);
    throw createAppError("Failed to generate summary", 502);
  }

  if (!text || !text.trim()) {
    throw createAppError("Failed to generate summary", 502);
  }
  return text.trim();
};

const REPHRASE_GUIDANCE = {
  title:
    "The text is a forum thread title. Make it clear and concise, on a single line, without surrounding quotes.",
  body: "The text is the body of a forum thread. Improve clarity, grammar, and flow.",
  comment: "The text is a forum comment. Improve clarity, grammar, and tone.",
};

export const REPHRASE_TYPES = Object.keys(REPHRASE_GUIDANCE);

export const rephraseText = async (text, type) => {
  const guidance = REPHRASE_GUIDANCE[type];
  if (!guidance) {
    throw createAppError("Invalid rephrase type", 400);
  }
  const client = getClient();

  let result;
  try {
    const interaction = await client.interactions.create({
      model: MODEL,
      system_instruction:
        "You rewrite the user's text to be better written. Preserve the original meaning, " +
        "language, and approximate length. " +
        guidance +
        " Respond with ONLY the rewritten text: no preamble, no explanation, no quotes or markdown wrapper.",
      input: text,
    });
    result = interaction.output_text;
  } catch (err) {
    console.error("Gemini rephrase error:", err?.message || err);
    throw createAppError("Failed to rephrase text", 502);
  }

  if (!result || !result.trim()) {
    throw createAppError("Failed to rephrase text", 502);
  }
  return result.trim();
};
