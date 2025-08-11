# 🚀 Luna Analytics - Branching Strategy

## Branch Structure

- **`production`** - Production-ready, stable code deployed to https://millie-static.vercel.app
- **`staging`** - Testing environment for new features before production
- **`main`** - Development branch for active work

## Workflow

### 1. Feature Development
```bash
# Start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "✨ Add new feature"
git push origin feature/your-feature-name
```

### 2. Testing in Staging
```bash
# Merge to staging for testing
git checkout staging
git pull origin staging
git merge feature/your-feature-name
git push origin staging

# Test on staging environment
# Fix any issues by creating hotfix commits
```

### 3. Production Release
```bash
# Once staging is tested and stable
git checkout production
git pull origin production
git merge staging
git push origin production

# This triggers Vercel production deployment
```

### 4. Cleanup
```bash
# After successful production deploy
git checkout main
git merge production  # Keep main up to date
git push origin main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Vercel Deployment Setup

**Recommended Setup:**
- **Production**: Deploy from `production` branch → https://millie-static.vercel.app
- **Staging**: Deploy from `staging` branch → https://staging-millie-static.vercel.app  
- **Development**: Deploy from `main` branch → https://dev-millie-static.vercel.app

## Benefits

✅ **Safe Production**: Only tested code reaches production  
✅ **Staging Testing**: Full environment testing before users see changes  
✅ **Rollback Ready**: Easy to revert production issues  
✅ **Team Collaboration**: Clear workflow for multiple developers  
✅ **Feature Isolation**: Work on features without breaking main development

## Emergency Hotfixes

For critical production issues:
```bash
# Create hotfix from production
git checkout production
git checkout -b hotfix/critical-fix

# Make minimal fix
git add .
git commit -m "🚨 Fix critical issue"

# Deploy immediately
git checkout production
git merge hotfix/critical-fix
git push origin production

# Backport to other branches
git checkout staging
git merge hotfix/critical-fix
git push origin staging

git checkout main  
git merge hotfix/critical-fix
git push origin main
```
