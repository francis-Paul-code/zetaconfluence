import axios from 'axios';

export const coinGeckoAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_COINGECKO_API_BASE_URL,
});

export const moralisAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_MORALIS_BASE_URL,
});

export const backendAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
});

backendAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.params) config.params = {};
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

moralisAxiosInstance.interceptors.request.use(
  (config) => {
    const key = import.meta.env.VITE_MORALIS_API_KEY;

    if (key) {
      if (!config.params) config.params = {};
      config.headers['X-API-Key'] = key;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

coinGeckoAxiosInstance.interceptors.request.use(
  (config) => {
    const key = import.meta.env.VITE_COINGECKO_API_KEY;

    if (key) {
      if (!config.params) config.params = {};
      config.params['x-cg-demo-api-key'] = key;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
