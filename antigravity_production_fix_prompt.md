# Production Readiness Fix Prompt for Antigravity

## Context

You are working on an MVP application with real auth, email/templates/documents, billing, and an admin panel. A full audit revealed significant production debt scoring 5.5/10. You must fix ALL issues below in order of priority.

---

## PHASE 1: CRITICAL FIXES (Must complete before any deployment)

### TASK 1.1: Resolve Dual Scheduler Systems (B1)

**Problem:** Two backends touch scheduling:

- **Legacy:** `/api/schedule`, `GET /api/schedule/run` — used by frontend via `useGetSchedule`, `CreateSchedule`, `ScheduleList`
- **QStash:** `/api/scheduler/*`, `/api/webhooks/qstash` — ZERO frontend calls
  Both read/write `schedules.json`. Risk: duplicate sends, race conditions.

**Required Actions:**

1. **DECISION:** Pick ONE system. Recommended: Migrate frontend to QStash (`/api/scheduler/*`) and retire legacy, OR keep legacy and fully remove QStash code.
2. If migrating to QStash:
   - Update `useGetSchedule`, `CreateSchedule`, `ScheduleList` to call `/api/scheduler/*` endpoints
   - Ensure QStash scheduler reads/writes the same `schedules.json` format as legacy
   - Update `scheduleRepository.js` or create adapter if data shapes differ
   - Remove legacy routes: `/api/schedule/*` and `email/scheduler.js`
   - Remove legacy hooks: `useGetSchedule` (legacy version), old `CreateSchedule`
3. If keeping legacy:
   - Delete entire QStash module: `modules/scheduler/*`, `/api/scheduler/*`, `/api/webhooks/qstash`
   - Remove QStash environment variables from config
   - Ensure `SCHEDULER_ENABLED` flag only controls legacy path
4. **Verify:** No duplicate schedule execution paths exist. Only one system writes to `schedules.json`.

---

### TASK 1.2: Lock Down Template Approval (B2)

**Problem:** `approveTemplate` / `rejectTemplate` in `templateService.js` have NO role check. Any authenticated user can moderate community templates. `PendingApprovalQueue.tsx` exposes approve/reject UI to all users.

**Required Actions:**

1. **Backend:** Add `requireAdmin` middleware to routes:
   - `POST /api/document-templates/:id/approve`
   - `POST /api/document-templates/:id/reject`
   - Verify middleware exists in auth stack; if not, create it checking `req.user.role === 'admin'`
2. **Frontend:** In `PendingApprovalQueue.tsx`:
   - Conditionally render approve/reject buttons ONLY if `user.role === 'admin'`
   - Import `useAuth` or equivalent to get current user role
   - For non-admin users: show "Pending Approval" badge but hide action buttons
3. **Alternative (if community moderation is intended):** Add explicit "moderator" role; do NOT leave it open to any authenticated user.
4. **Verify:** Test with non-admin token — should get 403 on approve/reject API calls.

---

### TASK 1.3: Fix Broken Route — `/dashboard/documents/create` (B3)

**Problem:** `DocumentTemplatesSection.tsx` links to `/dashboard/documents/create`, but only `fe/src/app/dashboard/documents/page.tsx` exists. Navigation 404s.

**Required Actions:**

1. Check if `/dashboard/documents/create` page is actually needed:
   - If YES: Create `fe/src/app/dashboard/documents/create/page.tsx` with document creation form
   - If NO: Remove the link from `DocumentTemplatesSection.tsx` and redirect to `/dashboard/documents` instead
2. **Verify:** Clicking "Create Document" from any UI surface never 404s.

---

## PHASE 2: HIGH PRIORITY FIXES

### TASK 2.1: Replace Mock Schedule History (C1)

**Problem:** `ScheduleHistory.tsx` uses hardcoded 2023 campaigns. `/dashboard/schedules/history` renders fake data with no API.

**Required Actions:**

