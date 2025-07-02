// API configuration using environment variable
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  QUICKBOOKS: {
    AUTH: `${API_BASE_URL}/api/quickbooks/auth`,
    TRANSACTIONS: `${API_BASE_URL}/api/quickbooks/transactions`,
    EXPENSES: `${API_BASE_URL}/api/quickbooks/expenses`,
    INCOME: `${API_BASE_URL}/api/quickbooks/income`,
    EXPORT: `${API_BASE_URL}/api/quickbooks/export`,
    EXPORT_JSON: `${API_BASE_URL}/api/quickbooks/export?format=json`,
  },
  HEALTH: `${API_BASE_URL}/api/health`,
  CONTACT: `${API_BASE_URL}/api/contact`,
  EXPORT: `${API_BASE_URL}/api/export`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  CONTACT: `${API_BASE_URL}/api/contact`,
};

// Helper function to make API calls
export const apiCall = async (endpoint, options) => {
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


