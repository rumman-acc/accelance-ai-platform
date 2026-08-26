# DESIGN_SPEC.md

> Owned by: the "design" conversation (a Claude chat used only for UX/design decisions).
> Treated as read-only source of truth by: Claude Code.
> Claude Code must never edit this file's content unilaterally — only propose edits back to the design conversation.

---

## 0. Status

| Section                  | Status        | Last updated |
|---------------------------|----------------|--------------|
| Information architecture  | current-state baseline drafted, pending design review | 2026-07-27 |
| User journeys             | current-state baseline drafted, pending design review | 2026-07-27 |
| Design tokens             | target tokens confirmed (design-system/tokens.json) + current-state baseline | 2026-07-27 |
| Component specifications  | target inventory confirmed (design-system/components/) + current-state baseline | 2026-07-27 |
| Page layouts              | current-state baseline drafted, pending design review | 2026-07-27 |
| Interaction patterns       | current-state baseline drafted, pending design review | 2026-07-27 |
| Accessibility              | current-state audit drafted — target requirements NOT set | 2026-07-27 |

---

## 1. Product context (fill this in before your first design conversation)

- What the app does: Its a full agent building platform (a platform to provide agentic layer on top of any existing custom application)
- Who uses it and why (primary personas): An organisation's own users, spanning both technical and
  non-technical staff — same platform serves both a dev/ops-type user building/configuring agents and
  a non-technical user consuming or lightly configuring them. No fixed persona split by feature area;
  UI needs to work for both skill levels rather than assuming technical fluency.
- What you explicitly do NOT want (e.g. "not another Flowise clone"):(not look like flowise ui)
- Reference products/inspirations (and what specifically to borrow — layout, density, motion, not literal branding):
  https://www.accelance.io/ — could not be fetched directly (403), but this is superseded: the user's
  own "accelance design system" (Claude Design project, pulled into `design-system/` on 2026-07-27)
  is the actual brand source of truth — see Section 4 for the resulting tokens. Visual language to
  borrow: generous white space (64px section spacing, 32px component gaps), card-based content blocks
  with 8px radius and subtle shadows, 12-column grid layouts, Tabler outline icons paired with text,
  full-width hero sections with the brand blue gradient — explicitly borrowed from Bounteous-style
  modern SaaS design per the source docs, not literal accelance.io branding.
