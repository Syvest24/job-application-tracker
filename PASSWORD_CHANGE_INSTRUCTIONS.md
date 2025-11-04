# How to Change Admin Password in Vercel

## Overview
The admin password is stored as an environment variable called `ADMIN_PASSWORD`. This password is used for:
- **Portfolio Admin Panel**: Editing portfolio content and uploading CVs
- **Job Tracker**: Adding, editing, and deleting job applications

## Step-by-Step Instructions for Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Log into Vercel**
   - Go to https://vercel.com
   - Sign in to your account

2. **Select Your Project**
   - Click on your project from the dashboard
   - Navigate to the project settings

3. **Access Environment Variables**
   - Click on **"Settings"** tab at the top
   - Scroll down and click on **"Environment Variables"** in the left sidebar

4. **Add/Update ADMIN_PASSWORD**
   
   **If the variable doesn't exist (First Time):**
   - Click **"Add New"** button
   - **Key:** `ADMIN_PASSWORD`
   - **Value:** Your new secure password (e.g., `MySecurePass2024!`)
   - **Environment:** Select all environments (Production, Preview, Development)
   - Click **"Save"**

   **If the variable already exists:**
   - Find `ADMIN_PASSWORD` in the list
   - Click the **"Edit"** button (pencil icon) next to it
   - Enter your new password value
   - Click **"Save"**

5. **Redeploy Your Application**
   - Go to the **"Deployments"** tab
   - Find the latest deployment
   - Click the three dots menu (⋮)
   - Select **"Redeploy"**
   - Or simply push a new commit to trigger automatic redeployment

6. **Verify the Change**
   - Wait for deployment to complete (usually 1-2 minutes)
   - Go to your app's admin page: `https://your-app.vercel.app/admin`
   - Try logging in with your new password

---

### Method 2: Using Vercel CLI

If you prefer using the command line:

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Add Environment Variable**
   ```bash
   vercel env add ADMIN_PASSWORD
   ```
   - When prompted, enter your new password
   - Select which environments to apply (Production, Preview, Development)

4. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## Important Security Notes

### ⚠️ Password Requirements
- Use a strong password (at least 12 characters)
- Include uppercase, lowercase, numbers, and special characters
- Example: `MyApp2024!Secure#Pass`

### 🔒 Best Practices
1. **Never commit passwords to Git**
   - The `.env` files are in `.gitignore`
   - Always use environment variables

2. **Different passwords for different environments**
   - Use different passwords for Development/Preview vs Production
   - You can set environment-specific variables in Vercel

3. **Change password regularly**
   - Update every 3-6 months
   - Update immediately if compromised

4. **Keep password secure**
   - Don't share via email or messaging apps
   - Use a password manager
   - Don't write it down in plain text

---

## Testing Your New Password

### Test Portfolio Admin:
1. Go to: `https://your-app.vercel.app/admin`
2. Enter your new password
3. You should be able to:
   - Edit portfolio content
   - Upload CV files
   - Save changes successfully

### Test Job Tracker:
1. Go to: `https://your-app.vercel.app/`
2. Click **"Add Application"**
3. Enter your new password when prompted
4. You should be able to:
   - Add new job applications
   - Edit existing applications
   - Delete applications

---

## Troubleshooting

### Password Not Working After Change:

1. **Check Deployment Status**
   - Ensure the deployment completed successfully
   - Check Vercel deployment logs for errors

2. **Clear Browser Cache**
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Press `Cmd + Shift + R` (Mac)
   - Or clear browser cache and cookies

3. **Verify Environment Variable**
   - Go back to Vercel Settings → Environment Variables
   - Confirm `ADMIN_PASSWORD` is set correctly
   - Check it's applied to the right environment (Production)

4. **Check for Typos**
   - Passwords are case-sensitive
   - Ensure no extra spaces
   - Check special characters are correct

### Still Having Issues?

1. **Check Backend Logs**
   - In Vercel, go to your deployment
   - Click on "Functions" tab
   - Check the logs for any errors

2. **Test with Default Password**
   - Temporarily set `ADMIN_PASSWORD` to `admin123`
   - Redeploy and test
   - Then change to your secure password

3. **Contact Support**
   - Check Emergent documentation
   - Reach out to your development team

---

## Current Default Password

**⚠️ IMPORTANT: Change this immediately in production!**

Default password: `admin123`

This is only for development/testing. Always use a secure password in production.

---

## Additional Information

### Where Password is Used:

1. **Backend API** (`/app/backend/server.py`):
   - Line with `ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')`
   - Used for authentication in portfolio and job tracker endpoints

2. **Frontend Components**:
   - `/app/frontend/src/pages/Admin.jsx` - Portfolio admin login
   - `/app/frontend/src/pages/JobTracker.jsx` - Job application management

### Password Storage:
- ✅ Stored as environment variable (secure)
- ✅ Not in source code
- ✅ Not in database
- ✅ Not logged or exposed in client

---

## Quick Reference Commands

```bash
# View current environment variables (Vercel CLI)
vercel env ls

# Add new environment variable
vercel env add ADMIN_PASSWORD

# Remove environment variable
vercel env rm ADMIN_PASSWORD

# Pull environment variables to local
vercel env pull

# Redeploy with new env vars
vercel --prod
```

---

## Summary Checklist

- [ ] Logged into Vercel Dashboard
- [ ] Navigated to Settings → Environment Variables
- [ ] Added/Updated `ADMIN_PASSWORD`
- [ ] Selected correct environments
- [ ] Saved the changes
- [ ] Redeployed the application
- [ ] Tested login on `/admin` page
- [ ] Tested "Add Application" on Job Tracker
- [ ] Verified all functionality works
- [ ] Documented new password securely (password manager)

---

**Last Updated:** 2025
**Documentation Version:** 1.0
