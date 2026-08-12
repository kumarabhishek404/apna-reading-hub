# AI Methodology Skill

End-to-end AI-assisted feature development pipeline based on the AI Methodology Handbook.

## Prerequisites

- Basic understanding of typed languages
- Existing codebase with some components/APIs
- **For Testing Phase:** Test frameworks and testing libraries (optional - skill will generate test specs as documentation if not installed)

## What It Does

When a user provides a feature description (raw notes, meeting transcript, or even a single sentence), this skill orchestrates the complete development lifecycle for apna-reading-hub:

1. **Requirements Analysis** — Structure, gap-analyse, convert to user stories and test scenarios
2. **Prototyping** — Build interaction blueprints and simple HTML prototypes for the feature
3. **Implementation** — Plan, scaffold, implement, review, and harden in the existing Next.js and backend code
4. **Testing** — Generate targeted checks for UI flows, API behavior, and validation states
5. **Documentation** — Add implementation notes, API/data notes, and release notes

## How to Use

Invoke the skill when a user describes a feature they want to build:

```
"Build a team invitation feature where admins can invite members by email"
```

The skill will:
1. Create a feature directory under `docs/features/{feature-slug}/`
2. Walk through each phase with user checkpoints between phases
3. Produce concrete, stored artifacts at each phase
4. Track progress in a `FEATURE.md` master file

## File Structure

```
.agents/skills/ai-methodology/
├── SKILL.md                          # Main entry point — full pipeline workflow
├── README.md                         # This file
├── references/
│   ├── ch1-requirements.md           # Prompts and quality gates for Phase 1
│   ├── ch2-prototyping.md            # Prompts and quality gates for Phase 2
│   ├── ch3-implementation.md         # Prompts and quality gates for Phase 3
│   ├── ch4-testing.md                # Prompts and quality gates for Phase 4
│   └── ch5-documentation.md          # Prompts and quality gates for Phase 5
└── templates/
    └── feature-tracker.md            # Template for FEATURE.md status tracker
```

## Artifacts Produced

Each feature generates a complete artifact chain in `docs/features/{feature-slug}/`:

```
docs/features/{feature-slug}/
├── FEATURE.md              # Master tracker — status of each phase
├── 1-requirements.md       # Requirements doc, gap analysis, user stories, test scenarios, architecture inputs
├── 2-prototype.md          # Prototype spec, developer handoff, and HTML prototype files
├── 3-implementation.md     # Implementation plan, code review findings, and implementation notes
├── 4-testing.md            # Test plan and regression/validation notes
└── 5-documentation.md      # Notes for the next contributor and release documentation
```

## Phase Selection

Not every feature needs all 5 phases:

| Feature Type | Recommended Phases |
|-------------|-------------------|
| New feature (greenfield) | All 5 |
| Enhancement | 1, 3, 4, 5 |
| Bug fix | 3 (debug), 4, 5 |
| Requirements only (pre-sprint) | 1, 2 |
| Documentation catch-up | 5 only |

## Key Features

- **Traceability ID Chain** — Every artifact links back to its source across phases: FR → US → AC → Screen → Task → Test Case → ADR
- **8 Interaction States** — Every screen should define Default, Loading, Empty, Success, Error, Validation, Permission, and Offline states
- **Checkpoint Summaries** — Structured summary template at each phase boundary showing counts, flags, and next-phase preview
- **Error Recovery** — Specific recovery actions for common failure modes (vague output, compilation errors, convention drift, low coverage)
- **Repository Alignment** — Frontend work targets `frontend/src/`, backend work targets `backend/src/`, and schema changes go through `backend/prisma/`
- **HTML Prototypes** — Plain HTML prototypes under `docs/features/{feature-slug}/prototype/` are the default prototype format
- **Accessibility** — Accessibility expectations should appear in prototype specs and verification notes

## Flag System

| Flag | Meaning | Phase |
|---|---|---|
| `[ASSUMED]` | Inferred, needs confirmation | 1 |
| `[SPLIT RECOMMENDED]` | Story too large for one sprint | 1 |
| `[DECISION REQUIRED]` | Needs team architectural input | 1, 3 |
| `[i18n]` | Localisation needed but not addressed | 1 |
| `[API ADDED]` | Endpoint not in original contract | 3 |
| `[UNDER-COVERED]` | AC has fewer than 2 tests | 4 |
| `[VERIFY AGAINST SPEC]` | Test assumption needs validation | 4 |
| `[INTENT UNCLEAR]` | Code intent needs developer input | 5 |
| `[DOWNSTREAM]` | Revision may affect later phases | Revision |

## Source

Based on the AI Methodology Handbook (Version 1.0, 2026) — 141 pages, 34 prompts, covering the complete feature development lifecycle for development teams using AI-assisted workflows.