1. **Backend:** Create execution log system:
   - Add `scheduleExecutions.json` (or reuse `schedules.json` with execution array)
   - Create `GET /api/schedule/history` or `/api/scheduler/history` (match your TASK 1.1 decision)
   - Return real execution records: `{ id, scheduleId, status, executedAt, recipientCount, error? }`
   - Log executions when scheduler actually sends emails
2. **Frontend:** Update `ScheduleHistory.tsx`:
   - Replace hardcoded data with fetch from new history API
   - Use React Query or existing data pattern
   - Handle empty state: "No scheduled campaigns yet"
3. **Alternative (if no history needed):** Remove `/dashboard/schedules/history` nav item and delete `ScheduleHistory.tsx`
4. **Verify:** History page shows real data or is removed entirely.

---

### TASK 2.2: Fix Cron Route Authentication (C2)

**Problem:** `GET /api/schedule/run` requires JWT. External cron cannot trigger it.

**Required Actions:**

1. **DECISION:** Is this route meant for external cron or manual trigger only?
   - **If external cron:** Add cron secret authentication:
     - Accept `X-Cron-Secret` header
     - Validate against `process.env.CRON_SECRET`
     - Do NOT require JWT when valid cron secret is present
     - Return 401 if neither valid JWT nor valid cron secret
   - **If manual only:** Document this clearly; consider renaming to `/api/schedule/trigger-manual`
2. **If using QStash (from TASK 1.1):** Ensure `/api/webhooks/qstash` verifies QStash signature (`verify.js` module) and does NOT use JWT.
3. **Verify:** Test with curl — no JWT, with/without cron secret. Test with JWT still works.

---

### TASK 2.3: Standardize JSON Store Shapes (C3)

**Problem:** `credits_wallets.json` had mixed shapes (`{ __scoped: true, users: {} }` vs arrays). Other global files may still drift. Admin code expects arrays but some files use scoped objects.

**Required Actions:**

1. **Audit ALL JSON stores:**
   - `users.json` — check shape
   - `schedules.json` — check shape
   - `templates.json` — check shape
   - `documents.json` — check shape
   - `billing.json` — check shape
   - Any other `.json` data files
2. **Standardize on ONE pattern per file:**
   - Either always use `{ __scoped: true, data: {} }` OR always use arrays
   - Document the chosen shape in a `DATA_SHAPES.md` file
3. **Create normalization helpers:**
   - For each store, create `readXxx()` and `writeXxx()` that handle shape normalization
   - Example pattern from `walletRepository`: `readWalletList()` / `writeWalletList()`
   - Apply to all repositories
4. **Add startup validation:**
   - On server boot, run shape check for all JSON files
   - Auto-repair using `billingBootstrap.repairWalletStoreShape` pattern
   - Log warnings if repairs are made
5. **Verify:** All admin pages load without "expected array got object" errors.

---

### TASK 2.4: Add Meaningful Tests (C4)

**Problem:** Only ~5 placeholder tests exist. No real component, auth, billing, or send flow coverage.

**Required Actions:**

1. **Backend tests** (`server/tests/`):
   - Auth: test login returns JWT, protected routes reject missing/invalid JWT
   - Admin guard: test `/api/admin/*` rejects non-admin users
   - Template approval: test non-admin gets 403 on approve/reject
   - Scheduler: test create schedule, execute schedule, history logging
   - Billing: test credit deduction, wallet read/write
2. **Frontend tests** (`fe/src/__tests__/`):
   - Auth context: test login state persists, logout clears state
   - Admin layout: test redirects non-admin users
   - Template list: test renders templates, filters by category
   - Schedule form: test validation, submit calls correct API
3. **Integration tests:**
   - Full flow: register → login → create template → schedule email → verify history
   - Use existing test DB or mock JSON stores
4. **Remove placeholder tests** that just test `true === true`
5. **Verify:** `npm test` passes with >20 meaningful tests covering critical paths.

---

### TASK 2.5: Clean Up QStash Environment Coupling (C5)

