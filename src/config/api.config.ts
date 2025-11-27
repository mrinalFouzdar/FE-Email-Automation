export const API_CONFIG = {
  // Use VITE_API_BASE_URL if available, otherwise fallback to localhost
  // Note: VITE_API_BASE_URL should include the full path e.g. http://localhost:4000/api/v1
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  TIMEOUT: 30000,
} as const;

// Helper to get full API URL
export const getApiUrl = (endpoint: string): string => {
  let baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  
  // Ensure baseUrl ends with /api/v1
  if (!baseUrl.endsWith('/api/v1')) {
    baseUrl = `${baseUrl}/api/v1`;
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};
