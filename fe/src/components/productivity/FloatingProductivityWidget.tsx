"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, Send, FileText, X } from "lucide-react";
import { Box, Tooltip, IconButton, useTheme, Stack } from "@mui/material";
import { useProductivity } from "@/context/ProductivityContext";

const STORAGE_KEY = "job-bot:productivity-widget:side";
const WIDGET_SIZE = 68;
const SAFE_MARGIN = 16;
const DRAG_THRESHOLD = 5;

type DockSide = "left" | "right";

interface DockPosition {
  side: DockSide;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function getViewport() {
  if (typeof window === "undefined") return { width: 1200, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function getYBounds() {
  const { height } = getViewport();
  return {
    min: SAFE_MARGIN,
    max: height - WIDGET_SIZE - SAFE_MARGIN,
  };
}

function getSideX(side: DockSide) {
  const { width } = getViewport();
  return side === "left" ? SAFE_MARGIN : width - WIDGET_SIZE - SAFE_MARGIN;
}

export default function FloatingProductivityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pos, setPos] = useState<DockPosition>({ side: "right", y: 200 });
  const [dragging, setDragging] = useState(false);
  const { openModal } = useProductivity();
  const theme = useTheme();

  const posRef = useRef(pos);
  const dragStartRef = useRef<{ pointerY: number; startY: number; side: DockSide } | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);

  const applyPosition = useCallback((next: DockPosition, persist = false) => {
    const { min, max } = getYBounds();
    const clamped: DockPosition = {
      side: next.side,
      y: clamp(next.y, min, max),
    };
    posRef.current = clamped;
    setPos(clamped);
    if (persist) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DockPosition;
        if (parsed?.side === "left" || parsed?.side === "right") {
          applyPosition(parsed);
        }
      } else {
        const { height } = getViewport();
        applyPosition({ side: "right", y: height - WIDGET_SIZE - SAFE_MARGIN - 80 });
      }
    } catch {
      applyPosition({ side: "right", y: 200 });
    }
    setHydrated(true);
  }, [applyPosition]);

  useEffect(() => {
    const onResize = () => applyPosition(posRef.current, true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyPosition]);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (isOpen) return;
    dragMovedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerY: event.clientY,
      startY: posRef.current.y,
      side: posRef.current.side,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragStartRef.current || isOpen) return;
    const deltaY = event.clientY - dragStartRef.current.pointerY;

    if (Math.abs(deltaY) > DRAG_THRESHOLD) {
      dragMovedRef.current = true;
    }

    const { min, max } = getYBounds();
    const nextY = clamp(dragStartRef.current.startY + deltaY, min, max);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      posRef.current = { ...posRef.current, y: nextY };
      setPos((prev) => ({ ...prev, y: nextY }));
    });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);

    const { width } = getViewport();
    const centerX = event.clientX;
    const side: DockSide = centerX < width / 2 ? "left" : "right";

    applyPosition({ side, y: posRef.current.y }, true);
    dragStartRef.current = null;
    setDragging(false);

    // Only toggle if it was a click, not a drag
    if (!dragMovedRef.current && !isOpen) {
      setIsOpen(true);
    }
  };

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const actions = [
    {
      id: "assistant",
      icon: <Zap size={22} />,
      label: "AI Assistant",
      color: theme.palette.primary.main,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal("assistant");
        setIsOpen(false);
      },
    },
    {
      id: "mail",
      icon: <Send size={22} />,
      label: "Send Mail",
      color: "#10b981",
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal("mail");
        setIsOpen(false);
      },
    },
    {
      id: "generator",
      icon: <FileText size={22} />,
      label: "Generate Doc",
      color: "#f59e0b",
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal("generator");
        setIsOpen(false);
      },
    },
  ];

  if (!hydrated) return null;

  const x = getSideX(pos.side);

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
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 2005,
          transform: `translate3d(${x}px, ${pos.y}px, 0)`,
          transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          touchAction: "none",
          willChange: "transform",
          width: WIDGET_SIZE,
          height: "auto",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <AnimatePresence>
          {isOpen && (
            <Stack
              component={motion.div}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              sx={{ gap: 2, mb: 1, alignItems: "center" }}
            >
              {actions.map((action) => (
                <Tooltip key={action.id} title={action.label} placement="left" arrow>
                  <IconButton
                    onClick={action.onClick}
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: "background.paper",
                      color: action.color,
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                      border: "1px solid",
                      borderColor: "divider",
                      pointerEvents: "auto",
                    }}
                  >
                    {action.icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          )}
        </AnimatePresence>

        <IconButton
          // REMOVED: onClick={handleClick}
          sx={{
            width: WIDGET_SIZE,
            height: WIDGET_SIZE,
            bgcolor: isOpen ? "text.primary" : "primary.main",
            color: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            cursor: isOpen ? "pointer" : dragging ? "grabbing" : "grab",
            pointerEvents: "auto",
            flexShrink: 0,
          }}
        >
          {isOpen ? <X size={28} /> : <Zap size={28} />}
        </IconButton>
      </Box>
    </>
  );
}