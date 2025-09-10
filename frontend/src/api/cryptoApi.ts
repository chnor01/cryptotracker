import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getCoin = async (coin_id: string) => {
  const response = await api.get(`/coin/${coin_id}`);
  return response.data;
};

export const getAllCoins = async () => {
  const response = await api.get("/coins/all-coins");
  return response.data;
};

export const searchCoin = async (coin: string, limit = 20) => {
  const response = await api.get("/coins/search", {
    params: { coin, limit },
  });
  return response.data;
};

export const getTopMarket = async (
  limit = 20,
  offset = 0,
  sort_key = "usd_market_cap",
  sort_order = "desc"
) => {
  const response = await api.get("/coins/top-market-cap", {
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
