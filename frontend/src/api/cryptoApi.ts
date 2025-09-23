import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const getCoin = async (coin_id: string) => {
  const response = await api.get(`/coin/${coin_id}`);
  return response.data;
};

export const searchCoin = async (coin: string, limit = 20) => {
  const response = await api.get("/coins/search", {
    params: { coin, limit },
  });
  return response.data;
};

export const getAllCoins = async (
  limit = 20,
  offset = 0,
  sort_key = "usd_market_cap",
  sort_order = "desc"
) => {
  const response = await api.get("/coins/all", {
    params: { limit, offset, sort_key, sort_order },
  });
  return response.data;
};

export const getSummary = async () => {
  const response = await api.get("/coins/summary");
  return response.data;
};

export const getHistoricalPrices = async (coin_id: string, days = 7) => {
  const response = await api.get(`/coins/${coin_id}/historical`, {
    params: { days },
  });
  return response.data;
};

export const UserRegister = async (username: string, email: string, password: string) => {
  const response = await api.post("/register", {
    username, email, password
  });
  return response.data;
};

export const UserLogin = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await api.post("/token", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const { access_token } = response.data;
  localStorage.setItem("token", access_token);
  return access_token;
}

export const getCurrentUser = async () => {
  const response = await api.get("/me");
  return response.data;
}
