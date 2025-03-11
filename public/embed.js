(function() {
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
    
    document.head.appendChild(script);
  }

  // Handle script loading errors
  function handleScriptError(scriptUrl) {
    console.error(`Failed to load script: ${scriptUrl}`);
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
    // For GitHub Pages deployment
    const CDN_BASE_URL = 'https://cfausn.github.io/dlt_science';
    
    // Get the current script URL
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    const currentScriptUrl = currentScript.src;
    
    // If script is loaded from GitHub Pages, use that as the base URL
    if (currentScriptUrl.includes('github.io/dlt_science')) {
      return CDN_BASE_URL;
    }
    
    // Otherwise extract the base URL (directory path)
    const urlParts = currentScriptUrl.split('/');
    urlParts.pop(); // Remove the script filename
    return urlParts.join('/');
  }

  // Main initialization function
  window.initHederaDonationWidget = function(customConfig = {}) {
    // Merge configurations
    const config = { ...defaultConfig, ...customConfig };
    
    // Create container
    const containerId = createContainer(config);
    
    // Determine the base URL for resources
    const baseUrl = getBaseUrl();
    
    // Load React and ReactDOM if not already available
    if (!window.React) {
      loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
    }
    
    if (!window.ReactDOM) {
      loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
    }
    
    // Load our widget script
    const widgetScript = document.createElement('script');
    widgetScript.src = `${baseUrl}/hedera-widget.umd.js`;
    widgetScript.async = true;
    widgetScript.onerror = () => handleScriptError(widgetScript.src);
    
    widgetScript.onload = function() {
      if (window.hederaDonationWidget) {
        window.hederaDonationWidget(containerId, config);
      } else {
        console.error('Hedera Donation Widget failed to load');
        handleScriptError(widgetScript.src);
      }
    };
    
    document.head.appendChild(widgetScript);
  };

  // Auto initialize if data attribute is present
  document.addEventListener('DOMContentLoaded', function() {
    const autoInitElements = document.querySelectorAll('[data-hedera-widget]');
    
    autoInitElements.forEach(element => {
      const config = {};
      
      // Parse data attributes
      Object.keys(defaultConfig).forEach(key => {
        const dataAttr = element.getAttribute(`data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
        
        if (dataAttr !== null) {
          // Convert string values to appropriate types
          if (dataAttr === 'true' || dataAttr === 'false') {
            config[key] = dataAttr === 'true';
          } else if (!isNaN(dataAttr) && dataAttr !== '') {
            config[key] = Number(dataAttr);
          } else {
            config[key] = dataAttr;
          }
        }
      });
      
      // Use element's ID as container
      config.containerId = element.id;
      
      // Initialize widget
      window.initHederaDonationWidget(config);
    });
  });
})(); 