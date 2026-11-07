// Simple utility to handle API errors, especially 401 (unauthorized)
export const handleApiError = (error) => {
  // Check if it's a 401 error (token expired or invalid)
  if (error.response && error.response.status === 401) {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login';
  }
  
  // Return the error message for other errors
  return error.response?.data?.message || error.message || 'An error occurred';
};
