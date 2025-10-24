# 🚀 How to Deploy Your App to Netlify

Since you're working in Bolt, follow these steps:

## Step 1: Download Your Project
1. In Bolt, click the **Download** button (usually top-right)
2. Download the entire project as a ZIP file
3. Extract the ZIP on your computer

## Step 2: Find the `dist` Folder
1. Inside the extracted project folder, find the **`dist`** folder
2. This folder contains your ready-to-deploy website

## Step 3: Deploy to Netlify (Easiest Way)
1. Go to: **https://app.netlify.com/drop**
2. Sign up or login (it's free!)
3. **Drag and drop** the entire `dist` folder onto the page
   - Or click to browse and select the `dist` folder
4. Wait 10-30 seconds
5. **Done!** You'll get a live URL like: `https://your-site-name.netlify.app`

## Alternative: Netlify Dashboard Method
1. Go to: **https://app.netlify.com**
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag the `dist` folder or click to upload
4. Your site is live!

## 🔧 Need to Update Environment Variables?
After deployment:
1. In Netlify dashboard, go to: **Site settings** → **Environment variables**
2. Add these variables from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Any other `VITE_` variables you have
3. Click **"Deploy"** → **"Trigger deploy"** to rebuild with new variables

## ✅ Your Site Should Now Be Live!

Your Netlify URL will look like: `https://your-app-name.netlify.app`

You can:
- Share this URL with anyone
- Set up a custom domain (in Netlify settings)
- Enable automatic deployments from Git (optional)

---

**Need Help?** The app is fully built and ready in the `dist` folder. Just upload that folder to Netlify and you're done!
