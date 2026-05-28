// src/domains/documents/store/useDocumentStore.ts
import create from 'zustand';
import { Document } from '../schemas/documentDefinition';
import { devtools, persist } from 'zustand/middleware';

export type DocumentStoreState = {
  document: Document | null;
  setDocument: (doc: Document) => void;
  markDirty: () => void;
  isDirty: boolean;
  resetDirty: () => void;
};

export const useDocumentStore = create<DocumentStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        document: null,
        isDirty: false,
        setDocument: (doc) => set({ document: doc, isDirty: true }),
        markDirty: () => set({ isDirty: true }),
        resetDirty: () => set({ isDirty: false }),
      }),
      { name: 'document-store', getStorage: () => localStorage }
    ),
    { name: 'DocumentStore' }
  )
);
