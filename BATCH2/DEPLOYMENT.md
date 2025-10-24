# Deployment Guide for BrainBox-RetailPlus V25

## Quick Deployment to Netlify

Your application is built and ready for deployment! Follow these simple steps:

### Option 1: Drag & Drop (Easiest)

1. **Locate your dist folder**
   - Path: `./dist` in your project directory
   - This folder contains all your built application files

2. **Open Netlify Drop Zone**
   - Visit: [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Or use the deployment helper button in your app (visible to admin users)

3. **Deploy**
   - Drag and drop the entire `dist` folder into the Netlify drop zone
   - Wait for deployment to complete
   - Your app will be live at a Netlify URL!

### Option 2: Netlify CLI

If you have Netlify CLI installed:

```bash
npx netlify-cli deploy --prod --dir=dist
```

### Post-Deployment Configuration

After deploying, you need to add your environment variables in Netlify:

1. Go to your site in Netlify Dashboard
2. Navigate to: **Site Settings → Environment Variables**
3. Add the following variables:

```
VITE_SUPABASE_URL=https://swbdsceqkzauwrnyrjoj.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_PAYSTACK_SECRET_KEY=your_paystack_secret_key
VITE_APP_NAME=BrainBox-RetailPlus V25
VITE_APP_VERSION=2.5.0
VITE_BUSINESS_NAME=Your Business Name
VITE_BUSINESS_EMAIL=your-business@email.com
VITE_BUSINESS_PHONE=+234-xxx-xxx-xxxx
NODE_ENV=production
```

4. Trigger a redeploy for the variables to take effect

### Important Notes

- The `dist` folder is generated when you run `npm run build`
- Always rebuild before deploying: `npm run build`
- Your Supabase database is already configured and running
- Paystack integration requires valid API keys to process real payments
- The deployment helper UI is available in-app for admin users

### Troubleshooting

**Dist folder not found?**
Run: `npm run build`

**Environment variables not working?**
Make sure you've added them in Netlify's dashboard and redeployed.

**Database not connecting?**
Verify your Supabase URL and anon key are correct in the environment variables.

---

For more help, visit:
- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
