// API Configuration
// This file sets the API base URL for the frontend
// For local development, this will be empty (uses relative paths)
// For production, the API base URL is injected via meta tag during build

(function() {
  // Get API base URL from meta tag
  const metaTag = document.querySelector('meta[name="api-base-url"]');
  const apiBaseUrl = metaTag ? metaTag.getAttribute('content') : '';
  
  // Export to window for use in app.js
  window.API_CONFIG = {
    baseUrl: apiBaseUrl,
    // Helper function to get full API URL
    getApiUrl: function(path) {
      if (!apiBaseUrl) {
        // Local development - use relative paths
        return path;
      }
      // Production - prepend API base URL
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      return `${apiBaseUrl}/${cleanPath}`;
    }
  };
})();