- Constraints: existing APIs/business logic that must not change, tech stack (React + Tailwind + shadcn/ui, etc.), accessibility requirements.
  - **(Drafted by Claude Code from the codebase — factual, not a design decision.)** Per CLAUDE.md's
    hard rules, this migration is presentation-only: no changes to business logic, API contracts, or
    data flow. Concretely, that means preserving as-is: the backend API surface consumed via
    `packages/ui/src/api/*` (calls into `packages/server`'s REST endpoints); the RBAC `permission`
    strings and `feat:*` display-flag gating on every route/nav item (`RequireAuth`, `useAuth`,
    `useConfig`), since these drive both what's reachable and what's rendered per plan/tier; all
    existing route paths and URL params (many are shared/bookmarked/embedded — e.g. `/chatbot/:id`,
    `/execution/:id`); the React Flow node/edge JSON schema the canvas reads/writes (chatflow/agentflow
    definitions); and the Redux-persisted user customization state (dark mode, border radius,
    sidebar-open) in `localStorage`, which other code paths read directly.
  - **Accessibility requirements: not yet set.** Section 8 audits the current state (partial, gaps
    concentrated in the canvas) but the target bar (contrast ratios, focus-indicator treatment, ARIA
    patterns for custom nodes/edges) is an open design-conversation decision, logged in Section 9 —
    not inferred here.

---

## 2. Information architecture

> Drafted by Claude Code from the current codebase (`packages/ui`), at the user's direction, since no
> populated design-system/migration-checklist existed yet to draft against. This describes the
> **current/existing** IA (still on MUI/Flowise-derived UI) as a factual baseline — it is not yet a
> redesigned IA and should be reviewed/adjusted by the design conversation, not treated as final.

### Top-level navigation (left sidebar)

Rendered by `packages/ui/src/layout/MainLayout/Sidebar` from `menu-items/dashboard.js`. Every item
carries an RBAC `permission` and many also carry a `feat:*` display flag, so the actual visible set
varies by plan/tier (open-source vs Cloud vs Enterprise) — see Section 9.

**Group 1 — Build (core, always visible):** Chatflows · Agentflows · Executions · Assistants ·
Marketplaces · Tools · Credentials · Variables · API Keys · Document Stores

**Group 2 — "Evaluations"** (each item flagged): Datasets · Evaluators · Evaluations

**Group 3 — "User & Workspace Management"** (each item flagged, enterprise/multi-tenant admin):
SSO Config · Roles · Users · Workspaces · Login Activity

**Group 4 — "Others":** Logs (flagged) · Account Settings

**Header chrome** (top bar, outside the sidebar): org/workspace breadcrumbs + workspace switcher,
profile/account menu, and (Cloud only) a Documentation link + Logout.

### Page inventory

| Area | Route(s) | Notes |
|---|---|---|
| Chatflow builder | `/chatflows` (list), `/canvas`, `/canvas/:id` (React Flow builder) | |
| Agentflow builder v1 | `/agentflows` (list), `/agentcanvas`, `/agentcanvas/:id` | reuses the chatflow canvas |
| Agentflow builder v2 | `/v2/agentcanvas`, `/v2/agentcanvas/:id` | separate, newer implementation — see Section 9 |
| Executions | `/executions`, `/execution/:id` (public share link) | |
| Marketplace | `/marketplaces` (gallery), `/marketplace/:id`, `/v2/marketplace/:id` (read-only preview canvas) | |
| Assistants | `/assistants`, `/assistants/custom`, `/assistants/custom/:id`, `/assistants/openai` | custom (agent-flow-based) vs OpenAI Assistants API |
| Credentials | `/credentials` | |
| Variables | `/variables` | |
| API Keys | `/apikey` | |
| Tools | `/tools` | custom tools + MCP server config |
| Document stores / RAG | `/document-stores`, `/document-stores/:storeId`, chunk viewer, loader config, vector store configure/query | largest single feature folder |
| Datasets / Evaluators / Evaluations | `/datasets`, `/dataset_rows/:id`, `/evaluators`, `/evaluations`, `/evaluation_results/:id` | full eval pipeline, feature-flagged |
| Logs | `/logs` | raw server logs, distinct from Executions |
| Account | `/account` | personal settings |
| Users / Roles / Workspaces / SSO | `/users`, `/roles`, `/workspaces`, `/workspace-users/:id`, `/sso-config`, `/login-activity` | enterprise/org-admin, feature-flagged |
| Auth | `/login`, `/signin`, `/register`, `/verify`, `/confirm-email-change`, `/forgot-password`, `/reset-password`, `/unauthorized`, `/rate-limited`, `/organization-setup`, `/license-expired`, `/sso-success` | no sidebar/header |
| Public/embeddable | `/chatbot/:id` (embeddable widget) | no auth |
| Files | `views/files/index.jsx` exists, route commented out | currently unreachable — see Section 9 |

### Feature → code location

- **Chatflow canvas:** `packages/ui/src/views/canvas/` (nodes, edges, credential/input handlers, sticky notes)
- **Agentflow v2 canvas:** `packages/ui/src/views/agentflowsv2/` (separate node/edge/iteration components)
- **Assistants:** `packages/ui/src/views/assistants/` (`openai/` and `custom/` subfolders)
- **Marketplace:** `packages/ui/src/views/marketplaces/`
- **Credentials:** `packages/ui/src/views/credentials/`
- **Document stores / RAG:** `packages/ui/src/views/docstore/` + `packages/ui/src/views/vectorstore/` (per-node vector store dialogs used inside the canvas)
- **Executions vs Logs:** `packages/ui/src/views/agentexecutions/` (per-run traces) is distinct from `packages/ui/src/views/serverlogs/` (raw app/server logs)
- **Datasets / Evaluators / Evaluations:** `packages/ui/src/views/datasets/`, `views/evaluators/`, `views/evaluations/`
- **Settings:** no single settings page — `/account` (personal) + `/sso-config`, `/roles`, `/users`, `/workspaces`, `/login-activity` (org/admin) + a per-flow settings dropdown (`views/settings/`) embedded in the canvas header, not a route
- **Auth:** `packages/ui/src/views/auth/`, plus `views/organization/` for org onboarding
- **Chat widget/runtime:** `views/chatbot/` (public widget) and `views/chatmessage/` (shared chat UI, reused in the canvas's test-chat panel)
- **Scheduling & webhooks:** `views/schedule/`, `views/webhooklistener/` — not routes; FAB + drawer widgets embedded in the canvas

## 3. User journeys

> **Current-state flows below**, reconstructed by Claude Code from the actual routes/components —
> not a proposed redesign of these journeys. Friction points listed are things directly observable in
> code (missing capability, disabled route, explicit TODO), not subjective UX opinions; deciding how
> to resolve them is a design-conversation call.

**Build a chatflow/agentflow:** `/chatflows` or `/agentflows` list → "Add New" → opens
`/canvas` (or `/agentcanvas` v1 / `/v2/agentcanvas` v2) → drag a node from the floating palette
(FAB → Popper flyout, `AddNodes.jsx`) onto the canvas → configure the node inline on the canvas (v1)
or via a double-click-to-open `EditNodeDialog` modal (v2) → connect nodes → test in the built-in chat
popup → Save.
- *Friction:* v1 and v2 use two different configuration interaction models (inline vs modal) for
  what's conceptually the same task — inconsistent by construction, not by choice (Section 9).
- *Friction:* no undo/redo anywhere in either canvas — a mis-drag or accidental delete has no recovery
  path except manual re-building.
- *Friction:* node hover-actions (duplicate/delete/info) are unreachable by keyboard
  (`disableFocusListener` on the tooltip) — keyboard-only users cannot use them at all.
- *Friction:* drag-and-drop node placement has no keyboard-operable alternative — same population is
  blocked from placing nodes at all.

**Deploy/share a chatflow:** from the chatflow list, `FlowListMenu` ("…" menu) → Export / Save-as-template
/ Duplicate, or from the canvas header → API code dialog / Embed / Share (`APICodeDialog.jsx`,
`EmbedChat.jsx`, `ShareChatbot.jsx`) to get an embeddable widget at `/chatbot/:id`.
- *Friction:* none specific observed beyond general canvas friction above.

**Manage credentials:** `/credentials` list → `AddEditCredentialDialog` → credential becomes available
in `CredentialInputHandler` dropdowns inside node configs on the canvas.

**Browse marketplace, use a template:** `/marketplaces` gallery → click a template → opens a read-only
preview canvas (`MarketplaceCanvas.jsx`, `nodesDraggable={false}`) → "Use Template" (implied by
presence of the preview canvas as a distinct read-only route) copies it into an editable chatflow/agentflow.

**Monitor runs:** `/executions` for per-run execution traces (with a public share link at
`/execution/:id`), separately from `/logs` for raw server logs — these are two distinct destinations
for what a user might describe as one task ("see what happened"), which is worth the design
conversation deciding whether to keep separate or merge (Section 9 candidate).

**Cross-cutting friction, not tied to one journey:**
- The flow-builder canvas has **zero responsive/mobile handling** (confirmed: no `useMediaQuery` usage
  anywhere under `views/canvas/` or `views/agentflowsv2/`) — building/editing flows is desktop-only,
  while the outer app shell (header/sidebar) does adapt to viewport width. Any journey that includes
  "open the canvas" breaks down completely below desktop width.
- A `//TODO: prevent paste event when input focused, temporary fix` comment in both canvases'
  paste-handling code (`views/canvas/index.jsx`, `views/agentflowsv2/Canvas.jsx`) is a known, currently
  un-scoped bug risk: pasting whole-flow JSON is only string-sniffed, not scoped to canvas focus.

## 4. Design tokens

> **UPDATE 2026-07-27: target tokens now exist and are real, user-approved brand tokens** — pulled
> from the user's Claude Design project "accelance design system" via the DesignSync tool and written
> to `design-system/tokens.json`. These are NOT a Claude Code guess; they come from the user's own
> design system (which itself was built from real brand source docs: `accelance-design-system-v1.1.md`
> and `accelance-brand-standards-guide.md`). See `design-system/tokens.json` for the full machine-
> readable set — summary below. Two items remain genuinely pending sign-off (typeface, vector logo) —
> see Section 9. The CURRENT MUI values documented further below remain as a factual "what exists
> today" baseline for migration-planning comparison, not as a competing target.

### Target tokens (confirmed — `design-system/tokens.json`)

- **Color:** primary `#0052CC` / dark `#003A8F`, success `#1A7A4A`, alert `#D5680B`, compliance
  `#0891B5`, body text `#6B6B6B`, tint `#C8D8EC`, white/off-white `#FFFFFF`/`#F8FAFC`, border `#E2E8F0`.
  Colors are semantic, never decorative — a color's meaning must stay consistent everywhere it's used.
  Additionally, a three-tier **agent governance** color system (autonomous=green, review=amber
  `#B45309`, approval=red `#B91C1C`) is not optional styling — it expresses this product's
  human-in-the-loop governance model directly (see Section 5's Agent components).
- **Typography:** Inter Bold/Regular (Arial fallback — **pending approval**, see Section 9), scale
  from H1 48px/700 down through body 16px/400 to caption 12px/400, button text 16px/700 with
  `0.02em` letter-spacing.
- **Spacing:** 8px base unit, scale 8/16/24/32/48/64, 12-column grid, 1200px max-width, 24px gutters.
- **Radius:** 8px universal — cards, buttons, inputs, images, modals. No hard 0px-radius elements.
- **Shadows:** flat by default; subtle `0 1px 3px rgba(0,0,0,.1)` and elevated
  `0 4px 12px rgba(0,0,0,.15)` used sparingly, only to lift cards off busy backgrounds or for modals.
- **Motion:** fade only (0.3s), appear with 0.2s stagger; no bounce/spin/zoom. Hover: buttons darken to
  primary-dark, links get underline fade-in, cards get subtle elevation only (no scale/transform).
- **Iconography:** Tabler Icons, outline, 2px stroke, 24×24 standard / 16×16 dense, monochrome only.
- **Motif rule:** wave/curve banners are reserved for one-pagers only — never app UI or slide decks.

### Current-state values (MUI/Flowise-derived — factual baseline only, see caveat above)

Source files: `packages/ui/src/themes/{index,palette,typography,compStyleOverride}.js`,
`packages/ui/src/assets/scss/_themes-vars.module.scss`, `packages/ui/src/config.js`,
`packages/ui/src/store/reducers/customizationReducer.js`.

**Color palette (current, light mode):**

| Role | Light / Main / Dark |
|---|---|
| primary | `#dbeafe` / `#2563eb` / `#1d4ed8` |
| secondary | `#ccfbf1` / `#0d9488` / `#0f766e` |
| success | `#cdf5d8` / `#00e676` / `#00c853` (also `#69f0ae` at 200) |
| error | `#f3d2d2` / `#f44336` / `#c62828` |
| warning | `#fff8e1` / `#ffe57f` / `#ffc107` |
| orange (extra) | `#fbe9e7` / `#ffab91` / `#d84315` |
| teal (extra) | `#76c893` / `#52b69a` / `#34a0a4` |
| grey scale | 50 `#fafafa` · 100 `#f5f5f5` · 200 `#eeeeee` · 300 `#e0e0e0` · 400 `#c4c4c4` · 500 `#9e9e9e` · 600 `#757575` · 700 `#616161` · 900 `#212121` |

Dark mode swaps to a separate hex set (`darkBackground`/`darkPaper` `#191b1f`, `darkLevel1/2` `#252525`/`#242424`,
etc. — see palette.js for the full mapping). Toggle is a manual switch (Header → `changeDarkMode()`),
persisted to `localStorage`; no OS `prefers-color-scheme` detection.
**Quirk to resolve, not replicate:** `palette.grey[500/600/700/900]` are remapped to text-color
variables (`darkTextSecondary`/heading/`darkTextPrimary`/`textDark`) rather than fixed greys — same
token name means different things depending on dark mode.

**Typography (current):**
- Font family: `'Inter', 'Roboto', 'Arial', sans-serif` (`config.js`)
- h1 `2.125rem`/700 · h2 `1.5rem`/700 · h3 `1.25rem`/600 · h4 `1rem`/600 · h5 `0.875rem`/500 ·
  h6 `0.75rem`/500 · subtitle1 `0.875rem`/500 · subtitle2 `0.75rem`/400 · body1 `0.875rem`/400,
  line-height `1.334em` · body2 400/`1.5em` · caption `0.75rem`/400
- Button text is `capitalize`, not uppercase (deviates from MUI default — worth deciding if the
  redesign keeps this)
- Avatar size tokens: small 22px / medium 34px / large 44px, radius 8px

**Spacing (current):** MUI default base unit, `theme.spacing(1) = 8px`. App-wide grid-gap constant
`gridSpacing = 3` (→24px) used pervasively for page/section gaps (`store/constant.js`).

**Radii (current):** Global default `12px`, stored in Redux customization state and **user-adjustable
at runtime via a settings slider** — i.e. radius is not currently a fixed design constant, it's a
live user preference. `MuiButton` hardcoded its own `4px` independent of that setting (inconsistency —
**fixed 2026-07-27 in migration-checklist.md row 2**, now follows `theme.customization.borderRadius`
like the rest of `compStyleOverride.js`). Ad hoc inline radii still appear uncoordinated on a
per-component basis: `999px` pills, `theme.spacing(2)` (=16px), etc. — to be cleaned up as each
component's own migration-checklist row comes up, not all at once.

**Shadows/elevation (current):** No custom theme `shadows` array — MUI's default 25-step array is in
effect, but `MuiPaper` is forced flat (`elevation: 0`, no background image), so cards/papers render
with no default shadow. Ad hoc custom shadows are set directly per-component in `sx` props rather than
theme tokens (e.g. `MainCard` hover shadow, `StatsCard` dark-mode shadow) — not a coherent elevation
scale today.

**Motion:** No documented duration/easing scale found; animation is ad hoc (e.g. `AnimateButton.jsx`
uses framer-motion-style hover/tap scale, MUI `Transitions.jsx` provides grow/fade/zoom presets with
MUI's default transition durations). The redesign needs an actual motion scale — not present today.

**Iconography (current):** `@tabler/icons-react`, occasional stray `@mui/icons-material` usage. No
shared size-token/enum — sizes are set ad hoc per call site, clustering around 14–18px (inline/table),
20px (toolbar/dialog icon buttons), 24–35px (card/node headers), 40–70px (rare, empty-state avatars).

## 5. Component specifications

One entry per component. This is the part Claude Code implements literally — be precise, not evocative.

> **UPDATE 2026-07-27: a real target component inventory now exists** —
> `design-system/components/component-inventory.md`, pulled from the user's Claude Design "accelance
> design system" project via DesignSync. It covers 20 components across Core (Button, Card, Badge,
> Icon), Forms (Input/Field, Select, Checkbox), Data (Table, MetricCard, CalloutBox, Quote),
> Navigation (TopNav, Sidebar), Feedback (Dialog, Toast, ProgressSteps/ProgressBar), and Agent
> governance (AgentStatus, ApprovalCard — specific to this product's domain). Each entry has
> variants/states/anatomy per the Button-example format below. Check that file before building
> anything new, per CLAUDE.md rule 4.
>
> **Caveat carried over from the source system itself:** brand tokens (color/type/spacing/radius) are
> confirmed, but the internal-app-specific patterns (Sidebar, Dialog, Toast, agent components) are
> self-labeled "Recommended Standard — zero direct product evidence" (no real accelance product UI was
> available when they were designed). Treat them as a strong starting point to adopt and confirm
> **per component, at its own migration-checklist row** — not a pre-validated final layout to apply
> wholesale across every page.

### Current-state inventory below (packages/ui/src/ui-component/) — factual baseline only

### Example: Button

- **Variants:** primary, secondary, ghost, destructive
- **Sizes:** sm, md, lg
- **States:** default, hover, active, disabled, loading
- **Anatomy:** icon-left slot, label, icon-right slot
- **Behavior:** loading state disables interaction and shows spinner in place of icon-left
- **Tokens used:** `color.primary.600` (bg), `radius.md`, `spacing.2` (icon gap)
- **Do:** use `ghost` for tertiary actions inside toolbars
- **Don't:** use `destructive` for anything except irreversible actions

(Repeat this structure for every component: NodeCard, Toolbar, Sidebar, Dialog, PropertiesPanel, EmptyState, LoadingState, ErrorState, etc.)

### Current shared-component inventory (`packages/ui/src/ui-component/`, 120 files)

- **Buttons:** `StyledButton`/`StyledFab` (solid-color MUI button/fab wrapper), `AnimateButton`
  (hover/tap scale animation), `CopyToClipboardButton`, `FlowListMenu` ("…" row-action dropdown),
  `RBACButtons` (permission-gated wrapper), `Thumbs{Up,Down}Button`, `ImageButton`
- **Cards:** `MainCard` (base bordered/flat card, most-used), `ItemCard` (grid tile for
  chatflow/agentflow lists), `DocumentStoreCard`, `MCPItemCard`, `NodeCardWrapper` (canvas node
  chrome), `StatsCard`, `FollowUpPromptsCard`/`StarterPromptsCard`, `Skeleton/ChatflowCard`
- **Dialogs (24 files):** generic `ConfirmDialog` (global `useConfirm()` hook), plus per-feature
  save/share/config/inspection dialogs (`SaveChatflowDialog`, `ShareWithWorkspaceDialog`,
  `ChatflowConfigurationDialog`, `ViewMessagesDialog`, `ExpandTextDialog`, node-config dialogs, etc.)
- **Dropdowns:** `Dropdown` (single-select), `MultiDropdown`, `AsyncDropdown` (API-backed options)
- **Inputs:** `Input`, `RichInput` (variable-aware rich text), `SensitiveInput` (secret w/ show-hide),
  `SuggestionList` (autocomplete)
- **Checkbox/Switch/Slider:** `CheckboxInput`, `SwitchInput`, `InputSlider` — all labeled wrappers
- **Tables/Grids:** `TableViewOnly`, `TableStyles`, per-feature list tables (`FlowListTable`,
  `DocumentStoreTable`, `ExecutionsListTable`, `MCPServersTable`, `MarketplaceTable`, `ToolsListTable`,
  `FilesTable`), `grid/DataGrid` (MUI X wrapper, editable rows), `pagination/TablePagination`
- **Tabs:** `Tab`/`TabPanel`/`TabsList` — built on unstyled `@mui/base` primitives with custom
  pill-shaped CSS and an independent `tabColors.js` palette (not the theme palette — flag for reconciliation)
- **Tooltips:** `TooltipWithParser` (HTML-parsed info tooltip), `NodeTooltip`, `MoreItemsTooltip`
  ("+N more" overflow)
- **Loading:** `Loader` (top LinearProgress bar for route loads), `Loadable` (Suspense HOC),
  `BackdropLoader` (full-screen blocking spinner) — see Section 7 for the empty/loading/error
  conventions these feed into
- **Editors/Viewers:** `CodeEditor`, `JsonEditor`/`JsonViewer`, `SelectVariable`,
  `MemoizedReactMarkdown`/`CodeBlock` (chat markdown rendering)
- **Pickers:** `DatePicker`, `TimePicker`, `MonthDaysPicker`, `WeekDaysPicker` (schedule/cron config)
- **Extended/misc:** `Avatar`, `Breadcrumbs`, `Logo`, `Transitions` (grow/fade/zoom presets),
  `FileUpload`, `AudioWaveform`/`SpeechToText`, `Feedback`/`ChatFeedback`, `Leads`,
  `ScheduleStatusBadge` (pill status badge), `AnalyseFlow`, `McpServer`,
  `OverrideConfig`/`PostProcessing`/`RateLimit`/`Security`/`AllowedDomains` (chatflow config sub-panels)
- **Other:** `ArrayRenderer`, `File` (chip/preview), `SafeHTML`, `PricingDialog` (cloud upgrade)

**No shared `EmptyState`, `LoadingState`, or `ErrorState` component exists today** — see Section 7 for
the actual (inconsistent, per-view) conventions currently in use. Building proper shared components
for these is a clear, low-risk first target once tokens are defined, since CLAUDE.md's gap protocol
already anticipates needing them and no equivalent exists to reuse.

## 6. Page layouts / wireframes

> **Current-state layout regions below**, from `packages/ui/src/layout/MainLayout/` and the two canvas
> implementations — a factual baseline, not a target grid spec. Constants cited (`drawerWidth`,
> `headerHeight`) are the existing values, not proposed ones.

**Main app shell** (`MainLayout/index.jsx`, constants in `store/constant.js`):
- Header: fixed `AppBar`, height `80px` (`headerHeight`) — logo (hidden below `md`), mobile hamburger
  (below `md`), workspace switcher/org breadcrumbs (enterprise/cloud only), dark-mode toggle, profile menu.
- Sidebar: `Drawer`, width `260px` (`drawerWidth`), anchor left, positioned under the header.
  `persistent` variant at `md`+ (pinned, toggleable), `temporary` variant (overlay) below `md`. Open/closed
  state is Redux (`customization.opened`), auto-collapses below `lg`.
- Main content: shifts by `-drawerWidth` when the sidebar is closed; renders the active route via
  `<Outlet/>`.
- Common list-page header: `layout/MainLayout/ViewHeader.jsx` — title, back button, edit button, search
  field (Ctrl/Cmd+F shortcut via `useSearchShortcut`), a filters slot, and an actions-children slot. Used
  by most CRUD/list pages (chatflows, credentials, tools, etc.) outside the canvas.

**Canvas/builder pages** (`views/canvas/index.jsx` v1, `views/agentflowsv2/Canvas.jsx` v2):
- Full-width `AppBar`/`Toolbar` (`CanvasHeader.jsx`): back nav, editable name, save/delete/API/export/
  settings actions, schedule toggle.
- Below it, a `100vh`/`100%` React Flow canvas (`pt: '70px'`) — no docked side panel in either version.
- Node palette is a floating FAB → `Popper` flyout (`AddNodes.jsx`), not a persistent drawer.
- "Properties panel": v1 has none — config happens inline on the node itself; v2 opens `EditNodeDialog`
  as a modal on node double-click. These are two different patterns for the same conceptual region
  (Section 3/9).
- React Flow `Controls` (zoom/fit/lock + custom snap-to-grid/background toggles) sit bottom-center; v2
  adds a `MiniMap`. Various floating FABs/popups layer on top (generate-flow, sync-nodes,
  chat/vectorstore/schedule/webhook popups, validation popup in v2).
- `MarketplaceCanvas.jsx` is the same layout in read-only mode (`nodesDraggable={false}`).

**Responsive behavior:** breakpoint handling (`useMediaQuery`) exists in exactly 3 files, all in the
outer shell (`MainLayout/index.jsx`, `Sidebar/index.jsx`, `Sidebar/MenuList/NavItem/index.jsx`). The
canvas views have none — confirmed desktop-only once inside the builder, regardless of viewport.

## 7. Interaction patterns

> **Current conventions below**, from the actual codebase — inconsistencies are noted as such because
> they're real gaps to resolve during migration (e.g. no shared EmptyState component), not because a
> new convention has been chosen. Picking the target convention is a design-conversation call; this
> section documents what exists to replace/consolidate.

### Progressive disclosure
- Node palette (`AddNodes.jsx`): MUI `Accordion` grouped by category, auto-expands matching categories
  on search; proper `aria-controls`/`id` wiring.
- Canvas node hover-actions: `NodeTooltip` reveals Duplicate/Delete/Info icon buttons only on hover
  (mouse-only — see Section 8).
- Node palette flyout: `Popper` + `ClickAwayListener`, anchored to a floating FAB, with search + category
  tabs, scrollable results.
- "Properties panel" as modal: v2's `EditNodeDialog` is effectively progressive disclosure via modal
  rather than an expand-in-place panel (contrast with v1's fully-inline node config).
- Drawers exist elsewhere in the app (e.g. `ScheduleHistoryDrawer.jsx`) but the canvas itself favors
  FAB+Popper/Dialog over docked drawers.

### Empty / loading / error state conventions
- **Empty states:** no shared `EmptyState` component. Every list view hand-composes an illustration
  (bespoke SVG per feature, `assets/images/*_empty.svg`, ~20 of them) + one line of text, in a centered
  `Stack` — the same shape repeated ad hoc across ~20 views rather than one reusable component. This is
  the clearest, lowest-risk candidate for a first shared component once tokens exist (also noted in
  Section 5).
- **Loading states:** `Loader.jsx` (top `LinearProgress`, route-level Suspense fallback via `Loadable.jsx`),
  `BackdropLoader.jsx` (full-screen blocking spinner for async actions). Skeleton loading is inconsistent:
  most views inline ad hoc MUI `Skeleton`s; only one semi-reusable skeleton exists
  (`ui-component/cards/Skeleton/ChatflowCard.jsx`), and it's named/shaped for one specific card.
- **Error states:** one generic component, `ErrorBoundary.jsx` (route-level fallback — heading, status
  code, error message in a `<pre>` block, copy button, support links). No per-widget/inline "failed to
  load" component exists; errors are otherwise surfaced via toast (`notistack`, `enqueueSnackbar`/
  `useSnackbar()` called ad hoc at 10+ sites, no shared wrapper).

### Keyboard / focus behavior
- Delete: React Flow's built-in delete-key handling, disabled while any canvas dialog is open.
- Copy/paste: no per-node keyboard clipboard — only a whole-flow JSON paste via a raw
  `window.addEventListener('paste', ...)` that string-sniffs for flow JSON (explicit `//TODO` admits it
  isn't scoped to canvas focus). Per-node "Duplicate" is a mouse-only button.
- Undo/redo: not implemented anywhere in either canvas.
- Zoom: React Flow defaults only (scroll/pinch, on-canvas Controls buttons); no keyboard zoom shortcuts.
- Global shortcut: Ctrl/Cmd+F focuses the `ViewHeader` search field (`useSearchShortcut.jsx`), Escape
  blurs it — a list-page pattern, not canvas-specific.
- Focus trap in dialogs: none custom-built — whatever MUI `Dialog`/`Modal` provides by default, no
  `disableEnforceFocus`/`initialFocus` overrides found. One deliberate exception: `AddNodes.jsx` manually
  restores focus to its trigger FAB on close.

### Drag-and-drop
- Plain HTML5 DnD (`dataTransfer`), not a DnD library. Palette items set `draggable` +
  `dataTransfer.setData('application/reactflow', ...)`; the canvas reads it on `onDrop`, projects a
  position, and inserts the node. v2 additionally does hit-testing against Iteration-node bounds to
  auto-parent dropped nodes, with toast errors for disallowed drops.
- No keyboard-operable alternative to drag-and-drop node placement exists (Section 8, Section 3).

## 8. Accessibility

> **Current-state audit below** (grep-level, not a full manual/automated a11y audit), so the design
> conversation has an honest baseline before setting requirements. Target contrast ratios, focus-
> indicator style, and ARIA patterns for the redesigned components are NOT decided here — that's a
> design-conversation call informed by these gaps, not something to infer from what exists today (what
> exists today has clear, unambiguous holes, listed below rather than treated as adequate).

**Overall coverage:** partial and uneven — `aria-*` appears in 127 of 285 `.jsx` files under
`packages/ui/src`, `role=` in only 15. Coverage tracks whatever MUI provides by default on standard
form/dialog primitives; custom canvas elements (nodes/edges/handles) are largely unlabeled. No
accessibility tooling is wired in (no `axe-core`, `react-aria`, `focus-trap-react`, no enforced
`eslint-plugin-jsx-a11y` rules — one `//eslint-disable-next-line jsx-a11y/no-autofocus` suggests the
lint rule exists but is being suppressed rather than fixed).

**What's present:**
- Dialogs consistently set `aria-labelledby`/`aria-describedby` (`ConfirmDialog.jsx`, `EditNodeDialog.jsx`).
- Some custom icon-only buttons have explicit `aria-label`s (canvas FABs, React Flow custom Controls
  buttons, `ViewHeader` back button).
- Node-palette accordions/tabs have proper `aria-controls`/`id` pairing.
- Scattered `alt` text on images, but sparse (~9 occurrences across the entire canvas codebase) and at
  least one confirmed wrong/placeholder value (`CanvasNode.jsx` node icon: `alt='Notification'`).

**Confirmed gaps (concrete, not speculative):**
- **Edges have no accessible name at all** — `ButtonEdge.jsx`'s delete button is a bare icon-only
  `<button>` with zero `aria-label`/`title`.
- **Node hover-actions are keyboard-unreachable by design** — `NodeTooltip` sets
  `disableFocusListener={true}`, so Duplicate/Delete/Info cannot be triggered without a mouse. This is
  the single most concrete, fixable finding in this section.
- **No semantic roles on canvas nodes/handles** — `CanvasNode`, `AgentFlowNode`, `NodeInputHandler`,
  `NodeOutputHandler`, `IterationNode`, `StickyNote` carry no meaningful ARIA beyond React Flow's own
  minimal defaults.
- **Drag-and-drop node placement has no keyboard alternative** — keyboard-only/switch-device users
  cannot place a node on the canvas at all, by any means.
- **Stale/inherited labels**: e.g. sidebar nav `aria-label='mailbox folders'` (leftover from the
  upstream MUI admin template, not descriptive of this app's actual nav).

**Summary judgment:** accessibility here is incidental/template-inherited, not audited or deliberate —
acceptable-ish on standard CRUD/list pages via MUI defaults, essentially absent on the bespoke
flow-builder canvas, which is the product's primary, highest-interaction surface. Any redesign that
reuses the canvas interaction model as-is inherits all of the above; Section 8's real target
requirements (contrast ratios, focus-indicator treatment, keyboard parity for node placement/actions)
still need the design conversation's input and are logged as open in Section 9.

## 9. Open questions / gaps

Anything the design conversation hasn't resolved yet — flagged here so Claude Code knows NOT to implement that part yet, and so it doesn't invent an answer silently.

- **Tech-stack gap — partially resolved 2026-08-13:** the current frontend (`packages/ui`) is MUI +
  `@tabler/icons-react`, a Flowise-derived codebase — not Tailwind/shadcn as Section 1 states as the
  constraint/goal. Rows 1-23 answered this for the *existing* app with a conservative MUI re-skin
  (recolor to brand tokens, no rewrite). **User decision (2026-08-13): pages inside the platform now
  get a full Tailwind/shadcn rebuild from the real Claude Design mockups, same treatment as
  landing/register/login (rows 18/19), rather than the conservative re-skin** — starting with
  Control Tower (migration-checklist.md row 24). MUI and Tailwind now intentionally coexist across
  the authenticated app shell (MUI chrome: header/sidebar; Tailwind content: migrated pages) until
  more pages are migrated one at a time. Still open: no stated order/timeline for the remaining
  pages beyond "one at a time, per the checklist."
- **Duplicate agent-flow canvases — decided 2026-07-27:** `/agentcanvas` (v1, reuses the chatflow
  canvas) and `/v2/agentcanvas` (`views/agentflowsv2/`, a separate newer implementation) coexisted
  with no stated canonical one. **User decision: v2 is canonical** going forward
  (`migration-checklist.md` rows 12/13); v1's `/agentcanvas` route is left unmigrated/as-is pending
  the design conversation's sign-off on formally deprecating it — not deleted, just not migrated now.
- **`/files` route disabled:** `views/files/index.jsx` exists but is commented out in
  `MainRoutes.jsx` — undecided whether to include in the IA as "planned" or drop entirely.
- **Typeface pending final sign-off:** the accelance design system's confirmed working default is
  Inter Bold/Regular (Arial as corporate fallback) — but the source docs mark this "Pending Brand
  Approval," with serif alternatives (Cambria, Century Schoolbook) proposed but not adopted. Fine to
  build against Inter/Arial now; flag if the design conversation later gets a different final answer.
- **Vector logo pending:** only an interim raster PNG exists (`assets/logo-*.png` in the design
  system). A production .svg/.ai/.eps is still needed — raster is usable for now but not final.
- **Primary blue value — resolved, but with a flagged discrepancy:** the design system's source docs
  note that pixel-sampling of real accelance decks measured `#1A6FC4`, while the confirmed working
  value (and the one now in `design-system/tokens.json`) is `#0052CC`. This resolves the earlier gap
  about the `accelance.io` reference in Section 1 (site couldn't be fetched for analysis) — use
  `#0052CC` as specified; only revisit if the design conversation flags a live-site mismatch later.
- **Dark mode — decided 2026-07-27:** the current app (`packages/ui`) has a working, user-toggleable
  dark mode today (Section 4 current-state); the accelance design system provides **no dark palette**
  (a dark theme was proposed at some point but explicitly not adopted — no evidence backed it,
  contradicts every confirmed light-themed source). **User decision: ship light-only for now** — the
  dark-mode toggle is removed from the migrated header (migration-checklist.md row 1). This is logged
  here, not silently dropped: the design conversation may still want to design a real dark palette
  later, at which point the toggle can be reintroduced against real tokens.
- **Guardrails & Compliance panel colors — gap found 2026-08-17:** the new
  `GuardrailsCompliance.jsx` component (canvas Settings dialog) needed status/source chip colors
  (workspace default / overridden / on canvas / off) with no equivalent in either Claude Design
  source project or `design-system/tokens.json`; shipped with ad hoc hex values, logged in
  `design-system/components/component-inventory.md` under a new "Guardrails" draft section —
  needs a design-conversation pass to map onto real tokens rather than the ad hoc set used now.
- **Brand tokens lack a full tonal ramp — gap found during Row 1 implementation (2026-07-27):**
  `design-system/tokens.json` defines only a single main+dark value per color (primary, success,
  alert, compliance), but MUI's (and most component libraries') palette structure expects a fuller
  ramp (light/200/800/dark shades) for things like chip backgrounds and hover overlays. Per CLAUDE.md's
  Gap protocol, existing tokens were reused rather than inventing new hex values (e.g. primary's
  light/200 both reuse `color.tint`; secondary/success dark shades reuse their own main value) — see
  `packages/ui/src/assets/scss/_themes-vars.module.scss` inline comments for the exact mapping. This is
  a workable interim compromise, not a real tonal ramp; flag to the design conversation if a proper
  50-900 scale per brand color is wanted.
- **Internal-app component patterns are a starting point, not a validated spec:** Sidebar, Dialog,
  Toast, and the agent-governance components in `design-system/components/component-inventory.md` are
  self-labeled "Recommended Standard — zero direct product evidence" by their own source system.
  Confirm each one during its own migration-checklist row rather than applying all of them wholesale
  across every page in one pass.
- **Executions vs. Logs:** `/executions` (per-run traces) and `/logs` (raw server logs) are two
  separate destinations for what a user might think of as one task ("see what happened"). Undecided
  whether the redesign keeps them separate or merges them.
- **Accessibility target requirements undecided:** Section 8's audit found concrete current gaps
  (keyboard-unreachable node hover-actions, no keyboard alternative to canvas drag-and-drop, unlabeled
  edges/nodes) but no target contrast ratios, focus-indicator treatment, or required ARIA patterns have
  been set. Needs the design conversation's input before any canvas component is migrated, since
  fixing vs. replicating these gaps changes scope per component.
- **Mobile/responsive scope for the canvas is undecided:** the builder is currently 100% desktop-only
  (zero responsive handling). Whether the redesign is expected to support tablet/mobile for the canvas
  specifically (vs. just the outer app shell, which already adapts) is unresolved and materially
  affects Section 6/7 component specs for canvas-area components.
- **Feature-flagged nav is not one fixed sidebar:** Datasets/Evaluators/Evaluations,
  Users/Roles/Workspaces/Login-Activity/SSO-Config, and Logs are all gated by `feat:*` flags in
  addition to RBAC permissions — meaning the visible nav differs by plan/tier (OSS vs Cloud vs
  Enterprise). Section 6 (page layouts) and any nav component spec need to account for at least 2-3
  distinct "visible nav" states, not a single canonical sidebar.
- **Reconciliation pass (2026-08-10) — several rows behind, logged here per the Gap protocol; none
  of the following edits touch Section 4's prose or Section 2's page inventory directly, since this
  file's header reserves that for the design conversation:**
  - **Section 4's inline token values are now stale.** `design-system/tokens.json` was updated this
    pass to the Envoy brand actually shipped in `packages/ui/src/assets/scss/_themes-vars.module.scss`
    (migration-checklist.md row 19 and later theme-fix commits) — primary is now `#0F74BD`/dark
    `#062667` (Azure Blue → DeepBlue), tint is `#D5E4FE`, and a new `secondaryAccent` `#13BA2F` (Vivid
    Green) was added for narrow secondary/positive use only. Section 4's "Target tokens" bullet list
    above (lines ~181-182) still quotes the superseded values (`#0052CC`/`#003A8F`/`#C8D8EC`) inline —
    needs a design-conversation pass to bring that prose back in sync with `tokens.json`, the actual
    source of truth. Typography is unchanged (Inter/Arial body font) — but the Logo component's
    wordmark specifically renders in `Lexend` 500, a deliberate one-off brand-mark exception Section 4
    doesn't mention.
  - **Section 2's page inventory is missing three shipped IA changes:** (1) `/get-started` and the
    root-route (`/`) gating for anonymous visitors (row 18, already flagged in that row but never
    folded into Section 2 itself); (2) a new **Control Tower** dashboard at `/control-tower`
    (`packages/ui/src/views/controltower/`), gated behind `executions:view`, which is now the default
    landing page for authenticated users and was never part of the original 17-row migration scope;
    (3) the single-flow builder (`/chatflows`) is now user-facing "Agent"/"Agents" and the
    multi-agent builder (`/agentflows`) is now "Agent Swarm"/"Agent Swarms" — a plain-language rename
    across nav, page titles, and dialogs (route paths/code identifiers unchanged). None of these were
    migrated through this checklist's process — Control Tower in particular ships un-reviewed against
    `design-system/tokens.json`/`component-inventory.md`, since it was built outside this workflow.
  - **Component-inventory gaps from row 19 are now closed in `component-inventory.md` itself:** the
    three new Envoy Auth shell components (`AuthSplitShell`, `AuthCenteredShell`,
    `PasswordStrengthBar`) are added there marked `status: draft — pending design review`, and the
    four row-18 components (`card.jsx`, `agent-status.jsx`, `approval-card.jsx`, `input.jsx`) plus
    row-1's `button.jsx`/`icon.jsx` now carry `Implemented:` pointers to their code. Still pending a
    real design-conversation review pass, not a substitute for one.
- **US English copy sweep (2026-08-13):** at the user's request, a platform-wide audit found 10
  genuine British-spelling occurrences in user-facing `packages/ui` copy (no i18n layer exists —
  strings are inline JSX), all in the auth/org-signup flow ("organisation" → "organization", 9
  occurrences across `signIn.jsx`/`register.jsx`/`organization/index.jsx`) and account settings
  ("cancelled" → "canceled", 1 occurrence in `account/index.jsx`); fixed directly since they're pure
  copy, not covered elsewhere in this file. AI/ML jargon and product terminology were explicitly
  excluded from the sweep per the user's direction. This also surfaces a **stale mention in Section 1**
  (line ~26, "An organisation's own users") that Claude Code cannot edit directly — flagging for the
  design conversation to correct to "organization" for consistency with the rest of the app.
- **Sidebar restructured into header-driven sections (2026-08-13), at the user's request — a
  composition not yet in the source Claude Design project:** the sidebar previously stacked all ~20
  items across its 4 `menu-items/dashboard.js` groups (Build/"primary", Evaluations, User &
  Workspace Management, Others) at once, making it long and scrollable. Those group titles moved
  into a new `SectionNav` in the header (`layout/MainLayout/Header/SectionNav/`); the sidebar now
  renders only the active group's items, picked from a shared `useMenuSections` hook (also drives a
  same-styled tab row atop the drawer on mobile, where there's no header room). Checked the design
  system first (`components/navigation/TopNav.jsx`/`Sidebar.jsx` in the Claude Design project via
  DesignSync): both exist individually — TopNav's hover/active state (bold + blue underline
  fade-in) and Sidebar's (left blue bar + tint) — but no mockup combines "section tabs switching a
  filtered sidebar"; the one working example (`ui_kits/agent-console`) uses a flat, ungrouped
  sidebar. So this reuses those two components' existing validated states/tokens (via
  `theme.palette.primary`, not the design system's literal `#0052CC`, since the app's real shipped
  brand is Envoy per the tokens.json reconciliation above) rather than inventing new styling — see
  `design-system/components/component-inventory.md`'s Navigation section for the
  `status: draft — pending design review` entry. Picking a section also now navigates to a
  per-group default item (`defaultItemId` in `dashboard.js`: Studio → Control Tower, Evaluations →
  Evaluations, User & Workspace Management → Users, Others → Account Settings), at the user's
  request, rather than only filtering the list in place. The "Build" group was renamed **"Studio"**
  at the user's request — Section 2's "Group 1 — Build" label above is now stale; flagging rather
  than editing Section 2 directly per this file's header rule.
- **`tailwind.config.js` had the superseded Accelance Blue, found 2026-08-13 while rebuilding
  Control Tower:** the config's `primary`/`tint`/`brand-gradient` values (`#0052CC`/`#003A8F`/
  `#C8D8EC`) were never updated when `design-system/tokens.json` was reconciled to the Envoy brand
  (row 19's note above) — meaning the already-shipped `/get-started` landing page had been
  rendering off-brand this whole time. Fixed to the real Envoy values (`#0F74BD`/`#062667`/
  `#D5E4FE`) plus the missing `secondaryAccent` token; same Tailwind class names, values only, so
  landing/register/login need no code changes to pick up the correct colors on next build.
- **Control Tower's 5 stat tiles only have 4 confirmed metric tones to draw from:**
  `design-system/tokens.json`/`component-inventory.md`'s MetricCard only defines
  primary/success/alert/compliance. "Awaiting Approval" and "Needs Attention" (migration-
  checklist.md row 24) share `alert` rather than a design conversation inventing a 5th tone here —
  differentiated by icon/label. Revisit if a real 5-tone (or more) metric palette is ever defined.
- **App shell + Control Tower rebuilt again, 2026-08-14, against a real mockup this time
  (migration-checklist.md row 26) — supersedes rows 1/23/24's approach, not this file's content:**
  the user provided `ControlTower.dc.html`, their own hand-designed mockup, via a **different,
  newer Claude Design project** ("Platform page design planning",
  `f29a73f7-9f82-447b-8807-26f0eae5d58e`) importing tokens from
  `accelance-design-system-ee18bc52-ef81-4433-9e6b-233c9f4b825e` — the same newer system row 19
  already used, and a different, richer system than "019dd881" (the one `design-system/tokens.json`
  and every row 1-24 component were built against). Per the user's explicit direction ("follow
  this design for all pages"), and because the mockup itself includes the full header+sidebar
  chrome rather than just page content, this became an app-shell rebuild: new
  `design-system/accelance-shell/` (`AccelanceHeader.jsx`, `AccelanceSidebar.jsx`) replaced the
  MUI `Header`/`Sidebar` in `MainLayout`, reusing row 23's `useMenuSections.js` logic unchanged —
  only the visual layer changed. **This system ships raw CSS custom properties, not Tailwind** —
  copied into `design-system/accelance-ds/tokens/*.css`, imported once app-wide, deliberately
  excluding the source's own `base.css` element-level rules (would have recolored/refonted every
  still-MUI page). **Icon library changed to Lucide** for this system's markup (`lucide-react`,
  new dependency) — a documented departure from tokens.json's Tabler-only rule, since the ee18bc52
  system's own readme flags Lucide as its (unconfirmed) icon choice, not the 019dd881 system's.
  `design-system/tokens.json`/`tailwind.config.js` and the `design-system/components/ui/*`
  Tailwind layer are **unaffected** — they remain the system for pages not yet touched by this
  newer mockup track (landing/register/login, and any future page not given a real mockup).
  **Two deliberate deviations from the mockup:** no checkbox/bulk-select column on Control
  Tower's table (nothing in the real app performs a bulk action on executions); the real
  `ExecutionDetails` drawer was kept instead of the mockup's own drawer, which shows a "run trace"
  step timeline with no backing data model. **Known gap:** the mockup has no responsive/mobile
  treatment (explicit `min-width: 1320px`); the old shell's mobile hamburger/temporary-drawer
  behavior was not carried over — there is currently no mobile experience for the authenticated
  app. The old MUI Header/Sidebar files are left in place, unused, not deleted.
- **Product renamed "Envoy" → "Fluid" (2026-08-26), wordmark/mark mismatch flagged, not
  resolved:** all user-facing "Envoy" text (wordmark, page titles, emails, docs) has been
  updated to "Fluid" per the user's explicit request. The logo **mark** itself
  (`Logo.jsx`/`fluid-icon-tile.svg`) is a literal three-bar "E" shape with an arrow accent,
  deliberately built for "Envoy" — its geometry was left unchanged since redesigning the mark
  is a design-conversation decision, not something to resolve unilaterally here. The mark no
  longer matches the "Fluid" wordmark's initial letter; needs a design-conversation decision
  (new mark vs. keep as an abstract, non-initial mark) before further pages ship with it.

## 10. Changelog

| Date | Section changed | Reason |
|------|------------------|--------|
| 2026-07-27 | 2 (IA), 3 (journeys), 4 (tokens), 5 (components), 6 (layouts), 7 (interaction), 8 (a11y), 9 (gaps) | Claude Code drafted current-state baselines from the `packages/ui` codebase, at the user's explicit direction, since no design-system/migration-checklist existed to work from yet. All are factual "what exists today" documentation, not proposed target design — flagged per-section where a real design decision (target tokens, target a11y requirements, canonical v1/v2 pattern, etc.) still needs the design conversation. See Section 9 for the resulting open questions. |
| 2026-07-27 | 1 (inspirations), 4 (tokens), 5 (components), 9 (gaps) | Pulled the user's real "accelance design system" (Claude Design project, via DesignSync) into `design-system/tokens.json` and `design-system/components/component-inventory.md` — confirmed brand tokens (color/type/spacing/radius/motion/icons) and a 20-component target inventory, replacing "target not yet chosen" placeholders in Sections 4/5. New open items logged in Section 9: typeface and vector logo still pending final sign-off per the source system; dark mode is unresolved (current app has one, brand system has no dark palette); internal-app component patterns are self-labeled unvalidated and should be confirmed per migration-checklist row. |