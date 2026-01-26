# MyST Site Deployment for Render

This package contains the configuration files needed to deploy a MyST site on Render.

## Files Included

- `package.json` - Node.js dependencies and scripts
- `render.yaml` - Render deployment configuration (Blueprint)
- `myst.yml` - Sample MyST configuration (customize for your project)

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
6. Click **Create Web Service**

## Important Notes

### Your `myst.yml`

If you already have a `myst.yml`, you probably don't need the sample one included here. Just make sure:

- Remove or comment out any `base_url` setting that points to localhost
- If you need a base URL, set it to your Render app URL (e.g., `https://your-app.onrender.com`)

### If Deployment Fails

1. **Check the logs** in Render dashboard
2. **Common issues**:
   - Node version too old: Render uses Node 18+ by default, which should work
   - Missing dependencies: Make sure `mystmd` is in `package.json`
   - Port binding: The `$PORT` variable is automatically set by Render

### Alternative: Static Build

If the dynamic server approach doesn't work, you can switch to static deployment:

1. Change `render.yaml` to use static site hosting:
   ```yaml
   services:
     - type: static
       name: myst-site
       buildCommand: npm install && npm run build
       staticPublishPath: _build/html
   ```

2. Or manually configure a Static Site in Render with:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `_build/html`

## Local Development

To test locally before deploying:

```bash
npm install
npm run dev
```

This runs `myst start` on localhost:3000.

## Support

- [MyST Documentation](https://mystmd.org/)
- [Render Documentation](https://render.com/docs)
