# 🚀 Deployment Guide - Pushing to GitHub

This guide will help you push the entire AI Study Buddy project to your GitHub repository.

## Repository URL
`https://github.com/PrithviKiran791/Study_Buddy-`

## Prerequisites

- Git installed on your system
- GitHub account configured
- Repository access (you should be the owner)

## Step-by-Step Deployment

### Step 1: Initialize Git (if not already done)

```bash
# Check if git is already initialized
git status

# If not initialized, run:
git init
```

### Step 2: Add Remote Repository

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/PrithviKiran791/Study_Buddy-.git

# Or if remote already exists, update it:
git remote set-url origin https://github.com/PrithviKiran791/Study_Buddy-.git

# Verify remote
git remote -v
```

### Step 3: Stage All Files

```bash
# Add all files to staging
git add .

# Verify what will be committed
git status
```

### Step 4: Commit Changes

```bash
# Commit with a descriptive message
git commit -m "Refactor: Transform to React SPA with no-auth landing page hub"
```

Or use this detailed commit message:

```bash
git commit -m "Complete refactor to React SPA architecture

- Remove all authentication and dashboard features
- Transform landing page into central navigation hub
- Migrate from Flask+Jinja to React 19 + Vite
- Implement REST API with JSON responses
- Add glassmorphism UI with Tailwind CSS
- Integrate Framer Motion animations
- Create 7 AI-powered features (Tutor, PDF Chat, Summarizer, Research, Flashcards, Visual QA, Study Planner)
- Enable CORS for React frontend
- Add RAG-based PDF chat with FAISS
- Implement responsive mobile-first design
- No login required - instant access to all features"
```

### Step 5: Push to GitHub

```bash
# Push to main branch
git push -u origin main

# Or if your default branch is master:
git push -u origin master

# If you get errors about divergent branches, use:
git pull origin main --rebase
git push -u origin main
```

### Step 6: Force Push (if needed)

If you have conflicts and want to completely overwrite the remote:

```bash
# ⚠️ WARNING: This will overwrite remote repository
git push -u origin main --force
```

## 🔒 Important: Protect Sensitive Data

Before pushing, ensure `.env` is in `.gitignore`:

```bash
# Check .gitignore includes .env
cat .gitignore | grep .env

# The .gitignore should contain:
# .env
# .env.local
# .env.*.local
```

Never commit your `.env` file with actual API keys!

## 📦 What Gets Pushed

### Included:
- ✅ Backend (Flask API)
- ✅ Frontend (React SPA)
- ✅ Configuration files
- ✅ README documentation
- ✅ Package manifests
- ✅ .env.example (template)
- ✅ .gitignore

### Excluded (via .gitignore):
- ❌ .env (actual API keys)
- ❌ node_modules/
- ❌ __pycache__/
- ❌ venv/
- ❌ dist/
- ❌ .cache/

## 🌐 GitHub Repository Setup

After pushing, configure your repository:

### 1. Update Repository Description

```
AI Study Buddy - Your Personal AI Learning Assistant. React SPA + Flask API with 7 AI-powered learning tools. No authentication required.
```

### 2. Add Topics

```
ai, machine-learning, react, flask, education, study-assistant, gemini-api, pdf-chat, rag, tailwindcss, vite
```

### 3. Update README on GitHub

The README.md will automatically display on your repository page.

### 4. Add GitHub Secrets (for CI/CD later)

Go to Settings → Secrets and variables → Actions:
- `GEMINI_API_KEY` (for automated testing)

## 🔄 Future Updates

To push future changes:

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Your commit message"

# Push
git push origin main
```

## 📋 Quick Commands Reference

```bash
# Check current branch
git branch

# Create new branch
git checkout -b feature-name

# Switch branch
git checkout main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- .

# View differences
git diff
```

## 🐛 Troubleshooting

### Authentication Issues

**HTTPS Authentication:**
```bash
# Configure credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Use personal access token instead of password
# GitHub no longer accepts password authentication
```

**Generate Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` (all)
4. Use token as password when pushing

### Large File Issues

If you get errors about large files:

```bash
# Check file sizes
du -sh *

# Remove large files from git history if needed
git rm --cached path/to/large/file
```

### Merge Conflicts

```bash
# Pull and merge
git pull origin main

# Resolve conflicts in editor
# Then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

## ✅ Verification

After pushing, verify on GitHub:

1. Visit `https://github.com/PrithviKiran791/Study_Buddy-`
2. Check all files are present
3. Verify README displays correctly
4. Test clone on another machine:
   ```bash
   git clone https://github.com/PrithviKiran791/Study_Buddy-.git
   cd Study_Buddy-
   ```

## 📱 Enable GitHub Pages (Optional)

To host the React app on GitHub Pages:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add to package.json:
   ```json
   "homepage": "https://prithvikiran791.github.io/Study_Buddy-",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

## 🎉 Success!

Your AI Study Buddy is now on GitHub! 

Repository: `https://github.com/PrithviKiran791/Study_Buddy-`

Share it with the world! 🌍
