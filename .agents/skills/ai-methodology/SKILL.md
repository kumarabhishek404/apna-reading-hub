---
name: ai-methodology
description: End-to-end AI-assisted feature development tailored to apna-reading-hub. Takes a raw feature idea through requirements, prototyping, implementation, testing, and documentation while aligning with the Next.js frontend and Express/Prisma backend.
allowed-tools:
  - "Read"
  - "Write"
  - "Edit"
---

# AI Methodology — Feature Development Pipeline for apna-reading-hub

You are a senior engineering lead executing a 5-phase workflow for this repository. The goal is to move from a raw feature idea to implementation-ready artifacts without introducing unnecessary abstraction.

## Project Context

This repository is a reading hub with:
- a Next.js frontend in `frontend/`
- a TypeScript backend in `backend/`
- Prisma with a PostgreSQL-compatible schema in `backend/prisma/`
- feature work typically spanning UI routes, API handlers, and database changes

## Overview

When a user provides a feature description, orchestrate the following lifecycle:

| Phase | What Happens | Key Output |
|-------|-------------|------------|
| 1 — Requirements | Structure, gap-analyse, convert to stories and tests | Requirement doc, user stories, test scenarios, architecture seed |
| 2 — Prototyping | Build an interaction blueprint and a simple HTML prototype | Prototype spec, HTML prototype files, developer handoff |
| 3 — Implementation | Plan, scaffold, implement, review | Implementation plan, feature code, review report |
| 4 — Testing | Generate and execute targeted tests | Test plan, regression checks, coverage notes |
| 5 — Documentation | Add inline comments, API notes, and release notes | Documentation package |

## Artifact Storage

Store artifacts under `docs/features/{feature-slug}/`:

```text
docs/features/{feature-slug}/
├── FEATURE.md
├── 1-requirements.md
├── 2-prototype.md
├── 3-implementation.md
├── 4-testing.md
└── 5-documentation.md
```

## Execution Protocol

### Step 0: Initialise Feature

1. Derive a `{feature-slug}` from the feature name.
2. Create `docs/features/{feature-slug}/`.
3. Create `FEATURE.md` plus the five phase documents.
4. Ask the user to confirm scope before continuing.

### Step 1: Requirements Analysis

Capture the feature in a structured form:
- Functional requirements
- Non-functional requirements
- User stories and acceptance criteria
- Edge cases and error handling
- Architecture inputs based on the existing frontend/backend patterns

Use the existing repository structure as context, especially the Next.js app under `frontend/src/app/` and the API routes under `backend/src/routes/`.

### Step 2: Prototyping

Create a lightweight prototype using plain HTML, CSS, and optionally a little JavaScript.

Use this approach:
- Create one or more HTML files in `docs/features/{feature-slug}/prototype/`
- Keep the prototype semantic and easy to review in a browser
- Show the default, empty, loading, error, and success states where relevant
- Use the prototype as the visual reference for implementation

Do not introduce design tools or external visual editors. The prototype should be simple, inspectable, and easy to hand off to implementation.

### Step 3: Implementation

Follow the repository structure:
- Frontend work belongs in `frontend/src/`
- Backend work belongs in `backend/src/`
- Database changes should be reflected in `backend/prisma/` and Prisma migrations where needed

Implementation guidance:
- Read existing components and API conventions before creating new ones
- Match naming patterns already used in the app
- Keep changes scoped and composable
- Prefer incremental implementation over large rewrites

If a prototype HTML file exists, use it as the visual reference before writing UI components.

### Step 4: Testing

Generate or execute focused tests and regression checks for the touched area:
- API contract checks
- UI flow checks
- Validation and error-handling scenarios
- Prisma/database assumptions where relevant

### Step 5: Documentation

Document the feature with:
- short implementation notes
- API or data changes
- decisions that affected the solution
- any follow-up work or caveats

## Project-Specific Notes

- Prefer working in the existing app structure rather than creating new patterns.
- Keep feature work aligned with the current architecture: Next.js + TypeScript frontend, Express/TypeScript backend, Prisma data layer.
- For prototyping, plain HTML files are the default choice; avoid introducing other visual generation systems.
- When a feature spans frontend and backend, capture both sides of the contract in the requirements and implementation artifacts.
- Security review: {n} findings — all resolved

### Items Requiring Attention
- [DECISION REQUIRED] resolved: {list with ADR numbers}
- [API ADDED] endpoints: {list or "none"}
- Medium review issues deferred: {count}

