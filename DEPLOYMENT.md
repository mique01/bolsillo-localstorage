# Deployment Guide for BolsilloApp

This document outlines how to deploy BolsilloApp to both GitHub Pages and Vercel, including important details about environment detection and common issues.

## Environment Detection

The application includes environment detection logic that adjusts configurations based on where it's running:

- **GitHub Pages**: Static export with optimized settings for GitHub's static hosting
- **Vercel**: Full Next.js application with server-side rendering capabilities
- **Local Development**: Development mode with enhanced debugging

Environment detection is implemented in multiple places:

1. `src/lib/utils/networkUtils.ts` - Detects environment for network requests
2. `next.config.js` - Sets build options based on environment

## Data Storage

The application uses localStorage for data persistence. The data structure is defined in the README.md file.

### Data Management

1. All data is stored locally in the browser's localStorage
2. Data is automatically loaded when the application starts
3. Changes are immediately persisted to localStorage
4. Data is structured according to the interfaces defined in the README

## Deployment Steps

### GitHub Pages

1. Configure the GitHub workflow in `.github/workflows/deploy.yml`
2. Push to the main branch to trigger deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Deploy from the Vercel dashboard or push to the main branch

## Common Issues and Solutions

### localStorage Issues

This error typically appears when:

1. The browser's localStorage is disabled
2. The browser is in private/incognito mode
3. The browser's storage quota is exceeded

**Solutions:**

- The application includes built-in error handling for localStorage operations
- Enhanced error messages provide clarity to users
- The ConnectionManager component shows storage availability status

### Missing Polyfills

When deploying, you might encounter errors related to missing Node.js modules in the browser environment:

**Solution:**

- The webpack configuration in `next.config.js` includes necessary polyfills
- Additional polyfills can be added as needed

## Additional Resources

- Use `npm run analyze` to identify bundle size issues
- Review `scripts/fix-duplicated-paths.js` if you encounter path-related deployment issues

---

If you encounter any other issues during deployment, please create an issue in the GitHub repository. 