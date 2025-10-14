import { useEffect, useState } from "react";
import { getCoin } from "@/api/cryptoApi";

interface CoinStatsProps {
  coinId: string;
}

interface Coin {
  market_cap: number;
  market_cap_change_percentage_24h: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  ath: number;
  ath_date: string;
  low_24h: number;
  atl: number;
  atl_date: string;
  circulating_supply: number;
  max_supply: number | null;
  total_supply: number | null;
}

const formatNumber = (num: number | null) => {
  if (num === null) return "—";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
};

function StatsDisplay({ coinId }: CoinStatsProps) {
  const [coinData, setCoinData] = useState<Coin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoinData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getCoin(coinId);
        setCoinData(response);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchCoinData();
  }, [coinId]);

  return (
    <div>
      {error && (
        <div
          className="loading-wrapper"
          style={{ width: "1900px", height: "200px" }}
        >
          {error}
        </div>
      )}
      {loading && (
        <div
          className="loading-wrapper"
          style={{ width: "1900px", height: "200px" }}
        >
          <span className="loader"></span>
        </div>
      )}
      {!loading && !error && coinData && (
        <div className="coin-stats-grid">
          <div className="stat-card">
            <p className="label">Market Cap</p>
            <p className="value">${formatNumber(coinData.market_cap)}</p>
          </div>
          <div className="stat-card">
            <p className="label">Market Cap 24H %</p>
            <p
              className="value"
              style={{
                color:
                  coinData.market_cap_change_percentage_24h < 0
                    ? "#ff7675"
                    : "lightgreen",
              }}
            >
              {coinData.market_cap_change_percentage_24h}%
            </p>
          </div>

          <div className="stat-card">
            <p className="label">Total Volume</p>
            <p className="value">${formatNumber(coinData.total_volume)}</p>
          </div>

          <div className="stat-card">
            <p className="label">FDV</p>
            <p className="value">
              ${formatNumber(coinData.fully_diluted_valuation)}
            </p>
          </div>
          <div className="stat-card">
            <p className="label">24H High</p>
            <p className="value">${formatNumber(coinData.high_24h)}</p>
          </div>
          <div className="stat-card">
            <p className="label">24H Low</p>
            <p className="value">${formatNumber(coinData.low_24h)}</p>
          </div>
          <div className="stat-card">
            <p className="label">ATH</p>
            <p className="value">${formatNumber(coinData.ath)}</p>
            <p className="date">
              {new Date(coinData.ath_date).toLocaleDateString()}
            </p>
          </div>

          <div className="stat-card">
            <p className="label">ATL</p>
            <p className="value">${formatNumber(coinData.atl)}</p>
            <p className="date">
              {new Date(coinData.atl_date).toLocaleDateString()}
            </p>
          </div>

          <div className="stat-card">
            <p className="label">Circulating Supply</p>
            <p className="value">{formatNumber(coinData.circulating_supply)}</p>
          </div>

          <div className="stat-card">
            <p className="label">Total Supply</p>
            <p className="value">{formatNumber(coinData.total_supply)}</p>
          </div>

          <div className="stat-card">
            <p className="label">Max Supply</p>
            <p className="value">{formatNumber(coinData.max_supply)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsDisplay;
