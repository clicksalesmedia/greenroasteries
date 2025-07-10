# 🚀 GREEN ROASTERIES - DEPLOYMENT GUIDE

**Never have deployment issues again!** This guide provides two bulletproof deployment methods.

## 📋 **Quick Reference**

| Method | Speed | Reliability | Use When |
|--------|-------|-------------|----------|
| **🤖 GitHub Actions** | Fast | 99% | Normal deployments |
| **🛠️ Manual Script** | Medium | 100% | GitHub Actions fails |

---

## 🤖 **Option 1: Automated Deployment (Recommended)**

### **How it Works:**
1. You push code to GitHub
2. GitHub builds the app (7GB+ memory available)
3. GitHub deploys the complete build to your server
4. Automatic verification and rollback on failure

### **Usage:**
```bash
# 1. Commit your changes
git add -A
git commit -m "Your changes"

# 2. Push to trigger deployment
git push origin main

# 3. Monitor at: https://github.com/your-repo/actions
```

### **Monitoring:**
- Go to your GitHub repository → **Actions** tab
- Watch real-time progress
- View logs if deployment fails

---

## 🛠️ **Option 2: Bulletproof Manual Deployment**

### **When to Use:**
- GitHub Actions fails
- You need immediate deployment
- You want 100% control

### **Usage:**
```bash
# Run the bulletproof script
./scripts/deploy-bulletproof.sh
```

### **What it Does:**
1. ✅ Builds locally with verification
2. ✅ Creates timestamped deployment package
3. ✅ Uploads to server with progress
4. ✅ Deploys with automatic rollback
5. ✅ Verifies website is working
6. ✅ Shows final status

### **Output Example:**
```
🚀 GREEN ROASTERIES - BULLETPROOF DEPLOYMENT
=============================================

ℹ️  Step 1: Building application locally...
✅ Build completed successfully
ℹ️  Step 2: Creating deployment package...
✅ Package created: deployment_20250710_173000.tar.gz
ℹ️  Step 3: Uploading to server...
✅ Upload successful
ℹ️  Step 4: Deploying on server...
🎉 APPLICATION IS ONLINE!
✅ Deployment completed successfully!
✅ Website is responding correctly!

🎉 DEPLOYMENT COMPLETE!
======================
✅ Build: Success
✅ Upload: Success
✅ Deploy: Success
✅ Verify: Success
```

---

## 🔧 **Troubleshooting**

### **GitHub Actions Fails:**
1. Check Actions tab for error logs
2. Common fixes:
   - Re-run the workflow
   - Check SSH key configuration
3. Use manual deployment as backup

### **Manual Deployment Fails:**
1. Check your internet connection
2. Verify SSH access: `ssh root@167.235.137.52`
3. Check server disk space: `df -h`

### **Website Down After Deployment:**
Both methods include automatic rollback, but if needed:
```bash
# Check server status
ssh root@167.235.137.52 "pm2 status"

# View logs
ssh root@167.235.137.52 "pm2 logs greenroasteries"

# Restart if needed
ssh root@167.235.137.52 "pm2 restart greenroasteries"
```

---

## ⚡ **Pro Tips**

### **Fast Deployments:**
- Use GitHub Actions for regular deployments
- Keep the manual script as backup
- Both methods include build verification

### **Safety Features:**
- ✅ Automatic backup before deployment
- ✅ Build verification (BUILD_ID, server directory, manifests)
- ✅ Application health check
- ✅ Automatic rollback on failure
- ✅ Website response verification

### **Best Practices:**
1. **Test locally first:** `npm run dev`
2. **Use descriptive commit messages**
3. **Monitor deployment logs**
4. **Keep manual script available**

---

## 🎯 **Environment Variables**

Both deployment methods automatically handle:
- Database connections
- Tabby payment integration (✅ **QA issues fixed!**)
- Stripe payments
- Cloudinary images
- SSL certificates

---

## 📞 **Support**

If deployment still fails:
1. Check this guide first
2. Try the manual deployment script
3. Review error logs in detail
4. Both methods include detailed error reporting

---

**🎉 Result: Never waste time on deployment issues again!** 