// src/contexts/GlobalModalContext.js
"use client";
import React, { createContext, useContext, useState } from "react";

const GlobalModalContext = createContext();

export const useGlobalModal = () => useContext(GlobalModalContext);

export const GlobalModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);

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
            zIndex: 1000, // sit on top of EVERYTHING
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
