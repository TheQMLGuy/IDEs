# AI IDE Setup Guide

## Quick Start

```bash
cd "c:\Github Repos\AI-IDE"
npm install
npm run dev
```

---

## Kaggle API Setup (Required for Dataset Import)

1. **Go to Kaggle**: https://www.kaggle.com/settings
2. **Scroll to "API" section** and click **"Create New Token"**
3. This downloads `kaggle.json` 
4. **Move it to**: `C:\Users\dtmat\.kaggle\kaggle.json`

Or run this command after downloading:
```powershell
Move-Item "$env:USERPROFILE\Downloads\kaggle.json" "$env:USERPROFILE\.kaggle\kaggle.json"
```

---

## Python Dependencies

```bash
pip install pandas kaggle scikit-learn numpy
```

---

## Folder Structure

```
AI-IDE/
├── datasets/          # Downloaded Kaggle datasets go here
├── py/                # Python scripts for backend
├── src/               # React frontend
├── electron/          # Electron main process
└── package.json
```

---

## Running the App

| Mode | Command |
|------|---------|
| Electron (Full) | `npm run dev` |
| Web (Mock APIs) | `npx vite` |
| Build | `npm run build` |
