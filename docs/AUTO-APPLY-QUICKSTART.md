# Auto-Apply Quick Start Guide

## What Is This?

The Auto-Apply system has **two modes**:

| Mode | How it applies | Best for |
|------|---------------|----------|
| **Core Auto-Apply** (🔵 blue button) | Direct API (Greenhouse, Lever) | Company career pages with open APIs |
| **LinkedIn Easy Apply** (→ button) | Playwright browser bot | LinkedIn "Easy Apply" jobs |

This guide covers **LinkedIn Easy Apply** (the bot).

---

## Setup (Do Once)

### 1. Start the Worker

```bash
cd ~/projects/auto-apply-worker
cp .env.example .env   # fill in AUTO_APPLY_WORKER_SECRET, USER_ID, RESUME_PATH, etc.
./run-local.sh
```

The worker will:
1. Open a Chromium browser
2. Navigate to LinkedIn
3. **If no session found**: wait for you to log in manually, then save cookies to `sessions/`
4. **Subsequent runs**: reload cookies — no login needed ✅

### 2. Verify Worker Is Running

```bash
curl http://localhost:3000/api/auto-apply/worker
# Expected: {"status":"idle","queue":[]}  or with jobs
```

### 3. Add Jobs to Your Queue

1. Go to **Jobs** page (`/jobs`)
2. Find LinkedIn Easy Apply jobs (or any jobs you've saved)
3. **Checkbox** each job you want to apply to
4. Click **"Add to Auto-Apply Queue →"** (blue bar at top)
5. Status changes to "Added to queue"

### 4. Watch the Bot Work

The worker polls every few seconds. You'll see it:
- Open LinkedIn
- Click "Easy Apply"
- Fill in your info (from `.env`)
- Handle CAPTCHA if it appears → **pause and wait**
- When CAPTCHA appears, visit: `/auto-apply/verify/[token]`
- Complete the form and click **Done**
- Worker resumes automatically

---

## Queue Status Meanings

| Status | What it means |
|--------|--------------|
| `PENDING` | Waiting in queue |
| `IN_PROGRESS` | Worker is processing it now |
| `NEEDS_VERIFICATION` | CAPTCHA appeared — open the verification link |
| `COMPLETED` | Applied successfully |
| `FAILED` | Something went wrong — check error message |

---

## Viewing Your Queue

Visit `/auto-apply/queue` to see all queue items and their statuses.

---

## Common Issues

**"No jobs added"** → Make sure you've created/saved jobs in the Jobs page first. The queue uses your existing Job records.

**Worker says "idle, queue empty"** → Add jobs via `/jobs` → checkbox → "Add to Auto-Apply Queue →"

**LinkedIn CAPTCHA every time** → Normal. Use the verification link when you see `NEEDS_VERIFICATION`.

**Session expired** → Delete the cookie file in `sessions/`, restart worker, log in again.
