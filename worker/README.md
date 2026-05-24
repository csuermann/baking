# Baking Assistant — Sync Worker

Cloudflare Worker that stores user state and shared recipes in KV.

## First-time setup

### 1. Create KV namespaces

```bash
wrangler kv namespace create baking-sync
wrangler kv namespace create baking-sync --preview
```

Copy the `id` and `preview_id` values into `wrangler.toml`.

### 2. Set the Clerk publishable key

```bash
wrangler secret put CLERK_PUBLISHABLE_KEY
# paste your pk_live_xxx key when prompted
```

Or for local dev, create `worker/.dev.vars`:
```
CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### 3. Update ALLOWED_ORIGINS in wrangler.toml

Set this to your production domain + localhost for dev.

### 4. Deploy

```bash
wrangler deploy
```

## Local dev

```bash
wrangler dev
```

Worker runs at `http://localhost:8787`.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/sync` | Clerk JWT | Fetch user blob |
| PUT | `/sync` | Clerk JWT | Replace user blob |
| GET | `/recipe/:id` | None | Fetch shared recipe |
| PUT | `/recipe/:id` | Clerk JWT | Publish shared recipe |
