"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Mail, Instagram, MessageSquare, X } from "lucide-react";
import { Box, Tooltip, IconButton, useTheme, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import FeedbackFormModal from "./FeedbackFormModal";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const theme = useTheme();

  const { data: config } = useQuery({
    queryKey: ["public-communication-settings"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/communication/public");
      return res.data?.data || {};
    },
    refetchOnWindowFocus: true
  });

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const supportEmail = config?.supportEmail?.email;
  const whatsappUrl = config?.whatsapp?.url;
  const instagramUrl = config?.instagram?.url;
  const twitterUrl = config?.twitter?.url;

  const actions = [
    {
      id: "feedback",
      icon: <MessageSquare size={22} />,
      label: "Send Feedback",
      color: theme.palette.primary.main,
      onClick: () => {
        setModalOpen(true);
        setIsOpen(false);
      },
    },
    ...(supportEmail
      ? [
          {
            id: "email",
            icon: <Mail size={22} />,
            label: "Contact via Email",
            color: "#0284c7",
            onClick: () => {
              window.open(`mailto:${supportEmail}`, "_blank");
              setIsOpen(false);
            },
          },
        ]
      : []),
    ...(whatsappUrl
      ? [
          {
            id: "whatsapp",
            icon: <WhatsAppIcon />,
            label: "Contact via WhatsApp",
            color: "#22c55e",
            onClick: () => {
              window.open(whatsappUrl, "_blank");
              setIsOpen(false);
            },
          },
        ]
      : []),
    ...(instagramUrl
      ? [
          {
            id: "instagram",
            icon: <Instagram size={22} />,
            label: "Contact via Instagram",
            color: "#ec4899",
            onClick: () => {
              window.open(instagramUrl, "_blank");
              setIsOpen(false);
            },
          },
        ]
      : []),
    ...(twitterUrl
      ? [
          {
            id: "twitter",
            icon: <XIcon />,
            label: "Contact via X",
            color: "#171717",
            onClick: () => {
              window.open(twitterUrl, "_blank");
              setIsOpen(false);
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleOpen}
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.15)",
              backdropFilter: "blur(4px)",
              zIndex: 1999,
            }}
          />
        )}
      </AnimatePresence>

      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 2005,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <AnimatePresence>
          {isOpen && (
            <Stack
              component={motion.div}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              sx={{ gap: 1.5, mb: 1, alignItems: "center" }}
            >
              {actions.map((action) => (
                <Tooltip key={action.id} title={action.label} placement="left" arrow>
                  <IconButton
                    onClick={action.onClick}
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: "background.paper",
                      color: action.color,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "background.paper",
                        transform: "scale(1.05)",
                      },
                      transition: "transform 0.15s",
                    }}
                  >
                    {action.icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          )}
        </AnimatePresence>

        <Tooltip title="Help & Support" placement="left" arrow disableHoverListener={isOpen}>
          <IconButton
            onClick={toggleOpen}
            sx={{
              width: 58,
              height: 58,
              bgcolor: isOpen ? "text.primary" : "primary.main",
              color: "white",
              boxShadow: "0 8px 32px rgba(99, 102, 241, 0.3)",
              "&:hover": {
                bgcolor: isOpen ? "text.primary" : "primary.dark",
                transform: "scale(1.03)",
              },
              transition: "background-color 0.2s, transform 0.15s",
            }}
          >
            {isOpen ? <X size={26} /> : <HelpCircle size={26} />}
          </IconButton>
        </Tooltip>
      </Box>

      <FeedbackFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
