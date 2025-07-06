# Quick Deploy Scripts

This folder contains easy-to-use scripts for committing and deploying your Green Roasteries website changes.

## Available Scripts

### 1. `deploy` - Interactive Menu (Easiest!)
**Perfect for:** Anyone who wants a simple menu interface

```bash
./scripts/quick-deploy/deploy
```

**What it does:**
- 🎯 **Interactive menu** with numbered options
- 🎨 **Color-coded** interface for clarity
- 📖 **Built-in help** and examples
- ✅ **User-friendly** prompts for commit messages
- 🚀 **Access to all deployment options**

**Example:**
```bash
./scripts/quick-deploy/deploy
# Choose option 1 for code-only deploy
# Choose option 2 for deploy with database
# Choose option 3 for status check
```

### 2. `commit-deploy.sh` - Simple Commit & Deploy
**Perfect for:** Code changes, UI updates, bug fixes

```bash
./scripts/quick-deploy/commit-deploy.sh "Your commit message"
```

**What it does:**
- ✅ Adds all changes to git
- ✅ Commits with your message
- ✅ Pushes to origin main
- ✅ Deploys code to server
- ✅ Restarts application

**Example:**
```bash
./scripts/quick-deploy/commit-deploy.sh "Fix header navigation on mobile"
```

### 3. `commit-deploy-db.sh` - Commit, Deploy & Database Update
**Perfect for:** Schema changes, new migrations, database updates

```bash
./scripts/quick-deploy/commit-deploy-db.sh "Your commit message"
```

**What it does:**
- ✅ Adds all changes to git
- ✅ Commits with your message
- ✅ Pushes to origin main
- ✅ Deploys code to server
- ✅ Checks for database migrations
- ✅ Runs migrations safely (with confirmation)
- ✅ Generates Prisma client
- ✅ Restarts application

**Example:**
```bash
./scripts/quick-deploy/commit-deploy-db.sh "Add user preferences table"
```

### 4. `status.sh` - Check Deployment Status
**Perfect for:** Checking if everything is running correctly

```bash
./scripts/quick-deploy/status.sh
```

**What it shows:**
- ✅ Application status
- ✅ Database migration status
- ✅ Recent git commits
- ✅ Server resource usage

## Usage Examples

### Using the Interactive Menu (Recommended!)
```bash
# Launch the interactive menu
./scripts/quick-deploy/deploy

# Then choose:
# Option 1: For UI changes, bug fixes, styling
# Option 2: For database changes, schema updates  
# Option 3: To check status and health
# Option 4: For help and examples
```

### For Regular Code Changes
```bash
# After making changes to components, pages, or styles
./scripts/quick-deploy/commit-deploy.sh "Update product carousel styling"
```

### For Database Changes
```bash
# After creating new migrations or updating schema
./scripts/quick-deploy/commit-deploy-db.sh "Add product reviews table"
```

### Quick Status Check
```bash
# Check if everything is working
./scripts/quick-deploy/status.sh
```

## Safety Features

### Database Safety
- Only runs migrations if there are new ones
- Asks for confirmation before running migrations
- Won't affect database if no migrations are needed
- Backs up before major changes

### Deployment Safety
- Checks git status before committing
- Verifies deployment success
- Automatic rollback on failure
- Connection testing before deployment

## Common Scenarios

### Scenario 1: UI/Frontend Changes
```bash
# You updated components, styling, or frontend logic
./scripts/quick-deploy/commit-deploy.sh "Improve mobile responsive design"
```

### Scenario 2: Backend Changes (No DB)
```bash
# You updated API routes, server logic, but no database changes
./scripts/quick-deploy/commit-deploy.sh "Fix order processing logic"
```

### Scenario 3: Database Schema Changes
```bash
# You created new migrations or updated Prisma schema
./scripts/quick-deploy/commit-deploy-db.sh "Add customer preferences table"
```

### Scenario 4: Major Feature with DB Changes
```bash
# You added a new feature that requires database updates
./scripts/quick-deploy/commit-deploy-db.sh "Add product review system"
```

## Troubleshooting

### If deployment fails:
1. Check the error message
2. Run `./scripts/quick-deploy/status.sh` to see current status
3. Check server logs: `ssh root@167.235.137.52 'pm2 logs'`

### If database migration fails:
1. Check migration status: `ssh root@167.235.137.52 'cd /var/www/greenroasteries && npx prisma migrate status'`
2. The application continues with the previous schema
3. Fix the migration and try again

### If you need to rollback:
1. Use git to revert: `git revert HEAD`
2. Run commit-deploy again: `./scripts/quick-deploy/commit-deploy.sh "Rollback previous changes"`

## Script Features

### Color-coded Output
- 🔵 **Blue:** Information and progress
- 🟢 **Green:** Success messages
- 🟡 **Yellow:** Warnings and confirmations
- 🔴 **Red:** Errors and failures

### Smart Detection
- Detects if there are changes to commit
- Only runs migrations if needed
- Verifies deployment success
- Checks application health

### User-friendly
- Clear progress messages
- Helpful error messages
- Usage examples
- Safe confirmation prompts

## Requirements

- Git repository
- SSH access to server
- Node.js and npm/npx
- PM2 for process management
- Prisma for database management

## Quick Reference

```bash
# Interactive menu (easiest)
./scripts/quick-deploy/deploy

# Simple deploy
./scripts/quick-deploy/commit-deploy.sh "message"

# Deploy with database
./scripts/quick-deploy/commit-deploy-db.sh "message"

# Check status
./scripts/quick-deploy/status.sh

# Make scripts executable (if needed)
chmod +x scripts/quick-deploy/*.sh
```

---

**Pro Tip:** These scripts are designed to be safe and easy to use. When in doubt, use `commit-deploy-db.sh` - it will check for database changes and only apply them if needed. 