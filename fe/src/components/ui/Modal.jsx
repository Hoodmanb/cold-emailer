// src/contexts/GlobalModalContext.js
"use client";
import React, { createContext, useContext, useState } from "react";
import { useTheme } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { modalOverlayVariants, modalContentVariants } from "@/motion/variants";

const GlobalModalContext = createContext();

export const useGlobalModal = () => useContext(GlobalModalContext);

export const GlobalModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const theme = useTheme();

  const showModal = (component) => {
    setContent(component);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
  };

  return (
    <GlobalModalContext.Provider value={{ isOpen, showModal, closeModal }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-overlay"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: theme.zIndex.drawer + 2,
              height: "100vh",
              width: "100vw",
            }}
            onClick={closeModal}
          >
            <motion.div
              key="modal-content"
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                width: "100%",
                margin: "auto",
              }}
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlobalModalContext.Provider>
  );
};
