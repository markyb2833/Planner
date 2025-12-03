# Railway Deployment Guide

Complete guide to deploy your Planner app on Railway with persistent storage.

## Prerequisites
- Railway account with paid plan (for Volumes)
- Git repository
- Your code pushed to GitHub/GitLab

---

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

---

## Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. Railway will automatically create a `DATABASE_URL` variable

> **Note:** The database will be automatically linked to your service. No manual configuration needed!

---

## Step 3: Create a Volume for Persistent Storage

1. In your Railway project, click **"+ New"**
2. Select **"Volume"**
3. Configure the volume:
   - **Name:** `planner-uploads` (or any name you prefer)
   - **Mount Path:** `/app/uploads`
   - **Size:** Start with 1GB (you can resize later)

4. **Connect the volume to your service:**
   - Click on your main service (the web app)
   - Go to **"Settings"** → **"Volumes"**
   - Click **"Attach Volume"**
   - Select the volume you just created

---

## Step 4: Set Environment Variables

In your service's **"Variables"** tab, add the following:

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables production mode |
| `JWT_SECRET` | `your-super-secret-key-min-32-chars` | Random secure string |
| `RAILWAY_VOLUME_MOUNT_PATH` | `/app/uploads` | Path where volume is mounted |

### Email Configuration (Optional - for password reset)

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |
| `EMAIL_FROM` | `noreply@yourapp.com` |

> **Note:** `DATABASE_URL` is automatically set by Railway when you add the MySQL database

### Generate a Secure JWT Secret

Run this in your terminal to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5: Deploy

Railway will automatically deploy your app. The build process:

1. ✅ Installs server dependencies
2. ✅ Installs client dependencies
3. ✅ Builds React frontend
4. ✅ Starts Node.js server

Watch the deployment logs in Railway's dashboard.

---

## Step 6: Initialize Database

After the first successful deployment:

1. Go to your service in Railway
2. Click the **"..."** menu → **"Run a command"**
3. Execute:
   ```bash
   npm run setup-db
   ```

This creates all necessary database tables.

---

## Step 7: Test Your Deployment

1. Click the **"Public URL"** in Railway (looks like `your-app.up.railway.app`)
2. Register a new account
3. Create a page
4. Test uploading an image to a card
5. Redeploy the app and verify images persist ✅

---

## Custom Domain (Optional)

### Add Your Domain

1. Go to your service → **"Settings"** → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `planner.yourdomain.com`)
4. Add the provided CNAME record to your DNS provider:
   - **Type:** CNAME
   - **Name:** `planner` (or your subdomain)
   - **Value:** The Railway domain

### Update Environment Variable

After adding a custom domain, update:

```
RAILWAY_VOLUME_MOUNT_PATH=/app/uploads
```

No other changes needed - the app automatically handles production URLs.

---

## Troubleshooting

### Images Not Persisting

**Problem:** Uploaded images disappear after redeployment.

**Solution:**
1. Verify the volume is attached to your service
2. Check `RAILWAY_VOLUME_MOUNT_PATH` is set to `/app/uploads`
3. Check deployment logs for "📁 Serving uploads from: /app/uploads"

### Database Connection Error

**Problem:** App can't connect to database.

**Solution:**
1. Ensure MySQL service is running
2. Verify `DATABASE_URL` exists in variables
3. Check database logs for connection issues

### Build Fails

**Problem:** Deployment fails during build.

**Solution:**
1. Check build logs in Railway
2. Verify all dependencies in `package.json`
3. Try running `npm run build` locally first

### Socket.io Not Working

**Problem:** Real-time updates don't work.

**Solution:**
1. Railway automatically enables WebSockets
2. Verify your service is using a **Hobby plan or higher**
3. Check browser console for socket connection errors

---

## Monitoring & Maintenance

### View Logs

- Go to your service → **"Logs"** tab
- Filter by severity (Error, Warning, Info)

### Check Resource Usage

- Go to your service → **"Metrics"** tab
- Monitor CPU, Memory, Network, and Disk usage

### Resize Volume

If you need more storage:
1. Go to the Volume settings
2. Click **"Resize"**
3. Enter new size (can only increase, not decrease)

### Database Backups

Railway Pro plans include automatic daily backups:
1. Go to MySQL service → **"Backups"** tab
2. Click **"Create Backup"** for manual backup
3. Download or restore as needed

---

## Estimated Costs (Railway Paid Plan)

| Resource | Cost |
|----------|------|
| Web Service (Hobby) | ~$5/month |
| MySQL Database | ~$5/month |
| Volume (1GB) | ~$0.25/month |
| **Total** | **~$10-11/month** |

*Prices may vary. Check [Railway's pricing](https://railway.app/pricing) for latest rates.*

---

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use strong JWT secrets (32+ characters)
3. ✅ Enable 2FA on your Railway account
4. ✅ Regularly update dependencies
5. ✅ Monitor logs for suspicious activity
6. ✅ Use HTTPS only (Railway provides this automatically)

---

## Useful Commands

### Run in Railway Shell

Access your production environment:

```bash
# View files
ls -la /app/uploads

# Check disk space
df -h

# View environment variables
env | grep MYSQL
```

### Local Development

```bash
# Install dependencies
npm install
cd client && npm install

# Run development server
npm run dev

# Run production build locally
npm run build
npm start
```

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **App Issues:** Check your repository issues page

---

**🎉 Your Planner app is now live with persistent storage!**

