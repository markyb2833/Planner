# Railway Deployment Checklist

Quick reference for deploying to Railway. ✅ = Done

## Pre-Deployment

- [ ] Code pushed to GitHub/GitLab
- [ ] All features tested locally
- [ ] Railway account created (paid plan for persistent storage)

## Railway Setup

- [ ] Create new Railway project
- [ ] Connect to GitHub repository
- [ ] Add MySQL database service
- [ ] Create Volume (name: `planner-uploads`, mount: `/app/uploads`)
- [ ] Attach Volume to main service

## Environment Variables

Set these in Railway's **Variables** tab:

### Required
- [ ] `NODE_ENV` = `production`
- [ ] `JWT_SECRET` = (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `RAILWAY_VOLUME_MOUNT_PATH` = `/app/uploads`

### Optional (Email)
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_USER` = your email
- [ ] `SMTP_PASS` = app password
- [ ] `EMAIL_FROM` = noreply email

### Auto-Set by Railway
- [ ] `DATABASE_URL` (set automatically by MySQL service)

## Post-Deployment

- [ ] Wait for build to complete
- [ ] Initialize database: Run `npm run setup-db` in Railway shell
- [ ] Open public URL
- [ ] Test registration
- [ ] Test creating a page
- [ ] Test uploading an image
- [ ] Test real-time updates (open in 2 browsers)
- [ ] Redeploy to verify uploads persist

## Optional

- [ ] Add custom domain
- [ ] Update DNS with CNAME record
- [ ] Enable monitoring/alerts
- [ ] Set up database backups

## Verification Commands

Run these in Railway's shell to verify:

```bash
# Check volume is mounted
ls -la /app/uploads

# Check environment
env | grep NODE_ENV
env | grep RAILWAY_VOLUME

# Check database connection
echo "SELECT 1" | mysql $DATABASE_URL
```

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Images disappear after deploy | Verify volume is attached & `RAILWAY_VOLUME_MOUNT_PATH` is set |
| Database connection fails | Check `DATABASE_URL` variable exists |
| Build fails | Review logs, check `package.json` scripts |
| Socket.io doesn't work | Ensure using Hobby plan or higher |

---

**Need detailed instructions?** See `RAILWAY_DEPLOYMENT.md`

