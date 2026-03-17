# AI agents

This project includes a curated set of specialized AI agent prompts in `.claude/agents/`. These agents transform Claude Code into domain-specific experts for tasks like accessibility auditing, code review, performance benchmarking, and brand consistency checking.

## What are agents?

Agents are structured markdown prompts that give Claude Code a specialized persona, domain expertise, workflow processes, and deliverable templates. When you invoke an agent, it reads the project's `CLAUDE.md` for base context, then layers on the agent's domain-specific instructions.

Each agent includes:
- **Project context**: Mangrove-specific knowledge (stack, conventions, themes, Drupal integration)
- **Domain expertise**: Deep knowledge of the specialty area
- **Workflow process**: Step-by-step approach to the task
- **Deliverable templates**: Structured output formats (audit reports, checklists, etc.)
- **Communication style**: How the agent frames its feedback

## How to use agents

In Claude Code, invoke an agent by name:

```
/agents accessibility-auditor
```

Or reference the agent when asking Claude Code to perform a task:

> "Using the accessibility-auditor agent, audit the MegaMenu component across all 4 themes"

> "As the code-reviewer, review this PR for security, accessibility, and Mangrove conventions"

> "As the brand-guardian, check whether this new component's color tokens work in all themes"

Agents can also be used to frame ongoing work within a conversation — ask Claude Code to "adopt the frontend-developer persona" for a component-building session.

## Available agents

### Engineering

| Agent | File | Use when you need to... |
|-------|------|------------------------|
| **Code Reviewer** | `code-reviewer.md` | Review PRs or code changes for correctness, security, maintainability, accessibility, and Mangrove conventions |
| **Frontend Developer** | `frontend-developer.md` | Build new components, implement features, or refactor existing components following Mangrove patterns |
| **Technical Writer** | `technical-writer.md` | Write or improve MDX docs, developer guides, component API references, or tutorials |

### Design

| Agent | File | Use when you need to... |
|-------|------|------------------------|
| **UI Designer** | `ui-designer.md` | Design component specifications, define states and responsive behavior, work with design tokens across themes |
| **UX Researcher** | `ux-researcher.md` | Plan usability testing, create user personas, map user journeys, validate design decisions with research |
| **Brand Guardian** | `brand-guardian.md` | Audit multi-theme consistency, check design token coverage, prevent brand leakage between themes |
| **Inclusive Visuals** | `inclusive-visuals.md` | Audit components for cultural sensitivity, linguistic inclusion, dignified disaster representation, and global audience needs |

### Testing and performance

| Agent | File | Use when you need to... |
|-------|------|------------------------|
| **Accessibility Auditor** | `accessibility-auditor.md` | Audit components against WCAG 2.2 AA, test with assistive technologies, check keyboard navigation and screen reader behavior |
| **Performance Benchmarker** | `performance-benchmarker.md` | Measure bundle sizes, profile rendering, optimize Core Web Vitals, set performance budgets |

### Developer experience

| Agent | File | Use when you need to... |
|-------|------|------------------------|
| **Developer Advocate** | `developer-advocate.md` | Audit DX friction, improve onboarding flow, create integration tutorials, simplify the Drupal wrapper pattern |

## Where these came from

These agents are adapted from [The Agency](https://github.com/msitarzewski/agency-agents/) by Mike Sitarzewski (MIT license), a collection of 142 specialized AI agent prompts organized across 12 divisions (design, engineering, testing, marketing, sales, etc.).

We selected 10 agents most relevant to a Storybook-powered React component library serving a global UN audience, then adapted each one with:

- **Mangrove project context**: Stack details, file conventions, theme system, Drupal integration patterns
- **Project-specific checklists**: Auditing across 4 themes, RTL support, UN writing guidelines
- **Relevant conventions**: BEM naming, CSF3 stories, `fromElement` hydration pattern, gold standard component references
- **Trimmed scope**: Removed generic content that doesn't apply to this project

The original repo contains many more agents (China market specialists, game development, blockchain, spatial computing, etc.) that aren't relevant here but may be useful for other projects.

## Selection criteria

We chose agents that address Mangrove's core concerns:

1. **Accessibility** — WCAG compliance is mandatory for UN websites
2. **Multi-brand theming** — 4 themes sharing one component library requires careful brand management
3. **Global audience** — Cultural sensitivity, RTL support, and inclusive design are essential
4. **Performance** — Components load on live sites via individual ES modules
5. **Developer experience** — External teams need to integrate components into Drupal
6. **Code quality** — Reviews informed by Mangrove-specific conventions and known pitfalls
7. **Documentation** — Component docs, MDX, and developer guides following UN writing standards

## Adding or modifying agents

### Edit an existing agent

Agent files live in `.claude/agents/`. Edit them directly. Each file has:
- YAML frontmatter (`name`, `description`)
- A "Mangrove project context" section — update this when project conventions change
- Domain expertise sections — update with new best practices as needed

### Add a new agent from The Agency

1. Browse [the repo](https://github.com/msitarzewski/agency-agents/) for agents that fit a need
2. Download the raw markdown file
3. Add a "Mangrove project context" section with relevant project details
4. Trim generic content that doesn't apply
5. Save to `.claude/agents/` with a descriptive filename
6. Update this document's agent table

### Create a custom agent

Follow the existing pattern:
```markdown
---
name: Agent Name
description: One-line description of expertise
---

# Agent Name

You are **Agent Name**, [role description].

## Mangrove project context
[Project-specific knowledge the agent needs]

## Core mission
[What this agent does]

## Critical rules
[Non-negotiable constraints]

## Deliverable templates
[Structured output formats]

## Workflow process
[Step-by-step approach]

## Communication style
[How to frame feedback]
```

## Agents we considered but didn't include

These agents from The Agency are potentially useful but weren't included in the initial set:

| Agent | Why it might be useful | Why we skipped it |
|-------|----------------------|-------------------|
| **Git Workflow Master** | Branching strategy, conventional commits | Already documented in CLAUDE.md |
| **Security Engineer** | OWASP, XSS prevention | Covered sufficiently by Code Reviewer |
| **DevOps Automator** | CI/CD, GitHub Actions | Not the primary focus of this library |
| **Software Architect** | System design, patterns | Components are relatively self-contained |
| **Visual Storyteller** | Data visualization, narrative | Niche — consider if chart components expand |
| **Whimsy Injector** | Micro-interactions, personality | Not appropriate for UN institutional context |

If needs change, these can be added later by following the process above.

## Related

These agent prompts are for contributors working on Mangrove itself. For how the build produces component metadata that external AI agents consume, see the [AI and MCP integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-ai-and-mcp-integration--docs) (a separate system from these agent prompts).
