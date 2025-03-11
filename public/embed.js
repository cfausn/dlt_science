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
    console.log('Loading script:', url);
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

  // Auto-detect base URL if using known CDN or GitHub Pages
  function getBaseUrl() {
    // Check if we're on GitHub Pages by examining the hostname
    if (window.location.hostname.includes('github.io')) {
      console.log('Detected GitHub Pages environment');
      return GITHUB_PAGES_URL;
    }
    
    // For local development or other environments
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    const currentScriptUrl = currentScript.src;
    
    const urlParts = currentScriptUrl.split('/');
    urlParts.pop(); // Remove the script filename
    const baseUrl = urlParts.join('/');
    
    console.log('Using base URL for local development:', baseUrl);
    return baseUrl;
  }

  // Main initialization function
  window.initHederaDonationWidget = function(customConfig = {}) {
    console.log('Initializing Hedera Donation Widget');
    
    // Merge configurations
    const config = { ...defaultConfig, ...customConfig };
    
    // Create container
    const containerId = createContainer(config);
    
    // Determine the base URL for resources
    const baseUrl = getBaseUrl();
    console.log('Base URL for resources:', baseUrl);
    
    // Load React and ReactDOM (in sequence to ensure proper loading order)
    const loadReactDom = function() {
      console.log('Loading ReactDOM...');
      loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', function() {
        console.log('ReactDOM loaded successfully');
        // Load the widget script after React and ReactDOM are loaded
        loadWidget();
      });
    };
    
    const loadReact = function() {
      console.log('Loading React...');
      loadScript('https://unpkg.com/react@18/umd/react.production.min.js', function() {
        console.log('React loaded successfully');
        if (!window.ReactDOM) {
          loadReactDom();
        } else {
          loadWidget();
        }
      });
    };
    
    // Function to load the widget script
    const loadWidget = function() {
      console.log('Loading widget script...');
      
      // Use the absolute URL for GitHub Pages, always with the /dlt_science/ path
      let widgetUrl;
      if (window.location.hostname.includes('github.io')) {
        widgetUrl = GITHUB_PAGES_URL + '/hedera-widget.umd.js';
        console.log('Using GitHub Pages URL for widget:', widgetUrl);
      } else {
        widgetUrl = baseUrl + '/hedera-widget.umd.js';
        console.log('Using local URL for widget:', widgetUrl);
      }
      
      const widgetScript = loadScript(widgetUrl);
      
      widgetScript.onerror = function() {
        handleScriptError(widgetUrl);
      };
      
      widgetScript.onload = function() {
        console.log('Widget script loaded successfully');
        if (window.HederaDonationWidget && window.HederaDonationWidget.initialize) {
          console.log('Initializing widget in container:', containerId);
          window.HederaDonationWidget.initialize({
            elementId: containerId,
            receiverId: config.receiverId,
            title: config.title,
            primaryColor: config.primaryColor,
            showFooter: config.showFooter,
            testnet: config.testnet,
            maxWidth: config.maxWidth
          });
        } else {
          console.error('Hedera Donation Widget failed to load correctly. Window.HederaDonationWidget:', window.HederaDonationWidget);
        }
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