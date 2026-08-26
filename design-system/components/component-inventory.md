# Component Inventory

> Source: the user's Claude Design project "accelance design system" (pulled via DesignSync,
> 2026-07-27). This is the real, user-approved brand component library — check here before building
> anything new (CLAUDE.md hard rule 4). Reference source files use CSS custom properties + inline
> React (not Tailwind/shadcn) — treat them as the **spec** to implement against shadcn/ui primitives
> per CLAUDE.md rule 3, not as drop-in code.
>
> **Status note:** all tokens/brand identity (colors, type, spacing, radius) are confirmed/approved.
> The Website and Internal-App-UI sections of the source system are self-labeled **"Recommended
> Enterprise Standard — not yet validated against real product screens"** (no accelance.io screenshot
> or existing internal-app UI was available when they were built). That means the *values* below
> (colors, radius, spacing) are trustworthy, but the *specific internal-app patterns* (Sidebar,
> TopNav-in-app-context, Dialog, Toast, agent components) are a recommended starting point to adopt
> and refine per component as we migrate — not an already-validated final spec. Treat each as
> "adopt, then confirm during its own migration-checklist row," not "implement blindly."

## Core (`components/core/`)

### Button
- **Implemented:** `design-system/components/ui/button.jsx` (migration-checklist.md row 1)
- **Variants:** primary (solid Accelance Blue, white text), secondary (white bg, blue border/text), tertiary (transparent, blue text, link-style)
- **States:** default, hover (darken to `#003A8F`)
- **Anatomy:** optional icon-left slot (Tabler), label
- **Tokens used:** `color.primary` (bg/text), `radius` (8px, always), `spacing` (16px horizontal padding)
- **Do:** verb-first, confident CTA copy ("Start the no-cost pilot")
- **Don't:** invent a fourth variant; use permission-seeking copy ("Can we...")

### Card
- **Implemented:** `design-system/components/ui/card.jsx` (migration-checklist.md row 18)
- **Variants:** default (white, 1px border), `tinted` (light-blue, borderless — preferred for grouping/callouts over hard borders), `elevated` (shadow — busy backgrounds only)
- **Anatomy:** optional icon (Tabler, in blue circle), title, body
- **Tokens used:** `radius` (8px), `color.tint`, `shadow.subtle`
- **Do:** prefer tinted borderless over hard-bordered boxes for grouping
- **Don't:** add elevation/shadow outside busy-background contexts

### Badge
- **Variants (tone):** success (green), alert (orange), compliance (teal) — tone follows the same semantic color rules as the rest of the system
- **Anatomy:** optional icon, label text, pill shape
- **Do:** use tone to mean the same thing everywhere it appears
- **Don't:** use as decorative color — every tone must map to its semantic meaning

### Icon
- **Implemented:** `design-system/components/ui/icon.jsx` (migration-checklist.md row 1)
- **Library:** Tabler Icons, outline, 2px stroke, via webfont (`tokens/fonts.css`)
- **Sizes:** 24×24 standard, 16×16 dense UI
- **Props:** `name` (Tabler slug), `size`, `color` (defaults to inherited text color)
- **Don't:** mix icon sets, use filled icons, use emoji/unicode as icons

## Forms (`components/forms/`)

### Input / Field
- **Implemented:** `design-system/components/ui/input.jsx` (migration-checklist.md row 18)
- **States:** default, focus (2px blue ring), error (orange border + inline message below field)
- **Anatomy:** label **above** input (never placeholder-as-label), input, optional hint text, optional error text
- **`Field`** is exported separately to wrap custom controls with the same label/hint/error chrome
- **Don't:** use placeholder text as the label; show errors via color alone

### Select
- Same border/radius/focus-ring treatment as Input, native `<select>` styled to match

### Checkbox
- Accelance Blue checked-fill, Tabler check glyph

## Data (`components/data/`)

