# GitHub Pages Deployment Instructions

## Issues Fixed

This repository had several issues preventing it from working on GitHub Pages:

1. **Missing Entry Point**: The `index.html` was missing the script tag to load the React application (`index.tsx`)
2. **No JavaScript Bundling**: Without the entry point, Vite wasn't bundling the JavaScript files
3. **Incorrect Base Path**: GitHub Pages serves from a subdirectory, requiring the base path to be set
4. **Import Maps**: The HTML contained import maps which aren't needed with bundled builds
5. **No Deployment Workflow**: There was no GitHub Actions workflow to build and deploy automatically

## Changes Made

### 1. Fixed index.html
- Added `<script type="module" src="/index.tsx"></script>` to load the application
- Removed unnecessary import maps (not needed with bundled build)

### 2. Updated vite.config.ts
- Added `base: '/Student-workspace-/'` for correct GitHub Pages path
- Added plugin to copy `.nojekyll` file to prevent Jekyll processing

### 3. Created GitHub Actions Workflow
- Created `.github/workflows/deploy.yml` for automated deployment
- Workflow triggers on pushes to `main` branch or manual dispatch
- Builds the project and deploys to GitHub Pages

## How to Deploy

### Prerequisites
The repository owner needs to enable GitHub Pages in the repository settings:

1. Go to repository **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**

### Automatic Deployment
Once GitHub Pages is enabled, the site will automatically deploy when:
- Code is pushed to the `main` branch
- You manually trigger the workflow from the Actions tab

### Manual Build
To build locally:
```bash
npm install
npm run build
```

The build output will be in the `dist/` directory.

### Preview Locally
To preview the built site:
```bash
npm run preview
```

Then visit `http://localhost:4173/Student-workspace-/`

## Verification

After deployment, the site should be accessible at:
`https://appbuilder2903.github.io/Student-workspace-/`

## Notes

- The `.nojekyll` file is required to prevent GitHub Pages from ignoring files starting with underscore
- The build generates a bundled JavaScript file (~277KB) in `dist/assets/`
- The application requires a Gemini API key to function (set via environment variable)
- For local development, use `npm run dev` which doesn't require the base path
