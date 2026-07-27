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
- **Variants:** primary (solid Accelance Blue, white text), secondary (white bg, blue border/text), tertiary (transparent, blue text, link-style)
- **States:** default, hover (darken to `#003A8F`)
- **Anatomy:** optional icon-left slot (Tabler), label
- **Tokens used:** `color.primary` (bg/text), `radius` (8px, always), `spacing` (16px horizontal padding)
- **Do:** verb-first, confident CTA copy ("Start the no-cost pilot")
- **Don't:** invent a fourth variant; use permission-seeking copy ("Can we...")

### Card
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
- **Library:** Tabler Icons, outline, 2px stroke, via webfont (`tokens/fonts.css`)
- **Sizes:** 24×24 standard, 16×16 dense UI
- **Props:** `name` (Tabler slug), `size`, `color` (defaults to inherited text color)
- **Don't:** mix icon sets, use filled icons, use emoji/unicode as icons

## Forms (`components/forms/`)

### Input / Field
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
- **Anatomy:** blue header row, white bold header text, alternating row shading, horizontal borders only (no vertical), tint on row hover

### MetricCard
- **Anatomy:** big number (48px bold), label, optional icon
- **Variants (tone):** `success` (green) for positive results

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
- **Variants (tier):** `autonomous` (green — no human review needed), `review` (amber `#B45309` — human review required), `approval` (red `#B91C1C` — mandatory approval before execution)
- **Rule:** this three-tier system is not optional styling — it is the visual expression of the product's human-in-the-loop governance positioning. Every AI-proposed action must use it consistently.

### ApprovalCard
- **Anatomy:** agent name, proposed action, detail/context text, approve + reject actions
- **Rule:** every AI-proposed action renders as an explicit confirmation card — never silent auto-execution. This maps directly onto this platform's actual agent-execution model (see DESIGN_SPEC.md Section 2/3 — executions, agent builder).

## Reference: full internal-app example

`ui_kits/agent-console/` in the source project is a working dashboard example (approval queue, agent
fleet table, metric strip, toast feedback) built from exactly these components — it is the closest
existing reference for how Chatflow/Agentflow executions, approvals, and monitoring pages in this
app's redesign could look. It is explicitly self-labeled **Recommended Standard, zero direct product
evidence** — a strong starting point, not a pre-approved final layout.
