export const getApiUrl = (endpoint: string = ''): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  let baseUrl = envUrl ? envUrl.trim() : 'http://localhost:5000/api/v1';
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  if (!baseUrl.includes('/api/v1')) {
    baseUrl = `${baseUrl}/api/v1`;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};
