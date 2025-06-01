# Admin Panel Access Guide

## 🔒 Production Admin Access

When you need to update content (sliders, products, etc.), you should work directly on the production admin panel, not locally.

### Access Production Admin
```
URL: https://thegreenroasteries.com/backend
```

### Why Work on Production?
- ✅ Changes are immediately live to customers
- ✅ No deployment needed for content updates
- ✅ Real data, real environment
- ✅ No database synchronization issues

## 🚫 Common Mistake

**DON'T do this for content updates:**
1. Update content locally ❌
2. Run `./update.sh` ❌
3. Wonder why changes don't appear ❌

**DO this instead:**
1. Go to https://thegreenroasteries.com/backend ✅
2. Update content directly on production ✅
3. Changes are immediately live ✅

## 🛠 When to Use `./update.sh`

Only use the deployment script for **code changes**:
- ✅ New features
- ✅ Bug fixes
- ✅ Design changes
- ✅ New components
- ✅ Configuration updates

## 🔄 Development Workflow

### For Content Updates:
```bash
# Go directly to production admin
open https://thegreenroasteries.com/backend
```

### For Code Changes:
```bash
# Make code changes locally
git add .
git commit -m "Your changes"
./update.sh  # This deploys code to production
```

## 🔐 Admin Authentication

If you need admin authentication setup:
1. The admin panel is currently open (no auth required)
2. You can add authentication later if needed
3. Access is controlled by URL knowledge only

## 📊 Database Information

- **Local Database**: `postgresql://mounirbennassar@localhost:5432/greenroasteries`
- **Production Database**: Managed on production server
- **No Sync**: Local and production databases are separate

## 🚨 Important Notes

1. **Content changes** (sliders, products) → Use production admin
2. **Code changes** (features, fixes) → Use `./update.sh`
3. Never try to sync databases manually
4. Production admin is the source of truth for content 