### Table
- **Implemented:** `design-system/components/ui/table.jsx` (migration-checklist.md row 24, Control Tower)
- **Anatomy:** blue header row, white bold header text, alternating row shading, horizontal borders only (no vertical), tint on row hover
- **Props beyond the source spec:** `onRowClick`, `getRowKey` — additive, needed for list pages with row-click-to-open-detail (e.g. Control Tower's executions list); cell values may be any node, matching the source spec's own `<AgentStatus/>`-in-a-cell usage. `columns` entries may also be `{ label, key }` (sortable, paired with `sortBy`/`sortDirection`/`onSort`) — the component only renders the indicator/reports clicks, the caller still owns sorting `rows`. `maxHeightClassName` bounds the table to a scrollable region with a sticky header, so a long list scrolls in place instead of growing the whole page.

### MetricCard
- **Implemented:** `design-system/components/ui/metric-card.jsx` (migration-checklist.md row 24, Control Tower)
- **Anatomy:** big number (48px bold), label, optional icon
- **Variants (tone):** `success` (green) for positive results
- **Additive prop beyond the source spec:** `size="sm"` (36px number, 32px icon circle) for dense
  multi-column rows (5+ across) where the full 48px treatment would dominate the page — default
  `size="lg"` still matches the source spec exactly

### CalloutBox
- Tinted (light-blue), borderless — for risks/assumptions/key notes

### Quote
- Exported from the same file as CalloutBox — for anonymized testimonials
- **Rule:** attribution is role + sector only ("VP of Operations, Fortune 500 Manufacturing Client") — never a real client name/logo without explicit approval

## Navigation (`components/navigation/`)

### TopNav
- **Anatomy:** wordmark left, nav links, single filled blue CTA button far right
- **States:** hover = blue underline fade-in on links
- **Context:** site/marketing nav pattern

### Sidebar
- **Anatomy:** app-name header (uses the "a" mark tile, not full wordmark — wordmark is reserved for top bar/documents), icon+label nav items
- **States:** active item = left Accelance-Blue bar + light-blue tint background
- **Context:** internal-app nav pattern — **Recommended Standard, not yet validated against a real product** (see status note above)

### SectionNav — status: draft, pending design review
- **Implemented:** `packages/ui/src/layout/MainLayout/Header/SectionNav/` (`index.jsx` for the
  header, `SectionTabs.jsx` shared presentational row also used atop the drawer on mobile via
  `Sidebar/MenuList/index.jsx`); state/route-sync lives in `hooks/useMenuSections.js`
  (migration-checklist.md, logged 2026-08-13)
- **Anatomy:** row of icon+label tabs, one per `menu-items/dashboard.js` top-level group, in the
  header; picking one switches which single group the Sidebar renders (instead of all groups
  stacked at once) and navigates to that group's `defaultItemId`
- **States:** active/hover = bold text + blue underline fade-in (reuses TopNav's link state, not a
  new visual language)
- **Do not confuse with TopNav** — TopNav (above) is the site/marketing nav pattern; this is
  internal-app only
- **Gap note:** this exact composition — section tabs in the app header driving a filtered
  Sidebar — doesn't exist in the source Claude Design project (checked via DesignSync 2026-08-13);
  it reuses TopNav's and Sidebar's individually-validated states/tokens rather than inventing new
  ones. See DESIGN_SPEC.md Section 9 for the full note. Colors resolve through `theme.palette.primary`
  (the app's real Fluid brand, formerly Envoy), not the design system's literal Accelance-Blue `#0052CC`.
- **Superseded visually, 2026-08-14** — see AccelanceHeader/AccelanceSidebar below. The
  logic/state this SectionNav entry documents (`useMenuSections.js`, `defaultItemId` navigation)
  is unchanged and still exactly what's running; only the rendered header/sidebar chrome changed.

### AccelanceHeader / AccelanceSidebar — status: draft, pending design review
- **Implemented:** `packages/ui/src/design-system/accelance-shell/` (`AccelanceHeader.jsx`,
  `AccelanceSidebar.jsx`, `icons.js`, `shell.css`), wired into `layout/MainLayout/index.jsx` in
  place of the old MUI `Header`/`Sidebar` (migration-checklist.md row 26, 2026-08-14)
- **Source:** a real hand-designed mockup (`ControlTower.dc.html`, Claude Design project "Platform
  page design planning" `f29a73f7-9f82-447b-8807-26f0eae5d58e`, importing design tokens from
  `accelance-design-system-ee18bc52-ef81-4433-9e6b-233c9f4b825e`) — **not** the "019dd881" system
  the rest of this inventory (Button/Card/Icon/Table/MetricCard above) was pulled from. This is
  the same newer system row 19's Envoy Auth rebuild used.
- **Anatomy:** header — 3-bar mark + "fluid" wordmark (renamed 2026-08-26, was "envoy" — mark
  geometry unchanged, see DESIGN_SPEC.md Section 9 for the flagged letterform mismatch), section tabs (bold + azure underline when
  active), org/workspace pill chips, azure-tinted settings-gear icon-circle (profile menu
  trigger). Sidebar — flat list of the active section's items, active item = rounded-12,
  azure-tinted pill (not TopNav/Sidebar's underline/left-bar — a different active-state recipe,
  confirmed correct for this design system, not a bug)
- **Reuses, doesn't rebuild:** `hooks/useMenuSections.js` for section/sidebar data
  (unchanged from the SectionNav entry above); `OrgWorkspaceBreadcrumbs`/`ProfileSection` for
  org-switching/logout logic, via an additive `variant="accelance"` prop that only overrides
  their chip/avatar `sx` — their actual API calls and dropdown logic are untouched
- **Icon library: Lucide** (`lucide-react`, new dependency), not Tabler — a deliberate departure
  from the Icon entry above's "never mix icon sets" rule, because this is a different design
  system with its own explicit (if self-described as unconfirmed) icon choice. `icons.js` maps
  `menu-items/dashboard.js` ids to Lucide components; only the "Studio" group + 3 section tabs are
  confirmed against the actual mockup, the rest are a reasonable guess pending a real mockup.
- **Known gap:** no responsive/mobile treatment — the source mockup has `min-width: 1320px` and no
  mobile design; the old shell's hamburger/temporary-drawer behavior was not carried over.
- **Do not build a third header/sidebar** — if a future mockup refines this, edit these files
  in place rather than adding a parallel implementation.

## Feedback (`components/feedback/`)

### Dialog
- **Anatomy:** centered modal, 480px max-width, exactly one primary + one secondary action
- **Behavior:** positioned `absolute` — mount inside a `position:relative` container, or wrap for fixed positioning

### Toast
- **Anatomy:** 320px width, white background, role-colored left border (green/amber/red matching the agent-tier risk logic)
- **Behavior:** top-right placement, 4s auto-dismiss (caller-managed, not built-in)
- **Copy rule:** success = brief, non-celebratory. Error = state what happened + what to do next.

### ProgressSteps / ProgressBar
- **ProgressSteps:** numbered-circle badges for multi-step flows (completed = blue check, active = blue number)
- **ProgressBar:** linear bar for simple determinate progress

## Agent governance (`components/agent/`) — specific to this product's domain

### AgentStatus
- **Implemented:** `design-system/components/ui/agent-status.jsx` (migration-checklist.md row 18)
- **Variants (tier):** `autonomous` (green — no human review needed), `review` (amber `#B45309` — human review required), `approval` (red `#B91C1C` — mandatory approval before execution)
- **Rule:** this three-tier system is not optional styling — it is the visual expression of the product's human-in-the-loop governance positioning. Every AI-proposed action must use it consistently.

### ApprovalCard
- **Implemented:** `design-system/components/ui/approval-card.jsx` (migration-checklist.md row 18)
- **Anatomy:** agent name, proposed action, detail/context text, approve + reject actions
- **Rule:** every AI-proposed action renders as an explicit confirmation card — never silent auto-execution. This maps directly onto this platform's actual agent-execution model (see DESIGN_SPEC.md Section 2/3 — executions, agent builder).

## Auth (`ui-component/auth/`) — status: draft, pending design review

> Built during the Envoy Auth rebuild (migration-checklist.md row 19) against a Claude Design
> project (`accelance-design-system-ee18bc52-ef81-4433-9e6b-233c9f4b825e`) that is newer than —
> and on a different brand from — the "accelance design system" project this inventory's
> other sections were pulled from. Added here per CLAUDE.md's Gap protocol step 3; not yet
> reviewed back into the source design system. Reused for 1–2 pages before flagging (row 19),
> not five+ — do not adopt further without a review pass.

### AuthSplitShell
- **Anatomy:** gradient brand panel (Logo + headline/subtitle, `linear-gradient(45deg, primary.main → primary.dark)`) at fixed width on `md`+, full-width form on the other side; panel hides below `md`
- **Used by:** organization setup, org-scoped sign-in (`/o/:slug/login`), invite-accept register
- **Tokens used:** `color.primary`/`primaryDark` (gradient), `radius`, `spacing`

### AuthCenteredShell
- **Anatomy:** centered card, no split brand panel — used only by plain `/signin` (no org slug in the URL), since its source mockup has no split-panel treatment
- **Don't:** reuse for any org-scoped auth screen — those use AuthSplitShell

### PasswordStrengthBar
- **Anatomy:** 4-segment bar, fill count reflects `getPasswordStrength()` (length/upper+lower/digit/symbol — a visual echo of `utils/validation.js`'s zod `passwordSchema`, not a separate validation source)
- **Don't:** treat as the actual validation — it's feedback only; the zod schema is still the source of truth

### Logo — updated, not new
- Gained a `variant` prop (`'auto' | 'light' | 'dark'`, default `'auto'`) so callers can force the white-on-gradient or navy-on-white treatment independent of the app's dark-mode setting (used by AuthSplitShell's brand panel).
- **Mark replaced 2026-08-27** (`Fluid Logo.dc.html`, Claude Design project `a8977b7a-1322-446b-9250-615d9b4fe305`, user picked "1b — Branch" over "1a — Horizontal molecule"): the old three-bar "E" is gone, replaced by a node-and-edge bubble graph — deep-blue core branching to an azure node and a green node. Wordmark weight also changed, Lexend 500 → 300 (Light). See `design-system/tokens.json` `color.logo` for the full spec and `DESIGN_SPEC.md` Section 9 for the resolution note. Same swap applied to the landing page's `FluidLogo` and `AccelanceHeader.jsx`'s inline header mark (not itself a Logo.jsx instance, kept visually in sync by hand).

## Guardrails (`ui-component/extended/`) — status: draft, pending design review

> Built 2026-08-17 for the new Guardrails & Compliance catalog (`rules/architecture.md`'s
> 2026-08-17 update, `rules/epics-feature-status.md` §9). No equivalent existed in either Claude
> Design source project, so this reuses the existing `ChatflowConfigurationDialog` section-list
> pattern and MUI primitives already in the app rather than inventing new visual language. Added
> here per CLAUDE.md's Gap protocol step 3; not yet reviewed back into the source design system.
> Used in three places now (the canvas Settings dialog, the standalone `/guardrails` workspace
> admin page, and `/compliance`'s placeholder rows — all 2026-08-17, `migration-checklist.md`
> rows 25-27) — past the "1-2 uses before flagging" bound noted when this was first added. A
> real design-review pass on these ad hoc colors is now overdue, not just a future flag.

### GuardrailRow
- **Implemented:** `packages/ui/src/ui-component/extended/GuardrailRow.jsx` — shared by
  `GuardrailsCompliance.jsx` (canvas panel), `views/guardrails/index.jsx`, and
  `views/compliance/index.jsx`, extracted 2026-08-17 after the same row markup was duplicated
  across the first two and a layout bug (see below) had to be fixed in both places separately
- **Anatomy:** name + wrapping row of colored badges, description, optional italic hint line,
  optional right-aligned `SwitchInput` toggle
- **Layout note:** the text column uses `minWidth: 0` and the badge row uses `flexWrap: 'wrap'` —
  this is a deliberate fix for a real bug (2026-08-17), not incidental styling: without both, a
  long title + multiple badges collapse into a single narrow flex column and wrap character-by-
  character instead of the badges simply dropping to a new line. Don't remove either when editing
  this component.
- **Tokens used:** ad hoc hex values for badge colors (`#2196f3`, `#9c27b0`, `#16a34a`, `#9e9e9e`)
  — not yet mapped to `design-system/tokens.json`, since no semantic-color slot for
  "guardrail/compliance source/state" exists there yet.
- **Don't:** reuse this badge color set for unrelated status displays until the design
  conversation reviews it — picked ad hoc to ship this pass, not derived from the token system.

## Reference: full internal-app example

`ui_kits/agent-console/` in the source project is a working dashboard example (approval queue, agent
fleet table, metric strip, toast feedback) built from exactly these components — it is the closest
existing reference for how Chatflow/Agentflow executions, approvals, and monitoring pages in this
app's redesign could look. It is explicitly self-labeled **Recommended Standard, zero direct product
evidence** — a strong starting point, not a pre-approved final layout.
