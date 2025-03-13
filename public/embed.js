(function() {
  // ======= IMPORTANT: FIXED URL FOR GITHUB PAGES ========
  // DO NOT MODIFY THIS URL - IT MUST BE EXACT
  const GITHUB_PAGES_URL = 'https://cfausn.github.io/dlt_science';
  
  // Default configuration
  const defaultConfig = {
    containerId: 'hedera-donation-widget',
    receiverId: '0.0.5680094',
    title: 'Hedera Donation Widget',
    primaryColor: '#00a79d',
    showFooter: true,
    testnet: true,
    maxWidth: '500px'
  };

  // Create container if it doesn't exist
  function createContainer(config) {
    let container = document.getElementById(config.containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = config.containerId;
      document.body.appendChild(container);
    }
    
    return container.id;
  }

  // Load required scripts
  function loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    
    if (callback) {
      script.onload = callback;
    }
    
    script.onerror = () => {
      console.error('Failed to load script:', url);
    };
    
    document.head.appendChild(script);
    return script;
  }

  // Handle script loading errors
  function handleScriptError(scriptUrl) {
    console.error(`Failed to load widget script: ${scriptUrl}`);
    const containers = document.querySelectorAll('[data-hedera-widget], #hedera-donation-widget');
    containers.forEach(container => {
      container.innerHTML = `
        <div style="border: 1px solid #f44336; border-radius: 4px; padding: 16px; background-color: #ffebee; color: #d32f2f;">
          <p style="margin: 0; font-weight: bold;">Widget Loading Error</p>
          <p style="margin: 8px 0 0;">Could not load the Hedera donation widget. Please check your connection and try again.</p>
        </div>
      `;
    });
  }
  
  // Show a message when HashPack isn't installed
  function showHashPackInstallMessage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div style="border: 1px solid #f8d7da; border-radius: 4px; padding: 20px; background-color: #fff; color: #721c24; box-shadow: 0 2px 5px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
        <h3 style="margin: 0 0 15px; color: #721c24; font-size: 18px;">HashPack Wallet Required</h3>
        <p style="margin: 0 0 12px; font-size: 14px;">This donation widget requires the HashPack wallet extension to be installed.</p>
        <p style="margin: 0 0 5px; font-size: 14px;">Please:</p>
        <ol style="margin: 0 0 15px; padding-left: 20px; font-size: 14px;">
          <li>Install the HashPack wallet extension</li>
          <li>Create or import a Hedera account</li>
          <li>Refresh this page</li>
        </ol>
        <a href="https://www.hashpack.app/download" target="_blank" style="display: inline-block; background-color: #8257e5; color: white; font-weight: bold; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">Install HashPack Wallet</a>
      </div>
    `;
  }

  // Helper function to determine if we're running locally
  function isLocalEnvironment() {
    return window.location.hostname === 'localhost' || 
           /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname);
  }

  // Check if the current script was loaded from GitHub Pages
  function isLoadedFromGitHubPages() {
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    return currentScript && currentScript.src && currentScript.src.includes('github.io');
  }

  // Auto-detect base URL if using known CDN or GitHub Pages
  function getBaseUrl() {
    // If we're running locally, use the current origin
    if (isLocalEnvironment()) {
      console.log("Using local origin for resources:", window.location.origin);
      return window.location.origin;
    }
    
    // If script was loaded from GitHub Pages, use the GitHub Pages URL
    if (isLoadedFromGitHubPages()) {
      console.log("Using GitHub Pages URL for resources:", GITHUB_PAGES_URL);
      return GITHUB_PAGES_URL;
    }
    
    // For other environments
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    const currentScriptUrl = currentScript.src;
    
    const urlParts = currentScriptUrl.split('/');
    urlParts.pop(); // Remove the script filename
    return urlParts.join('/');
  }
  
  // IMPORTANT: This detection is NOT RELIABLE, so we disable it by default
  // We'll let the widget's internal error handling take care of installation issues
  function detectHashPackExtension() {
    // We're assuming HashPack is installed by default since detection is unreliable
    // The widget will show appropriate errors if it's not actually present
    return Promise.resolve(true);
  }

  // Main initialization function
  window.initHederaDonationWidget = async function(customConfig = {}) {
    // Merge configurations
    const config = { ...defaultConfig, ...customConfig };
    
    // Create container
    const containerId = createContainer(config);
    
    // NOTE: We're skipping HashPack detection because it was causing false negatives
    // Let the widget's own error handling handle missing extension issues
    
    // Determine the base URL for resources
    const baseUrl = getBaseUrl();
    
    // Load React and ReactDOM (in sequence to ensure proper loading order)
    const loadReactDom = function() {
      loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', function() {
        // Load the widget script after React and ReactDOM are loaded
        loadWidget();
      });
    };
    
    const loadReact = function() {
      loadScript('https://unpkg.com/react@18/umd/react.production.min.js', function() {
        if (!window.ReactDOM) {
          loadReactDom();
        } else {
          loadWidget();
        }
      });
    };
    
    // Function to load the widget script
    const loadWidget = function() {
      // Use the appropriate URL for the UMD file based on environment
      let widgetUrl;
      
      if (isLocalEnvironment()) {
        // For local development, use local origin
        widgetUrl = baseUrl + '/hedera-widget.umd.js';
        console.log("Loading UMD from local environment:", widgetUrl);
      } else {
        // For production/GitHub Pages, use the GitHub Pages URL
        widgetUrl = GITHUB_PAGES_URL + '/hedera-widget.umd.js';
        console.log("Loading UMD from GitHub Pages:", widgetUrl);
      }
      
      const widgetScript = loadScript(widgetUrl);
      
      widgetScript.onerror = function() {
        handleScriptError(widgetUrl);
      };
      
      widgetScript.onload = function() {
        // Try to directly access the function
        const createFn = window.HederaDonationWidget.createHederaDonationWidget;
        
        if (createFn && typeof createFn === 'function') {
          try {
            createFn(containerId, {
              receiverId: config.receiverId,
              title: config.title,
              primaryColor: config.primaryColor,
              showFooter: config.showFooter,
              testnet: config.testnet,
              maxWidth: config.maxWidth
            });
            return;
          } catch (error) {
            console.error('Error initializing widget:', error);
          }
        }
        
        // Try to access the function directly from the window object
        if (window.createHederaDonationWidget && typeof window.createHederaDonationWidget === 'function') {
          try {
            window.createHederaDonationWidget(containerId, {
              receiverId: config.receiverId,
              title: config.title,
              primaryColor: config.primaryColor,
              showFooter: config.showFooter,
              testnet: config.testnet,
              maxWidth: config.maxWidth
            });
            return;
          } catch (error) {
            console.error('Error initializing widget with global function:', error);
          }
        }
        
        // As a last resort, try to use the default export
        if (typeof window.HederaDonationWidget === 'function') {
          try {
            window.HederaDonationWidget(containerId, {
              receiverId: config.receiverId,
              title: config.title,
              primaryColor: config.primaryColor,
              showFooter: config.showFooter,
              testnet: config.testnet,
              maxWidth: config.maxWidth
            });
            return;
          } catch (error) {
            console.error('Error initializing widget with default export:', error);
          }
        }
        
        console.error('Failed to initialize widget. Please check browser console for errors.');
      };
    };
    
    // Start the loading sequence
    if (!window.React) {
      loadReact();
    } else if (!window.ReactDOM) {
      loadReactDom();
    } else {
      loadWidget();
    }
    
    // Process data attributes if present
    function initializeFromAttributes(elementId) {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      // Extract data attributes
      if (element.dataset.title) {
        config.title = element.dataset.title;
      }
      
      if (element.dataset.primaryColor) {
        config.primaryColor = element.dataset.primaryColor;
      }
      
      if (element.dataset.showFooter !== undefined) {
        config.showFooter = element.dataset.showFooter === 'true';
      }
      
      if (element.dataset.testnet !== undefined) {
        config.testnet = element.dataset.testnet === 'true';
      }
      
      if (element.dataset.maxWidth) {
        config.maxWidth = element.dataset.maxWidth;
      }
      
      if (element.dataset.receiverId) {
        config.receiverId = element.dataset.receiverId;
      }
    }
    
    initializeFromAttributes(config.containerId);
  };
  
  // Auto-initialize elements with data-hedera-widget attribute
  document.addEventListener('DOMContentLoaded', function() {
    const widgetElements = document.querySelectorAll('[data-hedera-widget]');
    
    widgetElements.forEach(function(element) {
      if (element.id) {
        window.initHederaDonationWidget({
          containerId: element.id
        });
      }
    });
  });
})(); 