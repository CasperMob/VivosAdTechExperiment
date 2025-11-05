# 🚀 Deploying to Vercel

This guide will help you deploy your AI Chatbot with Contextual Ads to Vercel.

## Prerequisites

- A GitHub account (or GitLab/Bitbucket)
- A Vercel account (free tier works fine)
- Your OpenAI API key
- Your SerpApi key (already provided)

---

## Step-by-Step Deployment

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Chatbot with Contextual Ads"
   ```

2. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Create a new repository (e.g., `ai-chatbot-ads`)
   - Don't initialize with README, .gitignore, or license

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

#### Step 2: Deploy to Vercel

1. **Go to Vercel**:
   - Visit https://vercel.com
   - Sign up or log in (you can use your GitHub account)

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository you just created

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**:
   
   Click "Environment Variables" and add:
   
   ```
   OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
   SERPAPI_KEY=5a39ccd8904d085c80caea4ef69876752c4ed03f4719fb97b548e64d7d90bc4d
   ```
   
   **Important**: 
   - Add these for **Production**, **Preview**, and **Development** environments
   - Replace `sk-proj-your-actual-openai-key-here` with your actual OpenAI API key

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

---

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

From your project directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No**
- Project name? (Press Enter for default)
- Directory? `./` (Press Enter)
- Override settings? **No**

#### Step 4: Add Environment Variables

```bash
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted
# Select: Production, Preview, Development

vercel env add SERPAPI_KEY
# Paste: 5a39ccd8904d085c80caea4ef69876752c4ed03f4719fb97b548e64d7d90bc4d
# Select: Production, Preview, Development
```

#### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Environment Variables Setup

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `SERPAPI_KEY` | `5a39ccd8...` | SerpApi key (already provided) |

### How to Add in Vercel Dashboard

1. Go to your project settings
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter variable name and value
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**

---

## Post-Deployment Checklist

✅ **Verify Environment Variables**:
- Go to Project Settings → Environment Variables
- Ensure both `OPENAI_API_KEY` and `SERPAPI_KEY` are set

✅ **Test the Deployment**:
- Visit your Vercel URL
- Try sending a message
- Check if ads appear

✅ **Check Build Logs**:
- Go to Deployments → Click on latest deployment
- Check for any errors

✅ **Monitor Usage**:
- Check Vercel Analytics (if enabled)
- Monitor OpenAI API usage
- Monitor SerpApi usage

---

## Troubleshooting

### Issue: Build Fails

**Error**: "Module not found"

**Solution**:
```bash
# Make sure all dependencies are in package.json
npm install
npm run build
```

### Issue: Environment Variables Not Working

**Solution**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Make sure variables are added for **all environments**
3. Redeploy after adding variables:
   ```bash
   vercel --prod
   ```

### Issue: Images Not Loading

**Solution**:
- Check `next.config.js` for correct image domains
- Vercel should auto-detect Next.js config

### Issue: API Routes Not Working

**Solution**:
- Check that API routes are in `src/app/api/` directory
- Verify environment variables are set
- Check Vercel function logs for errors

---

## Custom Domain (Optional)

1. Go to Project Settings → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically configure SSL

---

## Monitoring & Analytics

### Vercel Analytics (Optional)

1. Go to Project Settings → **Analytics**
2. Enable Vercel Analytics (Pro plan required)
3. Or use free alternatives like Google Analytics

### API Usage Monitoring

- **OpenAI**: Check usage at https://platform.openai.com/usage
- **SerpApi**: Check usage at https://serpapi.com/dashboard

---

## Automatic Deployments

Vercel automatically deploys when you push to:
- **main/master branch** → Production
- **Other branches** → Preview deployments

Every push triggers a new deployment!

---

## Cost Estimates

### Vercel (Free Tier)
- ✅ **Free**: 100GB bandwidth/month
- ✅ **Free**: Unlimited deployments
- ✅ **Free**: SSL certificates
- ✅ **Free**: Custom domains

### API Costs
- **OpenAI**: ~$0.002 per message (GPT-3.5-turbo)
- **SerpApi**: Free tier = 100 searches/month

**Estimated monthly cost**: $0-5 (depending on usage)

---

## Quick Deploy Command

```bash
# One-time setup
git init
git add .
git commit -m "Deploy to Vercel"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# Then deploy
vercel --prod
```

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Support**: https://vercel.com/support

---

**Your chatbot will be live in minutes!** 🎉

After deployment, share your URL: `https://your-project.vercel.app`

