# Template Refactor — Backward Compatibility

This document describes compatibility layers ensuring existing clients, routes, and data continue to work.

## API Routes — Unchanged

| Legacy route | Status |
|--------------|--------|
| `GET/POST/PUT/DELETE /api/template` | Unchanged paths and auth |
| `GET/POST/PUT/DELETE /api/document-templates/*` | Unchanged paths |
| `GET /api/system-templates/*` | Unchanged paths |
| `GET /api/documents/resume-templates` | Unchanged (legacy resume skins) |
| `POST /api/workflow/generate-selected` | Unchanged `templateIds` shape |

## API Response Compatibility

### Document template lists

**New canonical shape:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "starredIds": ["uuid"]
  }
}
```

**Legacy aliases preserved in same payload:**
- `data.templates` === `data.items`
- `data.count` === `data.total`

**Frontend normalizer** (`normalizeTemplateListResponse`) accepts:
1. Raw array (oldest backend behavior)
2. `{ templates, starredIds }` (expected frontend shape)
3. `{ items, starredIds, total, page }` (new canonical shape)

### Email template update

**Before:** `{ message, template: {...} }`  
**After:** `{ message, data: {...}, template: {...} }` — both keys present.

### Email template list

**Before:** `{ message, data: [...] }` — unchanged.

## Import Path Compatibility

| Legacy import | Still works? |
|---------------|--------------|
| `@/hooks/queryHooks/documentTemplates` | Yes — re-exports |
| `@/hooks/queryHooks/templates` | Yes — `useGetTemplates` alias preserved |
| `@/hooks/queryHooks/systemTemplates` | Yes — re-exports |
| `@/types/documentTemplate` | Yes — re-exports unified types |
| `@/components/templates/TemplateSelector` | Yes — unchanged path |
| `@/components/template/*` | Yes — unchanged paths |

## Database Record Compatibility

### `document_templates.content` JSONB

No migration. Existing records load correctly because:
- `fromRow()` still reads `layout`, `blocks`, `style`, `aiRules`, `status`, `approvalStatus`
- `enrichTemplateWithStructure()` derives `structure` at read time if absent
- Legacy `pending_approval` maps to lifecycle `submitted` in domain model only

### `templates` (email)

No migration. `mapEmailRow()` sets default `approvalStatus: 'approved'` when missing so UI visibility works.

### `users.starredTemplates`

Unchanged array of template UUIDs on user record.

## Builder URL Compatibility

| Old URL | Behavior |
|---------|----------|
| `/dashboard/templates/builder` | Now opens **create** mode (blank template) |
| `/dashboard/templates/builder?templateId=X` | Treated as **fork** mode (loads system template if `source` omitted) |
| New: `?mode=edit&templateId=X&source=user` | Edit user template |

Old bookmark URLs for system customize still work via fork default.

## AI Pipeline Compatibility

`resolvePipelineTemplate(options, documentType)` signature unchanged. Internally delegates to unified engine; return shape `{ template, promptSuffix, postProcess }` unchanged.

## Components Unchanged (by design)

- Visual design and MUI styling
- Tab structure on `/dashboard/templates`
- `GeneratePanel` UX flow
- `DocumentGeneratorModal` (including legacy `resumeTemplateId` path)
- `TemplatePreview` iframe component

## Deprecated (still functional)

| Item | Replacement | Removal timeline |
|------|-------------|------------------|
| `useGetTemplates()` | `useEmailTemplates()` | Next major version |
| Direct `renderJsonTemplate` from controllers | `templateEngineCore.renderHtml` | Gradual |
| Client-only rendering for export | Server engine | When PDF pipeline unified |

## Breaking Changes

**None intentional.** If a client parsed only `data` as an array for document lists, the normalizer on the frontend fixes this. Raw-array responses from older backend versions still work via `normalizeTemplateListResponse`.

## Rollback Strategy

1. Revert `documentTemplateController` list handlers to return raw arrays (frontend normalizer still handles both).
2. Revert builder to system-only load (loses edit/create fixes).
3. Domain layer is additive — removing `server/domains/templates/` restores prior `templateContext.js` inline logic if needed.
