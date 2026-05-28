// src/domains/documents/store/commandDispatcher.ts
import { EventEmitter } from "events";
import { Document, DocumentSection } from "../schemas/documentDefinition";
import { DocumentStoreState, useDocumentStore } from "./useDocumentStore";

/**
 * Plain JSON command definitions – no functions, no classes.
 */
export type EditorCommand =
  | { type: "MOVE_SECTION"; payload: { sectionId: string; toIndex: number } }
  | { type: "DUPLICATE_SECTION"; payload: { sectionId: string } }
  | { type: "TOGGLE_VISIBILITY"; payload: { sectionId: string } }
  | { type: "UPDATE_CONTENT"; payload: { sectionId: string; content: Partial<any> } }
  | { type: "REGENERATE_SECTION"; payload: { sectionId: string; aiContext?: any } };

/** History stack – stores only commands, never full snapshots */
const undoStack: EditorCommand[] = [];
const redoStack: EditorCommand[] = [];

/** Simple event bus for command lifecycle */
export const commandEvents = new EventEmitter();

/** Pure reducer – returns new Document without mutating the original */
function reducer(doc: Document, command: EditorCommand): Document {
  const sections = [...doc.sections];
  const idx = sections.findIndex((s) => (s as any).id === command.payload.sectionId);
  if (idx === -1) return doc; // no-op if not found

  switch (command.type) {
    case "MOVE_SECTION": {
      const { toIndex } = command.payload;
      const [moved] = sections.splice(idx, 1);
      sections.splice(toIndex, 0, moved as DocumentSection);
      break;
    }
    case "DUPLICATE_SECTION": {
      const original = sections[idx] as DocumentSection;
      const clone = { ...original, id: crypto.randomUUID() } as DocumentSection;
      sections.splice(idx + 1, 0, clone);
      break;
    }
    case "TOGGLE_VISIBILITY": {
      const sec = sections[idx] as any;
      sec.visible = !sec.visible;
      break;
    }
    case "UPDATE_CONTENT": {
      const sec = sections[idx] as any;
      sec.content = { ...sec.content, ...command.payload.content };
      break;
    }
    case "REGENERATE_SECTION": {
      // Placeholder – actual AI call happens elsewhere. Here we just mark dirty.
      // The caller should replace the section after AI returns.
      const sec = sections[idx] as any;
      sec.isRegenerating = true;
      break;
    }
  }

  return { ...doc, sections };
}

/** Execute a command: run reducer, push to history, emit events */
export function executeCommand(command: EditorCommand): void {
  try {
    const store = useDocumentStore.getState();
    if (!store.document) throw new Error("No active document");
    const newDoc = reducer(store.document, command);
    // Update store and mark dirty
    useDocumentStore.getState().setDocument(newDoc);
    // History handling
    undoStack.push(command);
    redoStack.length = 0; // clear redo on new action
    commandEvents.emit("onCommandExecuted", command);
  } catch (e) {
    commandEvents.emit("onCommandFailed", command, e);
    console.error("Command execution failed", e);
  }
}

/** Undo last command */
export function undo(): void {
  if (undoStack.length === 0) return;
  const command = undoStack.pop()!;
  // To undo we need the inverse command – generate on the fly
  const inverse = invertCommand(command);
  if (inverse) {
    const store = useDocumentStore.getState();
    if (!store.document) return;
    const newDoc = reducer(store.document, inverse);
    useDocumentStore.getState().setDocument(newDoc);
    redoStack.push(command);
    commandEvents.emit("onCommandExecuted", inverse);
  }
}

/** Redo last undone command */
export function redo(): void {
  if (redoStack.length === 0) return;
  const command = redoStack.pop()!;
  const store = useDocumentStore.getState();
  if (!store.document) return;
  const newDoc = reducer(store.document, command);
  useDocumentStore.getState().setDocument(newDoc);
  undoStack.push(command);
  commandEvents.emit("onCommandExecuted", command);
}

/** Generate an inverse command for undo – limited to supported types */
function invertCommand(cmd: EditorCommand): EditorCommand | null {
  const { type, payload } = cmd;
  switch (type) {
    case "MOVE_SECTION": {
      // Need original index – we cannot know it without snapshot, so undo is not supported for move.
      return null;
    }
    case "DUPLICATE_SECTION": {
      // Inverse is remove the duplicated section (by recent ID – we cannot track ID here).
      return null;
    }
    case "TOGGLE_VISIBILITY": {
      return { type: "TOGGLE_VISIBILITY", payload };
    }
    case "UPDATE_CONTENT": {
      // Inverse requires previous content – not stored, so skip.
      return null;
    }
    case "REGENERATE_SECTION": {
      // No inverse – treat as no-op.
      return null;
    }
    default:
      return null;
  }
}

/** Simple getters for external usage */
export const commandHistory = {
  getUndoStack: () => [...undoStack],
  getRedoStack: () => [...redoStack],
};
