---
name: agy-worker-orchestration
description: Delegate bounded research, coding, review, and test-design tasks to local `agy` AI workers, then independently verify and integrate their work. Use when the user asks to orchestrate Gemini/agy workers, reduce development cost with worker models, run parallel worker trials, or have Codex manage, review, and validate lower-cost agents.
---

# Agy Worker Orchestration

## Workflow

Use `agy` as a worker pool; retain responsibility for planning, review, integration, and final verification.

### Safety and authorization

- Treat every `agy` invocation as external disclosure: prompts, pasted content, and files a worker can read may be sent to its provider.
- Do not send repository code, configuration, logs, credentials, customer data, or other private context until the user explicitly authorizes that disclosure for the task.
- Before repository-context work, state the intended scope, such as named files or a read-only worktree, and obtain that authorization.
- Default workers to read-only analysis. Do not use `--dangerously-skip-permissions`.
- Use self-contained prompts with no file access for unapproved capability trials.

### Delegate and verify

1. Inspect and plan locally. Split the work into independent, bounded tasks with measurable acceptance criteria.
2. Select workers with `agy agents`. Prefer Flash tiers for routine work; use a stronger worker only where the expected value justifies it.
3. Give each worker one task, exact scope, constraints, expected output, and validation request. State whether it may read or modify files.
4. Collect outputs or diffs; do not assume a worker's claimed test result is correct.
5. Independently inspect changes, run relevant local checks, and fix or reject incomplete work. Resolve conflicting findings from source evidence.
6. Report worker contributions, verification performed, remaining risks, and changes actually integrated.

### Prompt contract

```text
Role: [focused role]
Task: [one concrete outcome]
Scope: [named files/directories, or "no files/tools"]
Constraints: [architecture, compatibility, no edits, privacy limits]
Acceptance criteria: [observable requirements]
Output: [diff / findings / code / tests, with concise rationale]
Validation: [commands or cases to run; distinguish run results from proposed checks]
```

Avoid vague prompts such as "fix the module." Give workers ownership boundaries and enough context to finish without guessing.

### Invocation

Use print mode for a non-interactive worker:

```powershell
agy --agent gemini-3.6-flash-medium --mode plan --sandbox -p "[structured prompt]"
```

Use `--mode plan` for research, analysis, and change proposals. Use `accept-edits` only after the user authorizes repository disclosure and modification; isolate concurrent writers to separate files or worktrees.

### Failure handling

- Expect headless `agy --sandbox -p` sessions to deny a worker's shell or file-read permission. Do not work around this with `--dangerously-skip-permissions`. Either give the worker a self-contained prompt or locally select and paste only the minimum approved excerpts.
- Keep pasted context compact. Large source bundles can exceed the Windows process command-line limit before `agy` starts. Summarize verified facts first; split review by file or concern when excerpts are still too large.
- Record a failed invocation and its reason. Do not present an unavailable worker as having inspected the repository.
- Treat worker output as a hypothesis. Check it against local source, tests, platform semantics, and the original acceptance criteria before acting on it.
- Challenge migration and rollout advice with concrete state transitions. In particular, a proposed "dual write" is not safe merely because a new uniqueness key exists: both paths must persist the same idempotency key, or one path must be non-user-visible, or users can receive duplicates.
- Require workers to label assumptions. Reject recommendations that invent unavailable infrastructure, hide eventual-consistency effects, or use blanket permission bypasses.

### Delegation boundaries

Delegate repository mapping, boilerplate, unit-test drafts, routine refactors, documentation, migration proposals, and independent review passes. Keep architecture, security-sensitive decisions, cross-cutting changes, production-data work, merge conflicts, and final acceptance with Codex. For parallel work, assign non-overlapping files or make all workers read-only.

Verify against original acceptance criteria, not plausible prose. For code, inspect the diff and run relevant formatter, typecheck, and tests. Check edge cases, API compatibility, error handling, security assumptions, and unintended changes. Retry once with a narrower prompt when a worker fails or produces an unverifiable answer; otherwise complete the work directly.

<!-- Template content retained only to avoid accidental deletion during initialization.

## Structuring This Skill

[TODO: Choose the structure that best fits this skill's purpose. Common patterns:

**1. Workflow-Based** (best for sequential processes)

- Works well when there are clear step-by-step procedures
- Example: DOCX skill with "Workflow Decision Tree" -> "Reading" -> "Creating" -> "Editing"
- Structure: ## Overview -> ## Workflow Decision Tree -> ## Step 1 -> ## Step 2...

**2. Task-Based** (best for tool collections)

- Works well when the skill offers different operations/capabilities
- Example: PDF skill with "Quick Start" -> "Merge PDFs" -> "Split PDFs" -> "Extract Text"
- Structure: ## Overview -> ## Quick Start -> ## Task Category 1 -> ## Task Category 2...

**3. Reference/Guidelines** (best for standards or specifications)

- Works well for brand guidelines, coding standards, or requirements
- Example: Brand styling with "Brand Guidelines" -> "Colors" -> "Typography" -> "Features"
- Structure: ## Overview -> ## Guidelines -> ## Specifications -> ## Usage...

**4. Capabilities-Based** (best for integrated systems)

- Works well when the skill provides multiple interrelated features
- Example: Product Management with "Core Capabilities" -> numbered capability list
- Structure: ## Overview -> ## Core Capabilities -> ### 1. Feature -> ### 2. Feature...

Patterns can be mixed and matched as needed. Most skills combine patterns (e.g., start with task-based, add workflow for complex operations).

Delete this entire "Structuring This Skill" section when done - it's just guidance.]

## [TODO: Replace with the first main section based on chosen structure]

[TODO: Add content here. See examples in existing skills:

- Code samples for technical skills
- Decision trees for complex workflows
- Concrete examples with realistic user requests
- References to scripts/templates/references as needed]

## Resources (optional)

Create only the resource directories this skill actually needs. Delete this section if no resources are required.

### scripts/

Executable code (Python/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**

- PDF skill: `fill_fillable_fields.py`, `extract_form_field_info.py` - utilities for PDF manipulation
- DOCX skill: `document.py`, `utilities.py` - Python modules for document processing

**Appropriate for:** Python scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Codex for patching or environment adjustments.

### references/

Documentation and reference material intended to be loaded into context to inform Codex's process and thinking.

**Examples from other skills:**

- Product management: `communication.md`, `context_building.md` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Codex should reference while working.

### assets/

Files not intended to be loaded into context, but rather used within the output Codex produces.

**Examples from other skills:**

- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Not every skill requires all three types of resources.**
-->
