# Netlify Environment Variables Setup

This document lists all environment variables that need to be configured in Netlify for your BrainBox-RetailPlus V25 deployment.

## Required Environment Variables

When deploying to Netlify, you must add these environment variables in your Netlify dashboard under:
**Site Settings → Environment Variables**

### 1. Supabase Configuration

These variables connect your app to the Supabase database:

```
VITE_SUPABASE_URL=https://cnntzmltcevhiqsllagw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnR6bWx0Y2V2aGlxc2xsYWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Mjg2MzEsImV4cCI6MjA3NjEwNDYzMX0.Wng5hS7FlmHxnVfS079E1-6gNaKdykNbHZTKFQ-Gucw
```

### 2. Paystack Configuration (Optional - for payment processing)

If you plan to accept payments via Paystack:

```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_actual_key_here
```

**Note:** Replace the test keys with your actual Paystack keys from your Paystack dashboard.

### 3. App Configuration

```
VITE_APP_NAME=BrainBox-RetailPlus V25
VITE_APP_VERSION=2.5.0
VITE_BUSINESS_NAME=Your Business Name
VITE_BUSINESS_EMAIL=your-business@email.com
VITE_BUSINESS_PHONE=+234-xxx-xxx-xxxx
```

**Note:** Update these values with your actual business information.

### 4. Environment

```
NODE_ENV=production
```

## How to Add Variables in Netlify

1. Log in to your Netlify dashboard
2. Select your site
3. Go to **Site Settings**
4. Click on **Environment Variables** in the left sidebar
5. Click **Add a variable**
6. For each variable above:
   - Enter the **Key** (e.g., `VITE_SUPABASE_URL`)
   - Enter the **Value** (e.g., `https://cnntzmltcevhiqsllagw.supabase.co`)
   - Select **All scopes** or choose specific deploy contexts
   - Click **Create variable**

## Important Notes

1. **VITE_ Prefix**: All frontend environment variables must start with `VITE_` to be accessible in your Vite application.

2. **Security**:
   - The `VITE_SUPABASE_ANON_KEY` is safe to expose in the frontend (it's restricted by Row Level Security)
   - Keep your Paystack secret key secure
   - Never commit actual API keys to your Git repository

3. **Deployment**: After adding/changing environment variables, you must trigger a new deploy for the changes to take effect.

## Verification

After deployment, you can verify your environment variables are working by:
1. Opening your deployed site
2. Checking the browser console for any connection errors
3. Testing the login functionality
4. Verifying database connectivity

## Troubleshooting

If you encounter issues:
- Ensure all variable names are spelled correctly (they are case-sensitive)
- Verify the values don't have extra spaces
- Check that you've triggered a new deploy after adding variables
- Review the Netlify build logs for any errors
