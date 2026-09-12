import axios from "axios";
import { API_BASE_URL } from "../../config/env";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth token here when ready
apiClient.interceptors.request.use(
  (config) => {
    // TODO: attach token
    // const token = await AsyncStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: handle 401 unauthorized
    return Promise.reject(error);
  }
);

export default apiClient;
