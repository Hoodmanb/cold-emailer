// src/domains/documents/services/exportJobManager.ts
import { promises as fs } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { Document } from "../schemas/documentDefinition";
import { useDocumentStore } from "../store/useDocumentStore";

/** Artifact metadata persisted to artifacts/index.json */
export type ArtifactMeta = {
  artifactId: string;
  documentId: string;
  type: "pdf" | "docx";
  templateId: string;
  checksum: string; // SHA‑256 of the stored binary (Base64)
  createdAt: string;
  status: "completed" | "failed";
};

/** Export job definition */
export type ExportJob = {
  jobId: string;
  documentId: string;
  type: "pdf" | "docx";
  templateId: string;
  idempotencyKey: string; // prevents duplicate work
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
};

/** In‑memory job queue – can be swapped for persistent queue later */
const jobQueue: ExportJob[] = [];

/** Path constants – ensure they exist under the project root */
const ARTIFACT_ROOT = join(process.cwd(), "artifacts");
const PDF_ROOT = join(ARTIFACT_ROOT, "pdf");
const DOCX_ROOT = join(ARTIFACT_ROOT, "docx");
const INDEX_PATH = join(ARTIFACT_ROOT, "index.json");

/** Helper: ensure directories exist */
async function ensureDirs() {
  await fs.mkdir(PDF_ROOT, { recursive: true });
  await fs.mkdir(DOCX_ROOT, { recursive: true });
  await fs.mkdir(ARTIFACT_ROOT, { recursive: true });
}

/** Helper: compute SHA‑256 of a Buffer and return hex string */
function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Helper: load existing artifact index (or create empty) */
async function loadIndex(): Promise<ArtifactMeta[]> {
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf-8");
    return JSON.parse(raw) as ArtifactMeta[];
  } catch {
    return [];
  }
}

/** Helper: persist updated artifact index */
async function saveIndex(index: ArtifactMeta[]) {
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");
}

/** Public API – enqueue a new export job */
export async function enqueueExport(
  documentId: string,
  type: "pdf" | "docx",
  templateId: string,
  idempotencyKey: string
) {
  await ensureDirs();
  // Prevent duplicate jobs with same idempotencyKey
  if (jobQueue.some((j) => j.idempotencyKey === idempotencyKey)) return;

  const job: ExportJob = {
    jobId: uuidv4(),
    documentId,
    type,
    templateId,
    idempotencyKey,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  jobQueue.push(job);
  // Kick off processing (fire‑and‑forget)
  processJob(job).catch((e) => console.error("Export job failed", e));
}

/** Core processing – runs asynchronously */
async function processJob(job: ExportJob) {
  // Update status to processing
  job.status = "processing";
  job.startedAt = new Date().toISOString();

  try {
    // Retrieve document from store (or JSON DB if not loaded)
    const doc = await fetchDocumentById(job.documentId);
    if (!doc) throw new Error(`Document ${job.documentId} not found`);

    // Placeholder: invoke real renderer (PDF or DOCX). Here we simulate a Buffer.
    const rendered: Buffer = await renderDocument(doc, job.type);

    // Compute checksum and write artifact file
    const checksum = sha256(rendered);
    const fileName = `${job.documentId}_${job.type}_${Date.now()}`;
    const filePath = job.type === "pdf" ? join(PDF_ROOT, `${fileName}.pdf`) : join(DOCX_ROOT, `${fileName}.docx`);
    await fs.writeFile(filePath, rendered);

    // Record artifact metadata
    const artifact: ArtifactMeta = {
      artifactId: uuidv4(),
      documentId: job.documentId,
      type: job.type,
      templateId: job.templateId,
      checksum,
      createdAt: new Date().toISOString(),
      status: "completed",
    };
    const index = await loadIndex();
    index.push(artifact);
    await saveIndex(index);

    // Update job status
    job.status = "completed";
    job.finishedAt = new Date().toISOString();
  } catch (err: any) {
    job.status = "failed";
    job.finishedAt = new Date().toISOString();
    job.error = err?.message ?? String(err);
  }
}

/** Mocked renderer – replace with real implementation later */
async function renderDocument(doc: Document, type: "pdf" | "docx"): Promise<Buffer> {
  // For now just return a tiny placeholder Buffer (e.g., empty PDF header).
  if (type === "pdf") {
    return Buffer.from("%PDF-1.4\n%âãÏÓ\n", "utf-8");
  }
  // DOCX – minimal OOXML package placeholder (will be invalid but serves as binary).
  return Buffer.from("PK\x03\x04", "binary");
}

/** Retrieve a document from the in-memory store */
async function fetchDocumentById(id: string): Promise<Document | null> {
  const { document } = useDocumentStore.getState();
  if (document?.id === id) return document;
  return null;
}

/** Export utilities for external use */
export const exportJobManager = {
  enqueueExport,
  // Expose the in‑memory queue for status inspection (read‑only copy)
  getQueue: () => jobQueue.map((j) => ({ ...j })),
};
