import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { Button, buttonVariants } from '@/design-system/components/ui/button'
import { Icon } from '@/design-system/components/ui/icon'
import { Card } from '@/design-system/components/ui/card'
import { AgentStatus } from '@/design-system/components/ui/agent-status'
import { ApprovalCard } from '@/design-system/components/ui/approval-card'
import { Field, Input } from '@/design-system/components/ui/input'
import { cn } from '@/lib/utils'

// Envoy mark "2a — Courier E", solid color (small-size treatment, not the gradient hero variant).
const EnvoyLogo = ({ className, textClassName }) => (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
        <svg width='1em' height='1em' viewBox='0 0 96 96' fill='none' aria-hidden='true' className='shrink-0'>
            <path d='M20 24 H70' stroke='#0F74BD' strokeWidth='14' strokeLinecap='round' />
            <path d='M20 48 H46' stroke='#13BA2F' strokeWidth='14' strokeLinecap='round' />
            <path d='M66 48 H82' stroke='#13BA2F' strokeWidth='14' strokeLinecap='round' />
            <path d='M20 72 H70' stroke='#0F74BD' strokeWidth='14' strokeLinecap='round' />
        </svg>
        <span className={cn('font-medium tracking-tight', textClassName)} style={{ color: '#062667' }}>
            envoy
        </span>
    </span>
)

EnvoyLogo.propTypes = {
    className: PropTypes.string,
    textClassName: PropTypes.string
}

// Implements the "Org Sign-up Landing Page" template from the accelance design system
// (Claude Design project 019dd881-a2db-7d6c-921c-ac19b85cf9e3,
// templates/signup-landing/SignupLanding.dc.html). Presentation-only: the org-name field here
// only carries a name forward into the existing /organization-setup flow, it does not create
// the organization itself — that stays on the current create-account API contract.
//
// Token-fidelity note: the source mockup used several one-off pixel values (e.g. 96px/88px/28px
// section and card padding) that don't exist in design-system/tokens.json's 8/16/24/32/48/64
// spacing scale. Per CLAUDE.md hard rule 2, every spacing value below is snapped to the nearest
// defined token rather than hardcoded — this reads slightly tighter than the original mockup.
// The mockup also used #1F2937 for heading/label text, which is not a token in tokens.json
// (only `body` #6B6B6B and `primary` #0052CC are defined for text). No approved near-black
// neutral exists, so this implementation reuses `body` for that text rather than inventing a
// hex value — flag to the design conversation if stronger heading contrast is wanted; a real
// `color.heading` token would need to go through tokens.json, not be invented here.

