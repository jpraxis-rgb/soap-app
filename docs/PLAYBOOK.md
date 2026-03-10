# SOAP Build Playbook — Exact CLI Commands

## Prerequisites
- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
- Node.js 18+, PostgreSQL running locally
- A Gemini API key (for Agent 1 and Agent 3)

---

## Step 1: Create the repo

```bash
mkdir soap-app && cd soap-app
git init
mkdir -p docs .claude

# Copy the product brief and architecture doc into docs/
cp /path/to/SOAP\ Product\ Brief\ -\ Phase\ 1.docx docs/
cp /path/to/SOAP\ -\ Agent\ Architecture.md docs/

# Copy the agent prompt files into the repo
cp /path/to/claude-agents/agent-*.txt docs/
```

## Step 2: Configure auto-accept (pick one)

### Option A: Full auto (skip all permissions)
```bash
# Use this flag on every claude command below
# --dangerously-skip-permissions
```

### Option B: Selective allowlist (recommended)
Create `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(git *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(cd *)"
    ]
  }
}
```

---

## Step 3: Run Agent 0 — Architect (interactive, ~30 min)

This one you run interactively so you can review the skeleton before others build on it.

```bash
cd soap-app
claude
```

Then paste the contents of `docs/agent-0-architect.txt` into the prompt.

**Wait for it to finish. Review the output. Make sure:**
- `npm run typecheck` passes
- The app builds
- DB migrations run
- Tab navigation shows 4 empty tabs

Commit to main:
```bash
git add -A && git commit -m "Agent 0: project skeleton"
```

---

## Step 4: Create feature branches

```bash
git checkout -b feat/module-1-parser-scheduler && git checkout main
git checkout -b feat/module-2-sessions-progress && git checkout main
git checkout -b feat/module-3-microlearning && git checkout main
git checkout -b feat/auth-payments-settings && git checkout main
```

---

## Step 5: Run Wave 2 — 4 builders in parallel

Open 4 terminal tabs. In each one:

### Terminal 1 — Agent 1 (Parser + Schedule)
```bash
cd soap-app
git checkout feat/module-1-parser-scheduler
claude -p "$(cat docs/agent-1-parser-schedule.txt)" --dangerously-skip-permissions
```

### Terminal 2 — Agent 2 (Sessions + Progress)
```bash
cd soap-app
git checkout feat/module-2-sessions-progress
claude -p "$(cat docs/agent-2-sessions-progress.txt)" --dangerously-skip-permissions
```

### Terminal 3 — Agent 3 (Microlearning)
```bash
cd soap-app
git checkout feat/module-3-microlearning
claude -p "$(cat docs/agent-3-microlearning.txt)" --dangerously-skip-permissions
```

### Terminal 4 — Agent 4 (Auth + Payments)
```bash
cd soap-app
git checkout feat/auth-payments-settings
claude -p "$(cat docs/agent-4-auth-payments.txt)" --dangerously-skip-permissions
```

**Let all 4 run. Agent 4 will likely finish first (~1-2h), Agent 3 last (~3-4h).**

---

## Step 6: Merge in order

```bash
git checkout main

# 1. Auth first (everyone depends on it)
git merge feat/auth-payments-settings
# Fix conflicts if any (likely: navigation config, route index)

# 2. Parser + Schedule
git merge feat/module-1-parser-scheduler

# 3. Sessions + Progress
git merge feat/module-2-sessions-progress

# 4. Microlearning (largest, merge last)
git merge feat/module-3-microlearning
```

---

## Step 7: Run Wave 3 — Review agents

After merging, run the reviewers on the merged codebase:

### Agent 5 — UX Reviewer
```bash
claude -p "$(cat docs/agent-5-ux-reviewer.txt)" --dangerously-skip-permissions
```

### Agent 6 — PM Auditor
```bash
claude -p "$(cat docs/agent-6-pm-auditor.txt)" --dangerously-skip-permissions
```

### Agent 7 — SME Validator
```bash
claude -p "$(cat docs/agent-7-sme-validator.txt)" --dangerously-skip-permissions
```

These produce reports in `/docs/reviews/`. Read them, then run another builder pass to fix P0 and P1 issues.

---

## Step 8: Fix cycle

Open Claude Code interactively and paste:
```
Read the review reports in /docs/reviews/ (ux-audit.md, pm-audit.md, sme-validation.md).
Fix all P0-BLOCKER and P1-FIX items. Commit each fix separately.
```

---

## Timing Estimate

| Step | Duration | Notes |
|------|----------|-------|
| Agent 0 (Architect) | ~30 min | Interactive, review output |
| Branch setup | ~2 min | Manual |
| Wave 2 (4 agents) | ~2-4 hours | Parallel, wall clock = slowest agent |
| Merge | ~30 min | Manual conflict resolution |
| Wave 3 (3 reviewers) | ~30-60 min | Parallel |
| Fix cycle | ~1-2 hours | Depends on findings |
| **Total** | **~5-8 hours** | One day of work |

---

## Tips

- **Watch Agent 3** — it has the most scope. If it stalls, restart with a narrower prompt (split backend vs mobile).
- **Collect real edital PDFs** before running Agent 7. Put them in `/test-data/editais/`. Without them, the SME can only validate seed data.
- **Run `npm run typecheck` after each merge** to catch type conflicts early.
- If a merge has ugly conflicts, open Claude Code interactively on the conflicted branch and say: "Resolve all merge conflicts in this branch, keeping both sides' functionality."
