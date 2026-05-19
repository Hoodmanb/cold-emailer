"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
  Avatar,
  Paper,
  Fade,
} from "@mui/material";
import { X, Send, Bot, User, Trash2 } from "lucide-react";
import axiosInstance from "@/hooks/axios";
import { useSnackbar } from "@/context/SnackbarContext";
import { useProductivity } from "@/context/ProductivityContext";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status?: "pending" | "sent" | "failed";
};

type PersistedChat = {
  sessionId: string;
  messages: ChatMessage[];
  draftInput: string;
};

const CHAT_STORAGE_KEY = "job-bot:assistant-chat:v2";

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function AIAssistantModal() {
  const { activeModal, closeModal } = useProductivity();
  const isOpen = activeModal === "assistant";
  const { showSnackbar } = useSnackbar();

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSessionId, setChatSessionId] = useState("");
  const [chatHydrated, setChatHydrated] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatRestoreInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || chatRestoreInitializedRef.current) return;
    chatRestoreInitializedRef.current = true;
    
    const restore = async () => {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      let localSessionId = "";
      let localMessages: ChatMessage[] = [];
      let localDraftInput = "";
      
      try {
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedChat;
          localSessionId = parsed.sessionId || "";
          localMessages = Array.isArray(parsed.messages) ? parsed.messages : [];
          localDraftInput = typeof parsed.draftInput === "string" ? parsed.draftInput : "";
        }
      } catch (_err) {}

      try {
        const endpoint = localSessionId
          ? `/api/settings/ai/chat/${encodeURIComponent(localSessionId)}`
          : "/api/settings/ai/chat/latest";
        const res = await axiosInstance.get(endpoint);
        if (res.data?.success && res.data?.data) {
          setChatSessionId(String(res.data.data.sessionId || makeId()));
          setChatHistory(Array.isArray(res.data.data.messages) ? res.data.data.messages : []);
          setChatInput(localDraftInput);
          setChatHydrated(true);
          return;
        }
      } catch (_err) {}

      setChatSessionId(localSessionId || makeId());
      setChatHistory(localMessages);
      setChatInput(localDraftInput);
      setChatHydrated(true);
    };
    void restore();
  }, [isOpen]);

  useEffect(() => {
    if (!chatHydrated || !chatSessionId) return;
    const payload: PersistedChat = {
      sessionId: chatSessionId,
      messages: chatHistory,
      draftInput: chatInput,
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
  }, [chatHydrated, chatSessionId, chatHistory, chatInput]);

  useEffect(() => {
    if (!chatHydrated) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading, chatHydrated]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      createdAt: now,
      status: "sent",
    };

    const pendingId = makeId();
    const pendingAssistant: ChatMessage = {
      id: pendingId,
      role: "assistant",
      content: "...",
      createdAt: now,
      status: "pending",
    };

    setChatHistory((prev) => [...prev, userMsg, pendingAssistant]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await axiosInstance.post("/api/settings/ai/chat", {
        sessionId: chatSessionId,
        messages: [{ role: userMsg.role, content: userMsg.content }],
      });

      if (res.data?.success) {
        const reply = String(res.data.data || "").trim();
        setChatHistory((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? { ...m, content: reply, status: "sent", createdAt: new Date().toISOString() }
              : m
          )
        );
      } else {
        throw new Error(res.data?.message || "Chat failed");
      }
    } catch (err: any) {
      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, content: "Sorry, I encountered an error. Please try again.", status: "failed" }
            : m
        )
      );
      showSnackbar(err.message || "Failed to get response", "error");
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    if (!confirm("Clear conversation history?")) return;
    setChatHistory([]);
    setChatSessionId(makeId());
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        },
      }}
    >
      <DialogTitle sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
            <Bot size={20} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
              AI Career Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ask me anything about your career or the app
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1}>
          <IconButton size="small" onClick={clearChat} title="Clear Chat">
            <Trash2 size={18} />
          </IconButton>
          <IconButton size="small" onClick={closeModal}>
            <X size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, flex: 1, display: "flex", flexDirection: "column", bgcolor: "rgba(0,0,0,0.01)" }}>
        <Box sx={{ flex: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {chatHistory.length === 0 && chatHydrated && (
            <Box sx={{ mt: 4, textAlign: "center", maxWidth: 400, mx: "auto" }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                How can I help you today?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                I can help you polish your resume, draft emails, prepare for interviews, or explain app features.
              </Typography>
            </Box>
          )}

          {!chatHydrated && (
            <Stack alignItems="center" py={4} gap={2}>
              <CircularProgress size={24} />
              <Typography variant="caption" color="text.secondary">Restoring context...</Typography>
            </Stack>
          )}

          {chatHistory.map((m) => (
            <Fade in key={m.id}>
              <Box
                sx={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <Stack direction="row" gap={1.5} alignItems="flex-start" flexDirection={m.role === "user" ? "row-reverse" : "row"}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: m.role === "user" ? "primary.light" : "success.light", fontSize: "0.75rem" }}>
                    {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      borderTopRightRadius: m.role === "user" ? 0 : 3,
                      borderTopLeftRadius: m.role === "assistant" ? 0 : 3,
                      bgcolor: m.role === "user" ? "primary.main" : "background.paper",
                      color: m.role === "user" ? "white" : "text.primary",
                      boxShadow: m.role === "assistant" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                      border: m.role === "assistant" ? "1px solid" : "none",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {m.content}
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.6, textAlign: m.role === "user" ? "right" : "left", fontSize: "0.65rem" }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            </Fade>
          ))}
          <div ref={chatBottomRef} />
        </Box>

        <Box sx={{ p: 2, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" gap={2}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendChat();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "rgba(0,0,0,0.02)",
                }
              }}
            />
            <IconButton
              onClick={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled" },
                width: 48,
                height: 48,
              }}
            >
              {chatLoading ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
            </IconButton>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
