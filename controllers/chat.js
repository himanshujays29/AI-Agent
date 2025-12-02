// controllers/chat.js
import ChatSession from "../models/ChatSession.js";
import { chatAgent } from "../agents/chatAgent.js";

/**
 * Create a new chat session.
 * We allow an empty session so the user can see the chat page,
 * but we will NOT show empty sessions in the sidebar list.
 */
export const createChatSession = async (req, res) => {
  const session = await ChatSession.create({
    owner: req.user._id,
    title: "New Chat",
    model: req.body.model || "gemini-2.5-flash",
    messages: [],
  });

  res.json({ success: true, sessionId: session._id });
};

/**
 * Only list chats that have at least 1 message.
 * (Don't show empty chats in the sidebar.)
 */
export const listSessions = async (req, res) => {
  const sessions = await ChatSession.find({
    owner: req.user._id,
    "messages.0": { $exists: true }, // at least one message
  })
    .sort({ updatedAt: -1 })
    .select("title createdAt");

  res.json({ success: true, sessions });
};

export const loadChatSession = async (req, res) => {
  const chat = await ChatSession.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!chat) return res.status(404).send("Chat not found");

  res.render("chat/chat.ejs", { chat });
};

export const sendMessage = async (req, res) => {
  const { userMessage } = req.body;

  const chat = await ChatSession.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  // If this is the first user message, set the title from it
  if (!chat.messages || chat.messages.length === 0) {
    chat.title = userMessage.slice(0, 60); // first 60 chars
  }

  // Save user message
  chat.messages.push({ role: "user", text: userMessage });

  // Generate AI reply
  const aiReply = await chatAgent(
    chat.title,
    chat.messages,
    userMessage,
    chat.model
  );

  chat.messages.push({ role: "model", text: aiReply });
  await chat.save();

  res.json({ success: true, reply: aiReply });
};

export const renameSession = async (req, res) => {
  const chat = await ChatSession.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  chat.title = req.body.title || chat.title;
  await chat.save();

  res.json({ success: true });
};

export const deleteSession = async (req, res) => {
  await ChatSession.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id,
  });
  res.json({ success: true });
};
