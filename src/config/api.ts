// API configuration for different environments
const getApiBaseUrl = (): string => {
  // In production, use relative URLs (same domain)
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  
  // In development, check if we have a custom API URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default: use relative URLs (proxy will handle forwarding)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  QUICKBOOKS: {
    AUTH: `${API_BASE_URL}/api/quickbooks/auth`,
    TRANSACTIONS: `${API_BASE_URL}/api/quickbooks/transactions`,
    EXPENSES: `${API_BASE_URL}/api/quickbooks/expenses`,
    INCOME: `${API_BASE_URL}/api/quickbooks/income`,
  },
  HEALTH: `${API_BASE_URL}/api/health`,
  CONTACT: `${API_BASE_URL}/api/contact`,
  EXPORT: `${API_BASE_URL}/api/export`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
};

// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response;
};
// API configuration for different environments
const getApiBaseUrl = (): string => {
  // In production, use relative URLs (same domain)
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  
  // In development, check if we have a custom API URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default: use relative URLs (proxy will handle forwarding)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  QUICKBOOKS: {
    AUTH: `${API_BASE_URL}/api/quickbooks/auth`,
    TRANSACTIONS: `${API_BASE_URL}/api/quickbooks/transactions`,
    EXPENSES: `${API_BASE_URL}/api/quickbooks/expenses`,
    INCOME: `${API_BASE_URL}/api/quickbooks/income`,
  },
  HEALTH: `${API_BASE_URL}/api/health`,
  CONTACT: `${API_BASE_URL}/api/contact`,
  EXPORT: `${API_BASE_URL}/api/export`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
};

// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response;
};
