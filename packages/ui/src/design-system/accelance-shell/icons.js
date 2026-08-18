import {
    Activity,
    BadgeCheck,
    BarChart3,
    Bot,
    Braces,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    ClipboardCheck,
    Database,
    Files,
    FlaskConical,
    Gauge,
    GitFork,
    History,
    Hourglass,
    Inbox,
    KeyRound,
    Layers,
    LayoutGrid,
    ListChecks,
    Lock,
    Play,
    RefreshCw,
    Search,
    Settings,
    ShieldCheck,
    Store,
    TriangleAlert,
    UserCog,
    UsersRound,
    Wrench,
    X
} from 'lucide-react'

// ==============================|| ACCELANCE SHELL ICONS ||==============================
// Lucide, per the newer "ee18bc52" Claude Design system (ControlTower.dc.html) — a deliberate,
// documented substitution from that system's own readme ("no Accelance icon set exists... this
// system uses Lucide... flagged for your confirmation"), distinct from the older
// design-system/tokens.json system's Tabler-only rule. See DESIGN_SPEC.md Section 9. Menu-item
// icons below are keyed by menu-items/dashboard.js item id; only the "Studio" group's 11 items
// and the 3 section-tab icons are shown in the source mockup — the rest are a reasonable pick
// matching the item's meaning, not shown in any mockup yet.
export const SECTION_TAB_ICONS = {
    primary: LayoutGrid,
    evaluations: FlaskConical,
    management: UsersRound
}

export const MENU_ITEM_ICONS = {
    controlTower: Gauge,
    chatflows: GitFork,
    agentflows: UsersRound,
    executions: ListChecks,
    assistants: Bot,
    marketplaces: Store,
    tools: Wrench,
    guardrails: ShieldCheck,
    compliance: BadgeCheck,
    credentials: Lock,
    variables: Braces,
    apikey: KeyRound,
    'document-stores': Files,
    datasets: Database,
    evaluators: ClipboardCheck,
    evaluations: BarChart3,
    sso: ShieldCheck,
    roles: UserCog,
    users: UsersRound,
    workspaces: Layers,
    'login-activity': History,
    account: Settings
}

export const CHEVRON = { down: ChevronDown, left: ChevronLeft, right: ChevronRight }
export const MISC_ICONS = { Activity, CircleCheck, Hourglass, Inbox, Play, RefreshCw, Search, TriangleAlert, X }
