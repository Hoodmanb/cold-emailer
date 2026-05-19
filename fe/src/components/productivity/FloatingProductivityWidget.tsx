"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  FileText, 
  Plus, 
  X,
  Zap
} from "lucide-react";
import { 
  Box, 
  Tooltip, 
  IconButton,
  useTheme,
  Paper,
  Portal
} from "@mui/material";
import { useProductivity } from "@/context/ProductivityContext";

const STORAGE_KEY = "job-bot:productivity-widget:pos";

export default function FloatingProductivityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { openModal } = useProductivity();
  const theme = useTheme();
  const constraintsRef = useRef(null);

  // Persistence logic
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPos(JSON.parse(saved));
      } catch (e) {}
    }
    setHydrated(true);
  }, []);

  const handleDragEnd = (_: any, info: any) => {
    const newPos = { x: pos.x + info.offset.x, y: pos.y + info.offset.y };
    setPos(newPos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos));
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  const actions = [
    { 
      id: "assistant", 
      icon: <Zap size={22} />, 
      label: "AI Assistant", 
      color: theme.palette.primary.main,
      onClick: (e: any) => {
        e.stopPropagation();
        openModal("assistant");
        setIsOpen(false);
      }
    },
    { 
      id: "mail", 
      icon: <Send size={22} />, 
      label: "Send Mail", 
      color: "#10b981", // Emerald
      onClick: (e: any) => {
        e.stopPropagation();
        openModal("mail");
        setIsOpen(false);
      }
    },
    { 
      id: "generator", 
      icon: <FileText size={22} />, 
      label: "Generate Doc", 
      color: "#f59e0b", // Amber
      onClick: (e: any) => {
        e.stopPropagation();
        openModal("generator");
        setIsOpen(false);
      }
    },
  ];

  if (!hydrated) return null;

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
              bgcolor: "rgba(0,0,0,0.1)",
              backdropFilter: "blur(4px)",
              zIndex: 1999,
            }}
          />
        )}
      </AnimatePresence>

      <Box
        ref={constraintsRef}
        sx={{
          position: "fixed",
          inset: 30,
          pointerEvents: "none",
          zIndex: 2000,
        }}
      />

      <Box
        component={motion.div}
        drag={!isOpen}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        initial={pos}
        animate={isOpen ? { x: pos.x, y: pos.y } : {}}
        sx={{
          position: "fixed",
          bottom: 30,
          right: 30,
          zIndex: 2005,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          pointerEvents: "auto",
          touchAction: "none", // Prevent scroll interference
        }}
      >
        <AnimatePresence>
          {isOpen && (
            <Stack
              component={motion.div}
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
              }}
              sx={{ gap: 2, mb: 1 }}
            >
              {actions.map((action) => (
                <Tooltip 
                  key={action.id} 
                  title={action.label} 
                  placement="left" 
                  arrow
                  slotProps={{
                    popper: {
                      sx: { zIndex: 3000 }
                    }
                  }}
                >
                  <Box
                    component={motion.div}
                    variants={{
                      show: { opacity: 1, y: 0, scale: 1 },
                      hidden: { opacity: 0, y: 20, scale: 0.8 }
                    }}
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      onClick={action.onClick}
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: "background.paper",
                        color: action.color,
                        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": {
                          bgcolor: "background.paper",
                          boxShadow: "0 15px 50px rgba(0,0,0,0.22)",
                        },
                      }}
                    >
                      {action.icon}
                    </IconButton>
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          )}
        </AnimatePresence>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconButton
            onClick={toggleOpen}
            sx={{
              width: 68,
              height: 68,
              bgcolor: isOpen ? "text.primary" : "primary.main",
              color: "white",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              cursor: isOpen ? "pointer" : "grab",
              "&:active": { cursor: isOpen ? "pointer" : "grabbing" },
              "&:hover": {
                bgcolor: isOpen ? "text.primary" : "primary.dark",
                boxShadow: "0 15px 50px rgba(0,0,0,0.3)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <motion.div
              animate={{ rotate: isOpen ? 135 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{ display: "flex" }}
            >
              {isOpen ? <X size={32} /> : <Zap size={32} />}
            </motion.div>
          </IconButton>
        </motion.div>
      </Box>
    </>
  );
}

// Simple Stack component if not using MUI Stack or if missing
function Stack({ children, sx, ...props }: any) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
