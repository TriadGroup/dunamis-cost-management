# Publish to GitHub + Vercel Skill

End-to-end workflow for pushing a web project to GitHub and deploying it live on Vercel with zero hiccups. Incorporates all known gotchas and best practices.

**GitHub:** [github.com/ItsssssJack](https://github.com/ItsssssJack)

---

## When to Use This Skill

- User asks to "publish", "deploy", "make live", or "push" a website
- User wants to create a GitHub repo for a project
- User wants to deploy to Vercel
- User says "go live", "host this", or "put it online"
- User wants to update an already-deployed site

## Prerequisites

### Required Tools

Verify these are installed and authenticated before starting:

```bash
# GitHub CLI
which gh && gh auth status 2>&1

# Vercel CLI
which vercel && vercel whoami 2>&1
```

### If GitHub CLI is NOT installed

```bash
brew install gh
gh auth login --web --git-protocol https
```

- You'll need to enter a device code at github.com/login/device
- Wait for `✓ Logged in as ItsssssJack` confirmation before proceeding

### If Vercel CLI is NOT installed or NOT authenticated

```bash
# Install
npm i -g vercel

# Authenticate (opens browser)
vercel login
```

- You'll need to enter a device code at vercel.com/device
- Wait for `Congratulations! You are now signed in.` confirmation before proceeding

---

## Workflow Checklist

Copy this checklist and update it as you go:

```
- [ ] Step 1: Pre-flight checks (tools + auth)
- [ ] Step 2: Prepare project for deployment
- [ ] Step 3: Create GitHub repository
- [ ] Step 4: Commit and push code
- [ ] Step 5: Deploy to Vercel
- [ ] Step 6: Verify deployment
- [ ] Step 7: Report to user
- [ ] Step 8: Update CSV with new website URL
```

---

## Instructions

### Step 1: Pre-Flight Checks

Run these checks BEFORE doing anything else:

```bash
# Check GitHub CLI auth
gh auth status 2>&1

# Check Vercel CLI auth
vercel whoami 2>&1
```

If either is not authenticated, follow the prerequisite steps above. **Do NOT proceed until both are authenticated.**

### Step 2: Prepare Project for Deployment

This is the **MOST CRITICAL STEP** — skipping this causes deployment failures.

#### 2a: Static Assets → `public/` Directory (CRITICAL for Vite/React)

**⚠️ LESSON LEARNED:** Static assets (images, logos, fonts, favicons) MUST be in the `public/` directory for Vite-based projects. Files in the project root are NOT served as static files in production.

```bash
# Create public directory if it doesn't exist
mkdir -p public

# Move/copy ALL static assets to public/
# Common patterns to check:
find . -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.svg" -o -name "*.gif" -o -name "*.ico" -o -name "*.webp" -o -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" \) ! -path "./node_modules/*" -exec cp {} public/ \;
```

**Check component references:** Verify that any `<img src="/filename.ext">` references have the corresponding file in `public/`. Search for image references:

```bash
grep -rn 'src="/' --include="*.tsx" --include="*.jsx" --include="*.html" --include="*.ts" --include="*.js" . | grep -v node_modules
```

For each match, confirm the referenced file exists in `public/`.

#### 2b: Environment Variables

Check if the project uses environment variables:

```bash
grep -rn 'import.meta.env\|process.env\|VITE_' --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" . | grep -v node_modules | head -20
```

If env vars are found, note them — they'll need to be set in Vercel (Step 5b).

#### 2c: Build Test (Recommended)

Test that the project builds successfully before deploying:

```bash
npm run build 2>&1
```

If the build fails, fix errors before proceeding. Common issues:

- TypeScript errors: Fix type issues or add `// @ts-ignore` for non-critical ones
- Missing dependencies: `npm install <package>`
- Import errors: Check file paths and case sensitivity

#### 2d: Verify `.gitignore`

Ensure these are in `.gitignore`:

```
node_modules/
dist/
.vercel/
.env
.env.local
.env.*.local
```

```bash
# Check and add if missing
cat .gitignore
```

### Step 3: Create GitHub Repository

#### 3a: Check for existing git repo

```bash
git remote -v 2>&1
```

#### 3b: If NO git repo exists, initialize one

```bash
git init
git add -A
git commit -m "Initial commit"
```

#### 3c: Create the GitHub repo

Use a clean, descriptive repo name (lowercase, hyphens):

```bash
# Public repo (recommended for Vercel free tier)
gh repo create my-project-name --public --source=. --push --description "My project description"

# Private repo
gh repo create my-project-name --private --source=. --push --description "My project description"
```

This creates the repo under **github.com/ItsssssJack/my-project-name**.

#### 3d: If repo already exists but remote is wrong (common with cloned projects)

**⚠️ LESSON LEARNED:** Cloned projects retain the original `origin` remote. The `gh repo create` command will fail with "Unable to add remote" if `origin` already exists.

```bash
# Create repo first (without --source and --push)
gh repo create my-project-name --public --description "My project description"

# Update the remote
git remote set-url origin https://github.com/ItsssssJack/my-project-name.git

# Push
git push -u origin main --force
```

### Step 4: Commit and Push Code

If there are uncommitted changes:

```bash
git add -A
git status  # Review what's being committed
git commit -m "feat: descriptive message about what changed"
git push origin main
```

**Commit message best practices:**

- `feat:` for new features/initial commits
- `fix:` for bug fixes (like the static assets fix)
- `chore:` for config/dependency changes
- Keep it descriptive: `"feat: Sonny's Pool Services website with custom branding"` NOT `"update"`

### Step 5: Deploy to Vercel

#### 5a: Deploy with auto-detection

```bash
vercel --yes --prod 2>&1
```

This will:

1. Auto-detect the framework (Vite, Next.js, etc.)
2. Link the project to your Vercel account
3. Connect the GitHub repo for auto-deployments
4. Build and deploy to production

#### 5b: Set environment variables (if needed)

If the project uses env vars (identified in Step 2b), set them using the Vercel MCP or CLI:

**Using Vercel MCP (preferred):**

```
Use mcp_vercel_vercel_create_env_var with:
- projectId: my-project-name
- key: ENV_VAR_NAME
- value: ENV_VAR_VALUE
- target: ["production", "preview", "development"]
```

**Using CLI:**

```bash
vercel env add VARIABLE_NAME production
```

After adding env vars, trigger a redeploy:

```bash
vercel --prod 2>&1
```

#### 5c: Verify deployment status

Use the Vercel MCP to check:

```
Use mcp_vercel_vercel_list_deployments with:
- projectId: my-project-name
- limit: 1
- state: READY
```

Or check via CLI:

```bash
vercel ls --limit 1
```

### Step 6: Verify Deployment

#### 6a: Check the live URL

The Vercel output will show:

- **Production URL**: `https://my-project-name.vercel.app`
- **Inspect URL**: Link to Vercel dashboard

#### 6b: Visual verification (recommended)

Load the production URL in a browser and verify:

- [ ] Page loads without errors
- [ ] Images/logos display correctly
- [ ] No console errors
- [ ] Layout looks correct on mobile and desktop

### Step 7: Report to User

Provide a clean summary:

```
✅ Website Published Successfully!

| Detail               | Value                                              |
|----------------------|----------------------------------------------------|
| Live URL             | https://my-project-name.vercel.app                 |
| GitHub Repository    | https://github.com/ItsssssJack/my-project-name     |
| Deployment Status    | READY ✅                                            |
| Framework            | Vite / Next.js / etc.                              |
| Auto-Deploy          | Enabled (pushes to main auto-deploy)               |
```

### Step 8: Update CSV with New Website URL

After a successful deployment, write the Vercel production URL back into the enriched CSV so it stays as the single source of truth.

#### 8a: Identify the business name

Look up the business name from the project. Check the project's `constants.tsx` for `COMPANY_NAME`, or identify from the project folder/context which business was deployed.

#### 8b: Update the CSV

Run this Python script, replacing `BUSINESS_NAME` with the actual business name (partial match is fine) and `VERCEL_URL` with the production URL from Step 7:

```bash
python3 -c "
import csv

business_name = 'BUSINESS_NAME'
vercel_url = 'VERCEL_URL'

for filepath in [
    '/Users/jackroberts/pool cleaners/austin_pool_cleaners_enriched.csv',
    '/Users/jackroberts/Desktop/austin_pool_cleaners_enriched.csv'
]:
    rows = []
    updated = False
    with open(filepath, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        if 'New Website' not in fieldnames:
            fieldnames.append('New Website')
        for row in reader:
            if business_name.lower() in row.get('Business Name', '').lower():
                row['New Website'] = vercel_url
                updated = True
            rows.append(row)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    status = 'UPDATED' if updated else 'NOT FOUND'
    print(f'{status}: {filepath}')
"
```

#### 8c: Verify the update

```bash
python3 -c "
import csv
with open('/Users/jackroberts/pool cleaners/austin_pool_cleaners_enriched.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('New Website'):
            print(f\"{row['Business Name']} → {row['New Website']}\")
" 
```

This should print the business name and its new Vercel URL. If no output, the business name match failed — retry with a different substring.

**⚠️ IMPORTANT:** This step is MANDATORY after every successful deployment. Do NOT skip it.

---

## Updating an Already-Deployed Site

If the site is already on Vercel and connected to GitHub:

```bash
# Make your changes, then:
git add -A
git commit -m "fix: describe what changed"
git push origin main
```

Vercel will auto-redeploy within ~15 seconds. Verify with:

```
Use mcp_vercel_vercel_list_deployments with:
- projectId: my-project-name
- limit: 1
```

---

## Error Handling

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Unable to add remote "origin"` | Cloned project already has `origin` | Use `git remote set-url origin NEW_URL` |
| Broken images on Vercel | Static files not in `public/` | Move all static assets to `public/` directory |
| `gh: not found` | GitHub CLI not installed | `brew install gh` |
| `vercel: command not found` | Vercel CLI not installed | `npm i -g vercel` |
| Vercel device code prompt | CLI not authenticated | Enter code at vercel.com/device |
| GitHub device code prompt | CLI not authenticated | Enter code at github.com/login/device |
| Build fails on Vercel | TypeScript/dependency errors | Run `npm run build` locally first and fix errors |
| `BUILDING` state stuck | Large project or dependency issues | Wait up to 5 minutes, then check Vercel dashboard |
| Env vars not available | Not set in Vercel | Add via `mcp_vercel_vercel_create_env_var` or `vercel env add` |
| 404 on page refresh (SPA) | Missing rewrite rules | Add `vercel.json` with `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` |

### Vite-Specific Gotchas

1. **Static assets MUST be in `public/`** — This is the #1 deployment issue
2. **`base` in vite.config.ts** — Should be `'/'` for Vercel (default is fine)
3. **SPA routing** — Add `vercel.json` with rewrites if using client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Next.js-Specific Gotchas

1. **Static exports** — If using `output: 'export'`, set output directory in Vercel
2. **API routes** — Work automatically on Vercel as serverless functions
3. **Image optimization** — Works out of the box on Vercel

---

## Quick Reference: Full Deploy in 4 Commands

For a project that's already prepared (static assets in `public/`, builds clean):

```bash
# 1. Create GitHub repo + push
gh repo create my-project-name --public --source=. --push --description "My project description"

# 2. Deploy to Vercel
vercel --yes --prod

# 3. Done! Auto-deploys are now enabled.
# Future updates:
git add -A && git commit -m "update: description" && git push origin main
```
