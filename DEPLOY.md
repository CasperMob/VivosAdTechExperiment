# Quick Deploy Guide

## 🚀 Fast Track to Vercel

### Option 1: GitHub + Vercel (Easiest)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Deploy to Vercel"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repo
   - Add environment variables:
     - `OPENAI_API_KEY` = your OpenAI key
     - `SERPAPI_KEY` = 5a39ccd8904d085c80caea4ef69876752c4ed03f4719fb97b548e64d7d90bc4d
   - Click Deploy

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Add environment variables:
```bash
vercel env add OPENAI_API_KEY
vercel env add SERPAPI_KEY
vercel --prod
```

---

## ⚙️ Environment Variables Required

```
OPENAI_API_KEY=sk-proj-your-actual-key
SERPAPI_KEY=5a39ccd8904d085c80caea4ef69876752c4ed03f4719fb97b548e64d7d90bc4d
```

**Add these in Vercel Dashboard → Settings → Environment Variables**

---

## ✅ Done!

Your app will be live at: `https://your-project.vercel.app`

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

