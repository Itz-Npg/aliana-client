# 🚀 GitHub Setup Guide for Aliana-Client

This guide will help you set up this project on GitHub with automated builds, testing, and documentation hosting.

## 📋 Prerequisites

- Git installed on your computer
- A GitHub account
- Node.js 18+ installed locally

---

## 🎯 Quick Setup Steps

### 1️⃣ Initialize Git Repository (if not done)

```bash
git init
git add .
git commit -m "Initial commit: Aliana-Client music bot library"
```

### 2️⃣ Create GitHub Repository

1. Go to [GitHub](https://github.com) and click **"New Repository"**
2. Name it: `aliana-client` (or your preferred name)
3. **Don't** initialize with README (you already have one)
4. Click **"Create repository"**

### 3️⃣ Connect Local Repo to GitHub

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/aliana-client.git
git branch -M main
git push -u origin main
```

---

## ⚙️ Automated Features

Once pushed to GitHub, the following will happen automatically:

### ✅ **Build & Test** (`.github/workflows/build.yml`)
- Runs on every push and pull request
- Tests on Node.js 18.x and 20.x
- Runs type checking
- Builds the project
- Uploads build artifacts

### 📄 **Documentation Deployment** (`.github/workflows/deploy-docs.yml`)
- Deploys your `/docs` folder to GitHub Pages
- Runs on every push to `main` branch
- Your docs will be live at: `https://YOUR_USERNAME.github.io/aliana-client/`

### 📦 **NPM Publishing** (`.github/workflows/npm-publish.yml`)
- Automatically publishes to NPM when you create a release
- Requires NPM_TOKEN secret (see below)

---

## 🌐 Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. Save and wait for deployment (3-5 minutes)
5. Your docs will be live at `https://YOUR_USERNAME.github.io/aliana-client/`

---

## 🔐 Setup NPM Publishing (Optional)

If you want to publish to NPM automatically:

### 1. Get NPM Token
```bash
npm login
npm token create
```

### 2. Add to GitHub Secrets
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Paste your NPM token
5. Click **Add secret**

### 3. Create a Release
```bash
# Update version in package.json, then:
git add package.json
git commit -m "Bump version to 1.0.3"
git tag v1.0.3
git push origin main --tags
```

Then go to GitHub → **Releases** → **Create new release** → Select your tag → Publish

---

## 🧪 Testing Locally

Before pushing to GitHub, test everything works:

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Build the project
npm run build

# Test the docs server
npx serve docs -l 5000
```

---

## 📁 Project Structure

```
aliana-client/
├── .github/
│   └── workflows/
│       ├── build.yml          # Auto build & test
│       ├── deploy-docs.yml    # Auto deploy docs
│       └── npm-publish.yml    # Auto publish to NPM
├── docs/                      # Documentation website
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── src/                       # Source code
├── testbot/                   # Example Discord bot
├── dist/                      # Built files (auto-generated)
└── package.json
```

---

## 🔄 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Build & Test** | Push/PR to any branch | Validates code quality |
| **Deploy Docs** | Push to `main` | Updates documentation site |
| **NPM Publish** | New Release created | Publishes to NPM registry |

---

## 🐛 Troubleshooting

### Build fails on GitHub Actions
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Review error logs in Actions tab

### GitHub Pages not working
1. Verify Pages is enabled in Settings
2. Check that `docs/` folder exists
3. Wait 5-10 minutes for first deployment
4. Check Actions tab for deployment status

### NPM publish fails
- Verify `NPM_TOKEN` secret is set
- Check token permissions
- Ensure package name is available on NPM

---

## 🎉 You're Done!

Your repository is now set up with:
- ✅ Automated testing and builds
- ✅ Documentation hosting
- ✅ NPM publishing workflow

**Next Steps:**
1. Share your docs URL: `https://YOUR_USERNAME.github.io/aliana-client/`
2. Publish to NPM when ready
3. Add badges to README (see below)

---

## 🏷️ Add Status Badges to README

Add these to your README.md:

```markdown
[![Build Status](https://github.com/YOUR_USERNAME/aliana-client/workflows/Build%20and%20Test/badge.svg)](https://github.com/YOUR_USERNAME/aliana-client/actions)
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen)](https://YOUR_USERNAME.github.io/aliana-client/)
[![GitHub Pages](https://github.com/YOUR_USERNAME/aliana-client/workflows/Deploy%20Documentation/badge.svg)](https://YOUR_USERNAME.github.io/aliana-client/)
```

---

## 💡 Tips

- Use **branches** for features: `git checkout -b feature/new-feature`
- Create **pull requests** for code review
- Use **GitHub Issues** for bug tracking
- Tag releases with semantic versioning: `v1.0.0`, `v1.1.0`, etc.

---

## 📞 Need Help?

- Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Review [GitHub Pages Guide](https://pages.github.com/)
- Check workflow logs in the **Actions** tab

Happy coding! 🎵
