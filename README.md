# Easy Todo List

A fast, free todo list app with categories, progress tracking, and dark mode.

## Deploy to Cloudflare Pages

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/easytodolist.com.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages:**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
   - Select your GitHub repo
   - Build settings:
     - **Framework preset:** Astro
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
   - Click **Save and Deploy**

3. **Auto-deploys:**
   - Every push to `main` branch will automatically deploy
   - Preview deployments for pull requests

## Tech Stack

- Astro + React
- Tailwind CSS v4
- Cloudflare Pages