# Netlify Deployment Guide

## Repository Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named: `brainbox-retailplusv25`
3. Make it private or public based on your preference
4. Do NOT initialize with README, .gitignore, or license (we already have these)

### 2. Push Your Code to GitHub

Run these commands in your project directory:

```bash
git init
git add .
git commit -m "Initial commit: BrainBox RetailPlus v25"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/brainbox-retailplusv25.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Netlify Deployment

### 1. Connect to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select the `brainbox-retailplusv25` repository

### 2. Configure Build Settings

Netlify should auto-detect these settings from `netlify.toml`, but verify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18

### 3. Add Environment Variables

In Netlify dashboard, go to: **Site settings → Environment variables**

Add the following variables:

#### Supabase Configuration
```
VITE_SUPABASE_URL=https://swbdsceqkzauwrnyrjoj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3YmRzY2Vxa3phdXdybnlyam9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTQwNTAsImV4cCI6MjA3NTQzMDA1MH0.CZ0L9li7dkPoXfa51dM-VMhYL0hWP7uKYWqoV9eFbkc
```

#### Paystack Configuration
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_9c01b6d630659baf2ef96fcf4fb5125f59fbdda7
VITE_PAYSTACK_SECRET_KEY=sk_test_9af43345f4c36dbd0abe5a1f12bb8d09aaeabc93
```

### 4. Deploy

1. Click "Deploy site"
2. Netlify will build and deploy your application
3. You'll get a URL like: `https://random-name-123456.netlify.app`

### 5. Custom Domain (Optional)

1. Go to **Site settings → Domain management**
2. Click "Add custom domain"
3. Follow the instructions to configure your domain

## Features Included

Your Netlify deployment includes:

- **Automatic HTTPS** - SSL certificate automatically provisioned
- **Continuous Deployment** - Auto-deploys on every push to main branch
- **SPA Routing** - Configured to handle React Router properly
- **Security Headers** - XSS protection, content security policy, etc.
- **Asset Caching** - Optimized cache headers for static assets
- **PWA Support** - Service worker for offline functionality

## Deployment Status

After deployment, verify:

1. Site loads correctly
2. Supabase connection works
3. Authentication functions
4. Payment integration with Paystack works
5. All pages and features are accessible

## Troubleshooting

### Build Fails

- Check build logs in Netlify dashboard
- Verify all dependencies are in `package.json`
- Ensure Node version matches (18)

### Environment Variables Not Working

- Make sure variables start with `VITE_`
- Redeploy after adding environment variables
- Check for typos in variable names

### 404 Errors on Page Refresh

- Verify `netlify.toml` is in the repository
- Check the redirects configuration

### Supabase Connection Issues

- Verify environment variables are set correctly
- Check Supabase dashboard for any restrictions
- Ensure Supabase project is active

## Post-Deployment

After successful deployment:

1. Test all critical features
2. Set up monitoring (optional)
3. Configure deploy notifications
4. Add deploy previews for pull requests
5. Set up branch deploys if needed

## Support

- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Create issues in your repository

---

**Note:** The current configuration uses test keys for Paystack. For production, replace with live keys from your Paystack dashboard.