### Ready for Phase 4?
Phase 4 will derive test scenarios from acceptance criteria,
generate test code, and analyse coverage gaps.
```

---

### Step 4: Testing

Read `references/ch4-testing.md` for the full prompts and quality gates.

**Read CLAUDE.md now.** Use it to determine the correct test framework, mock approach, test file naming conventions, and where test factories should live before generating any test scenarios or code.

**Step 4.1 — Derive Test Plan from Acceptance Criteria**
- For each AC: derive Positive, Negative, Edge Case, Security, Performance scenarios
- Produce coverage matrix: AC → test count → test types
- Flag any AC with fewer than 2 tests as `[UNDER-COVERED]`
- Add to `4-testing.md` under "## Test Plan" section

**>>> UPDATE FEATURE.md NOW:** Set Phase 4 status to `In Progress`, set `Started` date. Write the file before continuing.

**Step 4.2 — Generate Test Scenarios**
- Unit test scenarios: happy path + each error + boundary values
- Component test scenarios: all 8 states + interaction flows  
- API test scenarios: success + auth/permission + validation + business rules
- E2E test scenarios (critical paths only): user journey flows
- **Focus on scenario definitions, not code implementation**

**Step 4.3 — Test Coverage Gap Analysis**
- Analyse scenario coverage vs acceptance criteria
- Compare ACs against test scenarios — flag `[AC-GAP]` items
- Rank top 10 missing test scenarios by risk
- Produce remediation plan for scenario gaps
- Add to `4-testing.md` under "## Coverage Analysis" section

**Quality Gate — Phase 4:**
- [ ] Every AC has at least one test scenario
- [ ] All 8 states have component test scenarios
- [ ] All API endpoints have test scenarios for 401, 403, 404, 409
- [ ] No test scenario expects behaviour contradicting the ACs
- [ ] Test scenarios use realistic data (no `foo`, `test@test.com`)
- [ ] Every NFR with a performance threshold has a corresponding k6 test scenario
- [ ] All sections in `4-testing.md` are complete and coherent
- [ ] FEATURE.md `Coverage Summary` table filled with real counts (not `—`)
- [ ] FEATURE.md `Coverage Gaps` checkboxes all checked with status notes

**>>> UPDATE FEATURE.md NOW — FILL ALL PHASE 4 FIELDS:**
1. Set Phase 4 status to `Complete`, set `Completed` date
2. Fill the `Coverage Summary` table with actual scenario counts per test type (Unit, Component, API/Integration, E2E)
3. Check each `Coverage Gaps` checkbox — if runner not installed, note "Planned — pending runner setup" rather than leaving blank
4. Write the file — then verify by reading it back before continuing

**CHECKPOINT:** Present Phase 4 summary using this format — **you must fill every `{placeholder}` with real values**:

```
## Phase 4 Complete — Summary

**Feature:** {feature name}
**Artifacts:** 4-testing.md updated

### FEATURE.md Updated ✓
- Coverage Summary: Unit: {n}, Component: {n}, API/Integration: {n}, E2E: {n}
- Coverage Gaps: {all checked / {n} pending — reason}

### What Was Produced
- {n} total test scenarios: Unit: {n}, Component: {n}, API: {n}, E2E: {n}
- Coverage matrix: {n} ACs covered, {n} [UNDER-COVERED]
- All 8 states tested for {n} components

### Items Requiring Attention
- [UNDER-COVERED] ACs: {list or "none"}
- Coverage gaps: top {n} by risk
- Performance tests: {generated for NFR thresholds / not applicable}

### Ready for Phase 5?
Phase 5 will generate API docs, ADRs, inline comments,
and user-facing release notes.
```

---

### Step 5: Documentation

Read `references/ch5-documentation.md` for the full prompts and quality gates.

**Read CLAUDE.md now.** Use it to identify the correct documentation style, API patterns, error classes, and any existing ADR conventions before generating documentation.

**Generate these documentation types:**

1. **Inline Code Comments** — Document all exported functions. Document the WHY, not the what. Include parameter documentation, return types, exceptions, and examples.

2. **API Reference Documentation** — For each endpoint: description, auth, rate limit, request spec, response spec, error catalogue, cURL example.

3. **Architecture Decision Records** — For each `[DECISION REQUIRED]` resolved in Phase 3: Context, Decision, Alternatives Considered, Consequences, Review Trigger.

4. **Release Notes** — User-facing: What's New / Improvements / Fixes. User-benefit-first language. Include Release Summary + Tweet version.

Add all content to `5-documentation.md` under appropriate sections:
- "## API Reference Documentation"
- "## Architecture Decision Records" 
- "## Release Notes"

**>>> UPDATE FEATURE.md NOW:** Set Phase 5 status to `In Progress`, set `Started` date. Write the file before continuing.

**Quality Gate — Phase 5:**
- [ ] All exported functions have documentation
- [ ] Every endpoint has a complete API doc block
- [ ] Every resolved decision has an ADR
- [ ] Release notes reviewed — no internal technical terms
- [ ] A non-technical stakeholder could understand the release notes
- [ ] All sections in `5-documentation.md` are complete and coherent
- [ ] FEATURE.md `Documentation Status` table has `Generated` filled for every row (no `—` blanks)
- [ ] FEATURE.md top-level `**Status:**` updated to `Complete — All 5 phases done`

**>>> UPDATE FEATURE.md NOW — FILL ALL PHASE 5 FIELDS:**
1. Set Phase 5 status to `Complete`, set `Completed` date
2. Fill every row of the `Documentation Status` table — set `Generated` to `Yes` (or `N/A` with reason), leave `Reviewed` and `Published` for human sign-off
3. Update the top-level `**Status:**` field to `Complete — All 5 phases done`
4. Write the file — then verify by reading it back before continuing

**CHECKPOINT:** Present Phase 5 summary using this format — **you must fill every `{placeholder}` with real values**:

```
## Phase 5 Complete — Summary

