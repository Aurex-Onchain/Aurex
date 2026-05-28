# Aurex Web Dashboard

Self-hosted dashboard for the Aurex Signal Marketplace Protocol on X Layer.

## Local Development

```bash
# From repo root
pnpm install
pnpm dev:web
```

Open http://localhost:3000

## Environment Variables

Create `.env.local` in `apps/web/`:

```bash
# Aurex Advisor backend URL (required for API calls)
NEXT_PUBLIC_ADVISOR_URL=http://localhost:3100

# WalletConnect Project ID (get one from https://cloud.reown.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

## Deploy to Vercel

### Option 1: One-click via Vercel Dashboard

1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. **Important**: Set the **Root Directory** to `apps/web`
5. Framework Preset: **Next.js** (auto-detected)
6. Build Command: leave as default (uses `vercel.json`)
7. Add environment variables:
   - `NEXT_PUBLIC_ADVISOR_URL` — Your hosted Advisor URL (or skip for read-only demo)
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — From https://cloud.reown.com
8. Click Deploy

### Option 2: Vercel CLI

```bash
npm install -g vercel
cd apps/web
vercel --prod
```

When prompted:
- Set up and deploy: **Y**
- Scope: your account
- Link to existing project: **N**
- Project name: `aurex-dashboard` (or any name)
- Directory: `./` (current)
- Override settings: **N**

### Environment Variables on Vercel

After deploy, add via Dashboard → Project → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ADVISOR_URL` | Optional | Backend Advisor URL. Leave empty for static demo mode. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional | WalletConnect/Reown project ID for wallet integration. |

### Monorepo Notes

This repo uses pnpm workspaces. The `vercel.json` is configured to:
1. Run install from repo root (`pnpm install --frozen-lockfile`)
2. Build only the web filter (`pnpm --filter @aurex/web build`)
3. Output `.next` from `apps/web/`

When importing in Vercel, **Root Directory must be `apps/web`**.
