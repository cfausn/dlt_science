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

  // Main initialization function
  window.initHederaDonationWidget = function(customConfig = {}) {
    // Merge configurations
    const config = { ...defaultConfig, ...customConfig };
    
    // Create container
    const containerId = createContainer(config);
    
    // Load React and ReactDOM if not already available
    if (!window.React) {
      loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
    }
    
    if (!window.ReactDOM) {
      loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
    }
    
    // Load our widget script
    loadScript('https://your-cdn-url/hedera-widget.umd.js', function() {
      if (window.hederaDonationWidget) {
        window.hederaDonationWidget(containerId, config);
      } else {
        console.error('Hedera Donation Widget failed to load');
      }
    });
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