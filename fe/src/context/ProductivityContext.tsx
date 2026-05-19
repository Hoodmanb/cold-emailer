"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ProductivityModalType = "none" | "mail" | "assistant" | "generator";

interface ProductivityContextType {
  activeModal: ProductivityModalType;
  openModal: (type: ProductivityModalType, data?: any) => void;
  closeModal: () => void;
  modalData: any;
}

const ProductivityContext = createContext<ProductivityContextType | undefined>(undefined);

export function ProductivityProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ProductivityModalType>("none");
  const [modalData, setModalData] = useState<any>(null);

  const openModal = (type: ProductivityModalType, data?: any) => {
    setModalData(data || null);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal("none");
    setModalData(null);
  };

  return (
    <ProductivityContext.Provider value={{ activeModal, openModal, closeModal, modalData }}>
      {children}
    </ProductivityContext.Provider>
  );
}

export function useProductivity() {
  const context = useContext(ProductivityContext);
  if (context === undefined) {
    throw new Error("useProductivity must be used within a ProductivityProvider");
  }
  return context;
}