**Feature:** {feature name}
**Artifacts:** 5-documentation.md updated

### FEATURE.md Updated ✓
- Status field: "Complete — All 5 phases done"
- Documentation Status table:
  - Inline Comments: {Generated: Yes/N/A — reason}
  - API Reference: {Generated: Yes/N/A — reason}
  - ADRs: {Generated: Yes — n ADRs / N/A — reason}
  - Runbook: {Generated: Yes/N/A — reason}
  - Release Notes: {Generated: Yes/N/A — reason}

### What Was Produced
- API reference: {n endpoints / hooks / components documented}
- ADRs: {n records — list titles}
- Release notes: {version, target date}

### Pipeline Complete
All 5 phases done. Remaining human actions:
- [ ] Human code review
- [ ] Documentation reviewed and published
- [ ] Staging test run
```

---

## Phase Selection

Not every feature needs all 5 phases. Ask the user which phases to run:

| Feature Type | Recommended Phases |
|-------------|-------------------|
| **New feature (greenfield)** | All 5 phases |
| **Enhancement to existing feature** | 1, 3, 4, 5 |
| **Bug fix** | 3 (debug), 4, 5 |
| **Requirements only (pre-sprint)** | 1, 2 |
| **Documentation catch-up** | 5 only |

## Handling User Feedback & Revisions

When the user requests changes to any phase output:

1. **Identify the scope** — Which phase and which section needs revision
2. **Re-run only the affected section** — Do not regenerate the entire phase document
3. **Preserve all other content** — Only modify the sections the user flagged
4. **Cascade downstream** — If a Phase 1 change affects later phases, flag which downstream artifacts need updating:
   - Requirements change → check prototype spec, impl plan, test scenarios
   - Prototype change → check impl tasks, component test scenarios
   - Implementation change → check test scenarios, API docs
5. **Update the changelog** in FEATURE.md with: date, phase, what changed

**Revision prompt pattern:**
```
The user has requested changes to Phase [n]: [describe the change].

Re-read the current [n]-[artifact].md.
Apply ONLY the requested change to the affected section(s).
Preserve all other sections unchanged.

After applying the change, list any downstream artifacts that may now be inconsistent:
  [DOWNSTREAM]: [phase] — [section] — [what might need updating]
```

---

## Error Recovery

When a phase produces low-quality output or the pipeline gets stuck:

| Symptom | Recovery Action |
|---------|----------------|
| Phase 1 output too vague to build a prototype | Go back to Stage 2 (Gap Analysis). Ask 3 targeted questions about the vaguest requirements before re-running Stage 1. |
| Phase 2 screens missing states or lacking specificity | Re-run the approach prompt with the specific screen. Paste the weak output and say "this is too vague — add exact messages, conditions, and recovery paths." |
| Phase 3 scaffolds don't compile | Run the ch3 recovery prompt: paste the type errors + CLAUDE.md. Fix all errors before continuing to Phase 3.4. |
| Phase 3 code drifts from conventions | Run the ch3 convention recovery prompt immediately. Do not continue building on drifted code. |
| Phase 4 coverage gap analysis shows >30% of ACs uncovered | Re-examine Phase 1 test scenarios (Stage 4). The ACs may be too broad — split them, then re-derive test cases. |
| Phase 5 produces `[INTENT UNCLEAR]` for >20% of functions | The code lacks context. Go back to Phase 3 and add inline comments to the ambiguous sections before re-running Phase 5. |
| Any phase output contradicts a previous phase | Stop. Identify which phase has the correct information. Update the incorrect artifact. Run the `[DOWNSTREAM]` cascade check. |

**General rule:** Never proceed to the next phase if the current phase's quality gate has unresolved items. Fix or explicitly defer (with a ticket number) before moving on.

---

## Anti-Patterns to Avoid

- **Treating AI output as final** — Every phase output needs user review
- **Skipping phases** — Each phase builds on the previous. Running Phase 3 on raw notes produces poor code
- **One giant session** — Work through one phase at a time with checkpoints
- **Generating tests from code** — Always derive from acceptance criteria (spec), not implementation
- **No second pass** — After gap analysis, always re-run on the updated document
- **Accepting scaffolds without compiling** — Verify code compiles after each scaffold

## The 5 Core Principles

1. **Force Clarity Early** — AI forces specificity. "Manage account" becomes 8 distinct stories.
2. **Fill the States Gap** — The 8-state checklist makes completeness non-negotiable.
3. **Context Is Everything** — CLAUDE.md + reference files + spec slices = quality output.
4. **Test the Spec, Not the Code** — Tests from ACs catch bugs. Tests from code hide them.
5. **Documentation Is a Development Artifact** — Generate alongside code, not after.
