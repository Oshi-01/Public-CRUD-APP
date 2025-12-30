// API Configuration
// This file sets the API base URL for the frontend
// For local development, this will be empty (uses relative paths)
// For production, the API base URL is injected via meta tag during build

(function() {
  // Get API base URL from meta tag
  const metaTag = document.querySelector('meta[name="api-base-url"]');
  let apiBaseUrl = metaTag ? metaTag.getAttribute('content') : '';
  
  // If the placeholder wasn't replaced (build script not run), treat as empty for local dev
  if (apiBaseUrl && (apiBaseUrl.includes('%') || apiBaseUrl.includes('API_BASE_URL') || apiBaseUrl.includes('VITE_API_BASE_URL'))) {
    apiBaseUrl = '';
  }
  
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

