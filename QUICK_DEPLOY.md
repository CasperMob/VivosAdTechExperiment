# ⚡ Quick Deploy to Vercel

## 🚀 Fastest Method (5 minutes)

### Step 1: Push to GitHub

```bash
# If not already a git repo
git init
git add .
git commit -m "Deploy AI Chatbot to Vercel"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to: https://vercel.com/new
2. Sign in with GitHub
3. Click "Import" next to your repository
4. **IMPORTANT**: Click "Environment Variables" and add:
   - `OPENAI_API_KEY` = `sk-proj-your-actual-key`
   - `SERPAPI_KEY` = `5a39ccd8904d085c80caea4ef69876752c4ed03f4719fb97b548e64d7d90bc4d`
5. Select **Production**, **Preview**, and **Development** for both
6. Click **Deploy**

### Step 3: Wait & Done! 🎉

Your app will be live at: `https://your-project.vercel.app`

---

## 📋 Checklist

Before deploying:
- ✅ Code is pushed to GitHub
- ✅ Environment variables are set in Vercel
- ✅ OpenAI API key is valid
- ✅ SerpApi key is set (already provided)

After deploying:
- ✅ Visit your Vercel URL
- ✅ Test sending a message
- ✅ Verify ads appear
- ✅ Check console for errors

---

## 🔧 Troubleshooting

**Build fails?**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

**API not working?**
- Check environment variables in Vercel dashboard
- Verify API keys are correct
- Check Vercel function logs

**Images not loading?**
- Check `next.config.js` for image domains
- Vercel should auto-detect Next.js config

---

## 🌐 Your Live URL

After deployment, your app will be at:
```
https://your-project-name.vercel.app
```

You can also add a custom domain in Vercel settings!

---

**Need help?** See `VERCEL_DEPLOYMENT.md` for detailed instructions.

