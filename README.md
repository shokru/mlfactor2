# MyST Site Deployment for Render (v2)

This package contains the corrected configuration files for deploying a MyST site on Render.

## Key Fix

MyST uses the `HOST` environment variable combined with `--keep-host` flag (not `--host`):

```bash
# Correct way to bind to external interface:
HOST=0.0.0.0 myst start --keep-host
```

## Files Included

- `package.json` - Node.js dependencies and scripts (corrected)
- `render.yaml` - Render deployment configuration with proper env vars

## Deployment Instructions

### Option A: Using Render Blueprint (Recommended)

1. **Add these files to your repository root** (alongside your existing MyST content)
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Blueprint**
4. Connect your repository
5. Render will automatically detect `render.yaml` and configure the service

### Option B: Manual Configuration

1. **Add `package.json`** to your repository root
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Web Service**
4. Connect your repository
5. Configure:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Add Environment Variables**:
   - `HOST` = `0.0.0.0`
   - `PORT` = `3000` (or let Render set it)
7. Click **Create Web Service**

## Important: Render Port Handling

Render assigns a dynamic port via the `PORT` environment variable. However, MyST may not automatically use it. If deployment fails:

1. Check Render logs for which port MyST is listening on
2. If MyST ignores `PORT`, you may need to use the static HTML build instead (see below)

## Alternative: Static Build (Most Reliable)

If the dynamic server doesn't work, switch to static deployment:

**In Render Dashboard:**
1. Create a **Static Site** (not Web Service)
2. Set:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `_build/html`

**Or update `render.yaml`:**
```yaml
services:
  - type: static
    name: myst-site
    buildCommand: npm install && npm run build
    staticPublishPath: _build/html
```

## Local Development

```bash
npm install
npm run dev
```

## Troubleshooting

### "Port already in use" or connection refused
- Make sure `HOST=0.0.0.0` is set
- Check that the `--keep-host` flag is being used

### Site not accessible
- Verify in Render logs that the server started successfully
- Check which port MyST is listening on
- If using dynamic port from Render, MyST might not respect it—use static build instead

## Resources

- [MyST CLI Reference](https://mystmd.org/cli/reference)
- [Render Documentation](https://render.com/docs)
