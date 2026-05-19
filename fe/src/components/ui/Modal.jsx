// src/contexts/GlobalModalContext.js
"use client";
import React, { createContext, useContext, useState } from "react";
import { useTheme } from "@mui/material";

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
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // zIndex: 10000, // sit on top of EVERYTHING
            zIndex: theme.zIndex.drawer + 2,
            height: "100vh",
            width: "100vw"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              width: "100%",
              margin: "auto",
              // minWidth: "300px",
            }}
          >
            {content}
          </div>
        </div>
      )}
    </GlobalModalContext.Provider>
  );
};