function slugify(name) {
    const s = (name || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return s || 'your-org'
}

const PLATFORM_PILLARS = [
    {
        icon: 'Sitemap',
        title: 'Multiple orchestration paradigms',
        body: 'A branching Agentflow with loops and human-input checkpoints, a supervisor/worker multi-agent pattern, and an explicit state-machine sequential system — plus single-agent modes and 11 classic chain types. Or describe the process in plain language and generate the agentflow.'
    },
    {
        icon: 'Cpu',
        title: 'Any model, any provider',
        body: '29 chat-model providers and 16 embedding providers — OpenAI, Anthropic, Bedrock, Vertex, watsonx, Groq, Mistral, and fully self-hosted options. Model tiering and allow/deny-listing keep cost and governance under your control per use case.'
    },
    {
        icon: 'Books',
        title: 'Knowledge and retrieval, provider-agnostic',
        body: '16+ vector stores, 30+ document-loader sources, chunk-level inspection, deduplication and incremental re-indexing, and a knowledge-graph option for when relationships matter more than similarity.'
    },
    {
        icon: 'PlugConnected',
        title: 'Tools, MCP, and a credential vault',
        body: 'Native connectors for Gmail, Google Drive, Jira, Microsoft Teams and Outlook, Composio, and custom REST tools — plus first-class MCP support for any compatible tool server. Secrets live in an encrypted per-credential vault with OAuth2 and are never re-exposed to the client.'
    },
    {
        icon: 'BuildingCommunity',
        title: 'Enterprise multi-tenancy and SSO',
        body: 'A real organization → workspace → RBAC hierarchy with custom roles, scoped API keys, and per-organization SSO through Azure AD, Google, Auth0, or GitHub — slug-routed, so every org gets its own branded login.'
    },
    {
        icon: 'Checklist',
        title: 'Build, evaluate, then publish',
        body: 'A drag-and-drop canvas as the primary authoring surface, with a pro-code path for whatever it can’t express. LLM-as-judge evaluation, datasets, and cost tracking sit behind a pre-publish gate, and a template marketplace makes any working agent reusable across the org.'
    }
]

const SECONDARY_PILLARS = [
    {
        icon: 'ActivityHeartbeat',
        title: 'Observability, not a black box',
        body: 'Tracing through Langfuse, LangSmith, Arize, and Phoenix; Prometheus and OpenTelemetry metrics; per-workspace cost and usage visibility.'
    },
    {
        icon: 'ClockBolt',
        title: 'Automation beyond chat',
        body: 'Cron schedules, webhook triggers, and deterministic in-graph steps — HTTP calls, custom functions, sub-flows — without leaving the agent graph.'
    },
    {
        icon: 'Broadcast',
        title: 'Ship it anywhere',
        body: 'An embeddable chat widget SDK and a full prediction REST API — the agent you built visually is immediately consumable as a product surface.'
    }
]

const GOVERNANCE_TIERS = [
    {
        tier: 'autonomous',
        border: 'border-t-agent-autonomous',
        body: 'Low-consequence, well-bounded work the agent completes end to end. Still fully traced and logged — autonomy is not invisibility.'
    },
    {
        tier: 'review',
        border: 'border-t-agent-review',
        body: 'The agent proposes, a human reviews. Used where judgment or context outside the system decides whether the proposal is right.'
    },
    {
        tier: 'approval',
        border: 'border-t-agent-approval',
        body: 'Nothing runs without a named approver. Reserved for financial, contractual, or customer-facing actions that cannot be walked back.'
    }
]

const GOVERNANCE_EXAMPLES = [
    {
        agent: 'Vendor onboarding agent',
        action: 'Approve new supplier record and payment terms',
        detail: 'Tax ID and bank details verified against the registry. Terms of Net-45 are outside the standard Net-30 policy, so the record is held for a named approver before it reaches the ERP.',
        tier: 'review'
    },
    {
        agent: 'Contract renewal agent',
        action: 'Send renewal quote to the customer',
        detail: 'Draft quote assembled from the current contract and usage. Customer-facing send is a mandatory-approval action — the agent will not dispatch it on its own.',
        tier: 'approval'
    }
]

const SECURITY_ITEMS = [
    {
        title: 'Append-only audit trail',
        body: 'Who did what, when, and to what — across every agent and tool action, with configurable retention.'
    },
    {
        title: 'Agent principal model',
        body: 'Per-agent tool allowlisting and inherited human permissions. No standing agent privilege.'
    },
    {
        title: 'Guardrails and PII handling',
        body: 'Content moderation with custom deny-lists, prompt-injection separation of trusted instructions from read content, and PII redaction before anything is logged.'
    },
    {
        title: 'Lifecycle and policy',
        body: 'Draft → validated → published states with a pre-publish evaluation gate, and policy templates applied to every agent automatically.'
    },
    {
        title: 'Cost and FinOps control',
        body: 'Per-call cost tracking, per-workspace spend budgets with alert thresholds, and rate limits enforced at the tenant level.'
    },
    {
        title: 'Encrypted by default',
        body: 'Secrets encrypted at rest, OAuth2 checks, path-traversal safety, and hardened trust-proxy handling.'
    }
]

const START_CHECKLIST = [
    'Workspaces and custom roles from the start',
    'Your own slug-routed SSO login',
    'Per-tenant usage quotas and budgets'
]

function SectionEyebrow({ children, className }) {
    return <div className={cn('mb-2 text-caption font-bold uppercase text-compliance', className)}>{children}</div>
}

SectionEyebrow.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
}

function FeatureCard({ icon, title, body, compact }) {
    return (
        <Card variant={compact ? 'tinted' : 'default'} className={compact ? 'p-3' : 'p-3 shadow-subtle'}>
            <Icon name={icon} size={compact ? 20 : 26} className={compact ? 'text-compliance' : 'text-primary'} />
            <h3 className={compact ? 'mb-1 mt-2 flex items-center gap-2 text-h5 text-body' : 'mb-1 mt-2 text-h4 text-body'}>{title}</h3>
            <p className='text-small text-body'>{body}</p>
        </Card>
    )
}

