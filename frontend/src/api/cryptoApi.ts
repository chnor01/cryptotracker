import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getCoin = async (coin_id: string) => {
    const response = await api.get(`coin/${coin_id}`)
    return response.data;
};

export const getAllCoins = async () => {
  const response = await api.get("/coins/all-coins");
  return response.data;
};

export const searchCoin = async (coin: string, limit=20) => {
  const response = await api.get(`/coins/search?coin=${encodeURIComponent(coin)}&limit=${limit}`);
  return response.data;
};

export const getTopMarket = async (limit = 20, offset=0, sortkey="usd_market_cap", sortorder="desc") => {
    const response = await api.get(`coins/top-market-cap?limit=${limit}&offset=${offset}&sortkey=${sortkey}&sortorder=${sortorder}`)
    return response.data;
};

export const getSummary = async () => {
    const response = await api.get("/coins/summary")
    return response.data;
};