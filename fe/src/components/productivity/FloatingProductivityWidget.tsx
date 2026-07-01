"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { Zap, Send, FileText, X } from "lucide-react";
import { Box, Tooltip, IconButton, useTheme, Stack } from "@mui/material";
import { useProductivity } from "@/context/ProductivityContext";

const STORAGE_KEY = "job-bot:productivity-widget:side";
const WIDGET_SIZE = 68;
const SAFE_MARGIN = 16;

type DockSide = "left" | "right";

interface DockPosition {
  side: DockSide;
  y: number;
}

/**
 * Reads the saved widget position from localStorage synchronously.
 * Always returns a valid {x, y, side, rawY} — falls back to bottom-right corner.
 * Safe to call on server (returns default values when window is undefined).
 */
function readSavedPosition(): {
  x: number;
  y: number;
  side: DockSide;
  rawY: number;
} {
  if (typeof window === "undefined") {
    return { x: 0, y: 200, side: "right", rawY: 200 };
  }

  const defaultSide: DockSide = "right";
  const defaultRawY = window.innerHeight - WIDGET_SIZE - SAFE_MARGIN - 80;
  const defaultX = window.innerWidth - WIDGET_SIZE - SAFE_MARGIN;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DockPosition;
      if (parsed?.side === "left" || parsed?.side === "right") {
        const x =
          parsed.side === "left"
            ? SAFE_MARGIN
            : window.innerWidth - WIDGET_SIZE - SAFE_MARGIN;
        // Clamp Y so it's always on-screen even if viewport changed
        const clampedY = Math.max(
          SAFE_MARGIN,
          Math.min(parsed.y, window.innerHeight - WIDGET_SIZE - SAFE_MARGIN)
        );
        return { x, y: clampedY, side: parsed.side, rawY: parsed.y };
      }
    }
  } catch {
    // ignore malformed JSON
  }

  return { x: defaultX, y: defaultRawY, side: defaultSide, rawY: defaultRawY };
}

export default function FloatingProductivityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { openModal } = useProductivity();
  const theme = useTheme();
  const controls = useAnimation();

  // Tracks current dock side + y for resize snapping
  const posRef = useRef<DockPosition>({ side: "right", y: 200 });

  /**
   * useLayoutEffect fires synchronously after the DOM mutation but
   * BEFORE the browser paints — so the widget is placed at its saved
   * position before the user sees a single frame.
   *
   * controls.set() updates the Framer Motion value without animating,
   * ensuring the motion.div (which has initial={false}) renders exactly
   * at the saved position on first paint.
   */
  useLayoutEffect(() => {
    const pos = readSavedPosition();
    posRef.current = { side: pos.side, y: pos.rawY };
    controls.set({ x: pos.x, y: pos.y });
    setHydrated(true);
  }, [controls]);

  // Re-snap to the correct edge when the viewport is resized
  useEffect(() => {
    const handleResize = () => {
      const { side, y } = posRef.current;
      const targetX =
        side === "left"
          ? SAFE_MARGIN
          : window.innerWidth - WIDGET_SIZE - SAFE_MARGIN;

      const minY = SAFE_MARGIN;
      const maxY = window.innerHeight - WIDGET_SIZE - SAFE_MARGIN;
      const clampedY = Math.max(minY, Math.min(y, maxY));

      posRef.current = { side, y: clampedY };
      controls.start({
        x: targetX,
        y: clampedY,
        transition: { type: "spring", stiffness: 350, damping: 28 },
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [controls]);

  const handleWidgetTap = () => {
    if (!dragging) {
      setIsOpen((prev) => !prev);
    }
  };

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

  // Don't render at all until position is set (happens before first paint via useLayoutEffect)
  if (!hydrated) return null;

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      <AnimatePresence>
        {isOpen && (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
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

      {/* Draggable Widget Container — fixed size, never resizes */}
      <Box
        component={motion.div}
        drag={!isOpen}
        dragMomentum={false}
        dragElastic={0.08}
        // initial={false} → Framer skips the entry animation entirely and
        // uses the value already set by controls.set() — no jump, no flash.
        initial={false}
        animate={controls}
        onDragStart={() => setDragging(true)}
        onDragEnd={(event, info) => {
          setTimeout(() => setDragging(false), 50);

          const width = window.innerWidth;
          const endX = info.point.x;
          const side: DockSide = endX < width / 2 ? "left" : "right";

          const targetX =
            side === "left"
              ? SAFE_MARGIN
              : width - WIDGET_SIZE - SAFE_MARGIN;

          const minY = SAFE_MARGIN;
          const maxY = window.innerHeight - WIDGET_SIZE - SAFE_MARGIN;
          const targetY = Math.max(
            minY,
            Math.min(info.point.y - WIDGET_SIZE / 2, maxY)
          );

          posRef.current = { side, y: targetY };

          controls.start({
            x: targetX,
            y: targetY,
            transition: { type: "spring", stiffness: 350, damping: 25 },
          });

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ side, y: targetY })
          );
        }}
        onTap={handleWidgetTap}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 2005,
          width: WIDGET_SIZE,
          height: WIDGET_SIZE,
          touchAction: "none",
          cursor: isOpen ? "pointer" : dragging ? "grabbing" : "grab",
        }}
      >
        {/* Action buttons — absolutely positioned above trigger, never affect layout */}
        <AnimatePresence>
          {isOpen && (
            <Stack
              component={motion.div}
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              sx={{
                position: "absolute",
                bottom: "calc(100% + 12px)",
                left: 0,
                right: 0,
                gap: 1.5,
                alignItems: "center",
                overflow: "visible",
              }}
            >
              {actions.map((action) => (
                <Tooltip
                  key={action.id}
                  title={action.label}
                  placement={posRef.current.side === "left" ? "right" : "left"}
                  arrow
                >
                  <IconButton
                    onClick={action.onClick}
                    component={motion.button}
                    whileHover={{ scale: 1.12, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    sx={{
                      width: 54,
                      height: 54,
                      bgcolor: "background.paper",
                      color: action.color,
                      boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "background.paper",
                      },
                    }}
                  >
                    {action.icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button — always at a fixed position */}
        <IconButton
          component={motion.button}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          sx={{
            width: WIDGET_SIZE,
            height: WIDGET_SIZE,
            bgcolor: isOpen ? "text.primary" : "primary.main",
            color: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            position: "absolute",
            inset: 0,
            "&:hover": {
              bgcolor: isOpen ? "text.primary" : "primary.main",
            },
          }}
        >
          {isOpen ? <X size={26} /> : <Zap size={26} />}
        </IconButton>
      </Box>
    </>
  );
}