FeatureCard.propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    compact: PropTypes.bool
}

const SignupLandingPage = () => {
    const navigate = useNavigate()
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
    const [orgName, setOrgName] = useState('')
    const slugPreview = useMemo(() => `app.accelance.io/${slugify(orgName)}`, [orgName])

    const onCreate = () => {
        navigate('/organization-setup', { state: { orgName } })
    }

    // Already-logged-in visitors shouldn't see the marketing pitch — send them into the app.
    if (isAuthenticated) {
        return <Navigate to='/' replace />
    }

    return (
        <div className='bg-white font-sans text-body antialiased'>
            <header className='sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur'>
                <div className='mx-auto flex max-w-grid items-center justify-between gap-3 px-3 py-2'>
                    <Link to='/get-started'>
                        <EnvoyLogo className='text-[20px]' textClassName='text-[20px]' />
                    </Link>
                    <nav className='flex items-center gap-3 text-small font-bold'>
                        <a href='#platform' className='text-body no-underline hover:text-primary hover:underline'>
                            Platform
                        </a>
                        <a href='#governance' className='text-body no-underline hover:text-primary hover:underline'>
                            Governance
                        </a>
                        <a href='#security' className='text-body no-underline hover:text-primary hover:underline'>
                            Security
                        </a>
                        <Link to='/login' className='text-body no-underline hover:text-primary hover:underline'>
                            Log in
                        </Link>
                        <a href='#start' className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                            Create your organization
                        </a>
                    </nav>
                </div>
            </header>

            <section className='relative overflow-hidden bg-brand-gradient px-3 py-6 text-white'>
                <div className='mx-auto grid max-w-grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center'>
                    <div>
                        <div className='mb-2 text-caption font-bold uppercase text-tint'>Agentic AI platform</div>
                        <h1 className='mb-3 text-h1 text-white'>An agentic layer on the systems you already run.</h1>
                        <p className='mb-4 max-w-[560px] text-body-lg text-tint'>
                            Build, govern, and ship agents on top of your ERP, CRM, RPA estate, and internal apps — multiple orchestration
                            engines, 29 model providers, and enterprise multi-tenancy from day one.
                        </p>
                        <div className='flex flex-wrap items-center gap-2'>
                            <a href='#start' className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                                Create your organization
                            </a>
                            <a
                                href='#governance'
                                className='inline-flex h-12 items-center justify-center rounded border border-white/50 px-3 text-button text-white no-underline transition-colors duration-300 hover:bg-white/10 hover:no-underline'
                            >
                                See how governance works
                            </a>
                        </div>
                        <p className='mt-3 text-small text-tint opacity-85'>
                            Augments what&rsquo;s already there. No rebuild, no rip-and-replace.
                        </p>
                    </div>
                    <div className='flex flex-col gap-2 rounded border border-white/15 bg-white/10 p-3'>
                        <div className='text-caption font-bold uppercase text-tint'>Every action, explicitly governed</div>
                        <ApprovalCard
                            agent='Invoice exception agent'
                            action='Post a credit note to SAP for PO-44821'
                            detail='Vendor invoice exceeds the PO line by 4.2%. The agent matched the delivery note and proposes a credit note before release to payment.'
                            tier='approval'
                            hideActions
                        />
                        <div className='flex flex-wrap gap-2'>
                            <AgentStatus tier='autonomous' />
                            <AgentStatus tier='review' />
                        </div>
                    </div>
                </div>
            </section>

            <section id='platform' className='mx-auto max-w-grid px-3 py-6'>
                <div className='mb-4 max-w-[720px]'>
                    <SectionEyebrow>The platform</SectionEyebrow>
                    <h2 className='mb-2 text-h2 text-primary'>One platform, not one opinionated pattern.</h2>
                    <p className='text-body-lg'>
                        Technical teams get the full builder surface. Business teams get agents they can run, review, and approve without
                        learning the internals.
                    </p>
                </div>
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
                    {PLATFORM_PILLARS.map((p) => (
                        <FeatureCard key={p.title} {...p} />
                    ))}
                </div>
                <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
                    {SECONDARY_PILLARS.map((p) => (
                        <FeatureCard key={p.title} {...p} compact />
                    ))}
                </div>
            </section>

            <section id='governance' className='mt-6 border-y border-border bg-off-white px-3 py-6'>
                <div className='mx-auto max-w-grid'>
                    <div className='mb-4 max-w-[760px]'>
                        <SectionEyebrow className='text-agent-review'>Human-in-the-loop governance</SectionEyebrow>
                        <h2 className='mb-2 text-h2 text-primary'>Three tiers of authority, set per action.</h2>
                        <p className='text-body-lg'>
                            A real execution checkpoint pauses any flow for a human proceed-or-reject decision before a consequential action
                            runs. Every AI-proposed action can render as an explicit approve/reject card — never a silent auto-execution.
                        </p>
                    </div>
                    <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
                        {GOVERNANCE_TIERS.map((t) => (
                            <Card key={t.tier} variant='elevated' className={cn('border-t-[3px] p-3', t.border)}>
                                <AgentStatus tier={t.tier} />
                                <p className='mt-2 text-small text-body'>{t.body}</p>
                            </Card>
                        ))}
                    </div>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                        {GOVERNANCE_EXAMPLES.map((ex) => (
                            <ApprovalCard key={ex.agent} {...ex} hideActions />
                        ))}
                    </div>
                </div>
            </section>

            <section id='security' className='mx-auto max-w-grid px-3 py-6'>
                <div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-[0.9fr_1.1fr]'>
                    <div>
                        <SectionEyebrow>Security and audit</SectionEyebrow>
                        <h2 className='mb-2 text-h2 text-primary'>Least privilege, all the way down.</h2>
                        <p className='text-body-lg'>
                            An agent only ever acts within the permissions of the human who triggered it — and every action it takes is
                            recoverable from the record.
                        </p>
                    </div>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        {SECURITY_ITEMS.map((item) => (
                            <div key={item.title}>
                                <h4 className='mb-1 text-h5 text-body'>{item.title}</h4>
                                <p className='text-small text-body'>{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id='start' className='bg-brand-gradient px-3 py-6 text-white'>
                <div className='mx-auto grid max-w-grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-center'>
                    <div>
                        <h2 className='mb-2 text-h2 text-white'>Create your organization.</h2>
                        <p className='mb-3 max-w-[480px] text-body-lg text-tint'>
                            One organization, your own workspaces, your own roles and login. Name it and you are in — everything else is
                            configured from inside.
                        </p>
                        <ul className='flex flex-col gap-2 text-body text-tint'>
                            {START_CHECKLIST.map((item) => (
                                <li key={item} className='flex items-center gap-2'>
                                    <Icon name='CircleCheck' size={18} className='text-white' />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Card variant='elevated' className='bg-white p-4'>
                        <Field label='Organization name' htmlFor='orgName'>
                            <Input
                                id='orgName'
                                type='text'
                                placeholder='Northwind Manufacturing'
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                            />
                        </Field>
                        <div className='my-2 flex items-center gap-1 text-small text-body'>
                            <Icon name='Link' size={15} className='text-muted' />
                            Your login lives at <b className='font-bold text-primary'>{slugPreview}</b>
                        </div>
                        <Button variant='primary' size='lg' className='w-full' onClick={onCreate}>
                            Create your organization
                        </Button>
                        <p className='mt-2 text-caption text-muted'>
                            Name and login slug are all we collect to get you started. You can invite your team and connect your systems
                            once you are inside.
                        </p>
                    </Card>
                </div>
            </section>

            <footer className='border-t border-border bg-white p-3'>
                <div className='mx-auto flex max-w-grid flex-wrap items-center justify-between gap-2 text-small'>
                    <Link to='/get-started'>
                        <EnvoyLogo className='text-[16px]' textClassName='text-[16px]' />
                    </Link>
                    <span>
                        <a href='mailto:support@accelance.io' className='text-body no-underline hover:text-primary hover:underline'>
                            support@accelance.io
                        </a>{' '}
                        · accelance.io · Reading, PA
                    </span>
                    <span className='text-muted'>© {new Date().getFullYear()} accelance</span>
                </div>
            </footer>
        </div>
    )
}

export default SignupLandingPage