**Problem:** QStash module exists but is unused by frontend. If `SCHEDULER_ENABLED=true` in prod without full wiring, adds dead complexity.

**Required Actions:**

1. If TASK 1.1 chose to keep legacy: **Fully remove QStash**
   - Delete `modules/scheduler/`
   - Delete `/api/scheduler/*` routes
   - Delete `/api/webhooks/qstash`
   - Remove `SCHEDULER_ENABLED` env var or make it control legacy only
   - Remove QStash-related dependencies from `package.json`
2. If TASK 1.1 chose QStash: **Fully wire it**
   - Ensure all frontend scheduler components use QStash endpoints
   - Document QStash env vars: `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, etc.
   - Verify `verify.js` signature checking is active
3. **Verify:** No dead QStash code remains if legacy chosen; no uncallable legacy code remains if QStash chosen.

---

## PHASE 3: MEDIUM PRIORITY FIXES

### TASK 3.1: Remove Orphan Frontend Components (D1)

**Problem:** These files exist but are never imported:

- `DesignTemplatesSection.tsx`
- `DocumentTemplatesSection.tsx` (if not used after TASK 1.3)
- `fe/src/components/layout/Attachment.tsx`
- `AddAttachment.tsx`
- `useFetchAttachment` in `attachment.ts`

**Required Actions:**

1. **Verify non-usage:** Search entire codebase for imports of each file
2. **Delete confirmed orphans:**
   - `DesignTemplatesSection.tsx`
   - `fe/src/components/layout/Attachment.tsx`
   - `AddAttachment.tsx`
   - `attachment.ts` (the legacy hook file)
3. **For `DocumentTemplatesSection.tsx`:**
   - If TASK 1.3 created `/dashboard/documents/create`, this may still be unused
   - If it has unique functionality, integrate it into documents page OR delete it
4. **Verify:** Build passes (`npm run build`) with no "module not found" errors from deleted files.

---

### TASK 3.2: Deduplicate Attachment Hooks (D2)

**Problem:** `queryHooks/index.ts` exports both `attachment.ts` (legacy useState) and `attachments.ts` (React Query). Two patterns for same domain.

**Required Actions:**

1. **Determine canonical pattern:** Check which one is actually used in production components
   - `AttachmentPicker` likely uses `attachments.ts` (React Query)
   - Old `AddAttachment` used `attachment.ts` (being deleted in TASK 3.1)
2. **Keep only React Query version:**
   - Delete `attachment.ts`
   - Update `queryHooks/index.ts` to export only `attachments.ts`
   - Rename `attachments.ts` to `attachment.ts` if you want cleaner naming, OR keep name and update imports
3. **Verify:** All attachment-related features (upload, list, picker) work with single hook source.

---

### TASK 3.3: Integrate Data Consistency Service (D3)

**Problem:** `dataConsistencyService.js` audits attachment references but is not run on startup or exposed in admin UI.

**Required Actions:**

1. **Auto-run on startup:**
   - Add `dataConsistencyService.audit()` call in server bootstrap
   - Log results: "Data consistency check: X orphaned attachments found"
   - Do NOT auto-delete; just log warnings
2. **Add admin UI trigger:**
   - In admin panel (Models Catalog or System section), add "Run Data Consistency Check" button
   - Call `POST /api/admin/consistency-check` (create if missing)
   - Display results: orphaned attachments, broken references, etc.
3. **Expand checks:**
   - Verify all `attachmentId`s in templates exist in `attachments.json`
   - Verify all `templateId`s in schedules exist
   - Verify all `userId`s in wallets exist in `users.json`
4. **Verify:** Startup shows consistency log; admin button returns actionable report.

---

### TASK 3.4: Fix Admin Moderation UX Split (D4)

**Problem:** Community tab shows pending approvals to everyone; admin has no dedicated moderation queue.

**Required Actions:**

1. **Move moderation to admin:**
   - Create `/admin/moderation` page or add to existing admin section
   - Move `PendingApprovalQueue.tsx` content OR create admin-specific version
   - Admin queue shows: template preview, approve/reject buttons, submitter info
2. **Update Community tab:**
   - Remove `PendingApprovalQueue` from community page
   - For non-admin users: show only approved community templates
   - Add "Submit for Approval" button for user templates
3. **Backend:** Ensure `GET /api/document-templates?status=pending` is admin-only
4. **Verify:** Non-admin community page shows no pending queue; admin moderation page works.

---

### TASK 3.5: Fix AddAttachment Hook Pattern (D5)

**Problem:** `AddAttachment` uses `useFetchCategory("/api/attachment")` — wrong hook for wrong API. (Note: if AddAttachment is deleted in TASK 3.1, this is auto-resolved. If kept, fix it.)

**Required Actions:**

1. If `AddAttachment.tsx` was kept (unlikely): Replace `useFetchCategory` with proper attachment hook from `attachments.ts`
2. If deleted: Mark as resolved
3. **Verify:** No `useFetchCategory` calls with `/api/attachment` path anywhere in codebase.

---

## PHASE 4: LOW PRIORITY / POLISH

### TASK 4.1: Complete Badge/Placeholder Coverage

**Problem:** Some template states lack visual indicators (e.g., "Pending", "Rejected", "Expired").

**Required Actions:**

1. Audit all template card components:
   - `EmailTemplateCard`
   - `DocumentTemplateCard`
   - `CommunityTemplateCard`
2. Ensure every status has a corresponding badge color:
   - `approved` → green
   - `pending` → yellow
   - `rejected` → red
   - `draft` → gray
3. Add hover tooltips explaining status meanings
4. **Verify:** All template statuses render with correct badge.

---

### TASK 4.2: Verify Admin Help Tooltips

**Problem:** Tooltips added during admin refactor but not verified on every subsection.

**Required Actions:**

1. Visit every admin page:
   - `/admin/billing`
   - `/admin/models`
   - `/admin/usage`
   - `/admin/users`
   - `/admin/moderation` (new from TASK 3.4)
2. Check that every non-obvious field has a `?` tooltip or label explanation
3. Add missing tooltips for:
   - Credit grant inputs ("Amount added to user's wallet immediately")
   - Model verification toggle ("Enables this model for all users")
   - Usage metrics ("Resets monthly")
4. **Verify:** No admin field is confusing without context.

---

### TASK 4.3: Repo Hygiene — Remove Experiments

**Problem:** `pdf files/` and claude/kimi experiments in repo — not wired to app, deployment noise.

**Required Actions:**

1. **Audit root and src for experiment folders:**
   - `pdf files/`
   - Any `experiments/`, `claude-*`, `kimi-*` directories
   - Any `.txt` files that are notes/drafts
2. **Move to separate repo OR delete if not needed:**
   - If valuable: move to `experiments-archive/` branch or separate repo
   - If not: delete
3. **Update `.gitignore`:**
   - Add `experiments/`
   - Add `*.draft.*`
   - Add `pdf files/`
4. **Verify:** `git status` shows no untracked experiment files; build output clean.

---

### TASK 4.4: Standardize API Patterns

**Problem:** Mixed axios vs `adminApi.ts` patterns. Admin is centralized; older pages use raw hooks.

**Required Actions:**

1. **Audit all API calls:**
   - Find all `axios.get/post` outside of `adminApi.ts`
   - Find all raw `fetch` calls
2. **Migrate to centralized pattern:**
   - Create `apiClient.ts` (if not exists) with interceptors for auth, error handling
   - Use `apiClient` for all non-admin calls
   - Keep `adminApi.ts` for admin-specific calls
3. **Standardize error handling:**
   - All API errors show toast/notification
   - All API errors log to console with request ID
4. **Verify:** No raw `axios` or `fetch` calls in page components; all use wrapped clients.

---

## PHASE 5: VERIFICATION & DOCUMENTATION

### TASK 5.1: Final Security Audit

**Required Actions:**

1. Verify ALL admin routes (`/api/admin/*`) have `requireAuth` + `requireAdmin`
2. Verify template approve/reject has `requireAdmin` (from TASK 1.2)
3. Verify file upload controller has size/type limits (e.g., max 10MB, only PDF/Images)
4. Verify QStash webhook verifies signature (if QStash kept)
5. Verify cron route uses secret header (if external cron needed)
6. Run `npm audit` — fix any critical vulnerabilities
7. **Document:** Create `SECURITY.md` with all auth patterns, env vars, and endpoint guards

---

### TASK 5.2: Final Wiring Verification

**Required Actions:**

1. **Trace every route to frontend:**
   - List all `/api/*` routes
   - Mark which have frontend callers
   - For routes with NO frontend use: document why they exist (webhook, cron, internal)
   - For routes that SHOULD have frontend use but don't: fix or remove
2. **Verify no 404 navigation paths:**
   - Click every nav item in sidebar
   - Click every button that navigates
   - Fix any broken links
3. **Verify feature completeness:**
   - Auth: register, login, logout, password reset
   - Templates: create, edit, delete, preview, submit for approval
   - Documents: upload, list, delete, create from template
   - Email: send, schedule, history
   - Billing: checkout, view usage, admin grant credits
   - Admin: all sub-pages load, search/filter works

---

### TASK 5.3: Update MVP Readiness Score

**Required Actions:**

1. After all fixes, re-audit using original criteria:
   - Feature completeness (was 7)
   - Wiring / no dead ends (was 5)
   - Security (was 5)
   - Data reliability (was 5)
   - Test / ops readiness (was 4)
   - Code hygiene (was 6)
2. Target scores: All ≥ 7, Overall ≥ 8.0
3. Document remaining debt in `TECH_DEBT.md`

---

## DELIVERABLES CHECKLIST

- [X] TASK 1.1: Only one scheduler system exists (legacy OR QStash)
- [X] TASK 1.2: Template approve/reject is admin-only
- [X] TASK 1.3: No 404 on `/dashboard/documents/create`
- [X] TASK 2.1: Schedule history shows real data OR nav item removed
- [X] TASK 2.2: Cron route has proper auth (secret or documented as manual)
- [X] TASK 2.3: All JSON stores have consistent, documented shapes
- [X] TASK 2.4: >20 meaningful tests, all passing
- [X] TASK 2.5: No dead QStash code (if legacy chosen) OR fully wired QStash
- [X] TASK 3.1: No orphan components in build
- [X] TASK 3.2: Single attachment hook pattern
- [X] TASK 3.3: Data consistency service runs on startup + admin UI
- [X] TASK 3.4: Admin moderation queue exists; community shows only approved
- [X] TASK 3.5: No wrong hook usage for attachments
- [ ] TASK 4.1: All template statuses have badges
- [ ] TASK 4.2: All admin fields have tooltips
- [ ] TASK 4.3: No experiment files in deploy path
- [ ] TASK 4.4: Centralized API client pattern
- [ ] TASK 5.1: `SECURITY.md` exists, all routes guarded
- [ ] TASK 5.2: No dead routes, no broken navigation
- [ ] TASK 5.3: MVP score ≥ 8.0 documented

---

## CONSTRAINTS

1. **Do NOT break working features** while fixing debt
2. **Preserve auth flow** — do not change JWT pattern unless necessary
3. **JSON file DB stays** — do not migrate to SQL; just fix shape consistency
4. **One scheduler only** — do not leave dual systems running
5. **Tests must pass before merge** — add CI gate if possible
6. **Document all changes** — update README, add ARCHITECTURE.md if needed

---

## STARTING POINT

Begin with TASK 1.1 (scheduler resolution) as it affects the most files and determines architecture for TASK 2.1, 2.2, and 2.5. Then proceed in numerical order.
