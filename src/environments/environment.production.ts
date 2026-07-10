// Production environment. nginx serves the frontend and proxies /api to the backend on the same
// origin, so the API base URL is empty (relative).
export const environment = {
  production: true,
  apiBaseUrl: '',
};
