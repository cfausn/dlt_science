# Deployment Guide

This document provides instructions on how to deploy the Hedera Donation Widget using GitHub Pages as a CDN.

## Deployment with GitHub Pages

The widget is configured to be automatically built and deployed to GitHub Pages whenever you push changes to the main branch.

### Setup GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select "GitHub Actions"
5. Push a change to your main branch to trigger the deployment

The GitHub Actions workflow will:
1. Build the widget
2. Generate the necessary distribution files
3. Deploy them to GitHub Pages
4. Update all URLs to point to your GitHub Pages domain

### Once Deployed

After successful deployment, your widget will be available at:
- `https://yourusername.github.io/repository-name/`

The following files will be available:
- `https://yourusername.github.io/repository-name/hedera-widget.umd.js` - The widget library
- `https://yourusername.github.io/repository-name/embed.js` - The embedding script
- `https://yourusername.github.io/repository-name/` - Demo page

## Using Your Deployed Widget

Once deployed, you can embed the widget in any website by adding:

```html
<!-- Widget container -->
<div id="hedera-donation-widget"></div>

<!-- Widget script -->
<script src="https://yourusername.github.io/repository-name/embed.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    initHederaDonationWidget({
      receiverId: '0.0.YOUR_HEDERA_ACCOUNT_ID', // Replace with your Hedera account ID
      title: 'Support Our Project'
    });
  });
</script>
```

## Troubleshooting

If your deployment fails:

1. Check GitHub Actions logs for specific error information
2. Ensure the repository has GitHub Pages enabled
3. Verify that the workflow has the proper permissions to deploy to GitHub Pages

For issues with the widget not loading:
1. Check browser console for error messages
2. Verify that all scripts are being loaded correctly
3. Ensure your Hedera account ID is valid

## Using a Custom Domain

To use a custom domain instead of GitHub Pages:

1. Go to repository Settings > Pages
2. Under "Custom domain", enter your domain name
3. Update your DNS records to point to GitHub Pages
4. Wait for DNS propagation

After setting up a custom domain, the widget will be available at:
- `https://yourdomain.com/hedera-widget.umd.js`
- `https://yourdomain.com/embed.js` 