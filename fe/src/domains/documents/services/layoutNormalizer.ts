// src/domains/documents/services/layoutNormalizer.ts
import { Document } from "../schemas/documentDefinition";
import { DocumentSection } from "../schemas/sectionTypes";
import { TemplateDescriptor } from "../schemas/templateDescriptor";

/**
 * Pure function – never mutates its arguments.
 * Returns a new Document with sections filtered, sorted, and linked data resolved.
 */
export function normalizeLayout(
  doc: Document,
  template: TemplateDescriptor,
  resolveLinkedBlock: (blockId: string) => DocumentSection | null
) {
  // 1️⃣ Filter hidden sections
  const visibleSections = doc.sections.filter((s) => (s as any).visible !== false);

  // 2️⃣ Sort by explicit order field
  const sorted = [...visibleSections].sort((a, b) => (a as any).order - (b as any).order);

  // 3️⃣ Resolve linked blocks (read‑only lookup provided by caller)
  const resolved = sorted.map((section) => {
    if ((section as any).linked && (section as any).sourceBlockId) {
      const linked = resolveLinkedBlock((section as any).sourceBlockId);
      return linked ? { ...section, ...linked } : section;
    }
    return section;
  });

  // 4️⃣ Attach layout metadata from the template
  const layoutMeta = {
    columns: template.layout.columns,
    spacing: template.layout.spacing,
  } as const;

  return {
    ...doc,
    sections: resolved,
    // embed layout for downstream renderers
    layoutMeta,
  };
}
