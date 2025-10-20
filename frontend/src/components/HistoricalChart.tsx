import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getHistoricalPrices, getCoin } from "../api/cryptoApi";

interface HistoricalData {
  id: string;
  timestamp: string;
  usd: number;
  usd_market_cap: number;
  volume: number;
}

interface Coin {
  id: string;
  symbol: string;
  current_price: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
}

interface HistoricalChartProps {
  coinId: string;
}

function HistoricalChart({ coinId }: HistoricalChartProps) {
  const [data, setData] = useState<HistoricalData[]>([]);
  const [livePrices, setLivePrices] = useState<Coin | null>(null);
  const [days, setDays] = useState(30);
  const [coinMetric, setCoinMetric] = useState<
    "usd" | "volume" | "usd_market_cap"
  >("usd");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [liveData, rawData] = await Promise.all([
          getCoin(coinId).catch(() => {
            setError("Failed to fetch data");
            return null;
          }),
          getHistoricalPrices(coinId, days).catch(() => {
            setError("Failed to fetch data");
            return [];
          }),
        ]);

        const formatted: HistoricalData[] = Array.isArray(rawData)
          ? rawData.map((item: HistoricalData) => ({
              ...item,
              timestamp: new Date(item.timestamp).toLocaleDateString(),
            }))
          : [];

        if (formatted.length) setData(formatted);
        if (liveData) setLivePrices(liveData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days, coinId]);

  return (
    <div className="historical-container">
      <h2 className="historical-header">
        {livePrices ? (
          <>
            <span className="rank-badge">#{livePrices.market_cap_rank}</span>
            <span
              style={{ letterSpacing: "2px", fontWeight: 200, fontSize: 22 }}
            >
              <img
                src={`http://localhost:8000/icons/${coinId}.png`}
                alt={livePrices.symbol}
                className="coin-icon"
              />
              {(livePrices.symbol + " " + coinId).toUpperCase()}{" "}
            </span>
            <span style={{ fontWeight: "bold", fontSize: 26 }}>
              ${livePrices.current_price.toLocaleString()}
            </span>{" "}
            <span
              style={{
                color:
                  livePrices.price_change_percentage_24h < 0
                    ? "red"
                    : "lightgreen",
                fontWeight: "bold",
                fontSize: 26,
              }}
            >
              {livePrices.price_change_percentage_24h}%
            </span>
          </>
        ) : (
          "Loading... "
        )}
      </h2>
      <div className="chart-glass">
        <div className="historical-chart-buttons">
          <div className="chart-days-buttons">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={days === d ? "active" : ""}
              >
                {d === 365 ? "1y" : `${d}d`}
              </button>
            ))}
          </div>
          <h3>Historial Data</h3>
          <div className="chart-metrics-buttons">
            <button
              onClick={() => setCoinMetric("usd")}
              className={coinMetric === "usd" ? "active" : ""}
            >
              Price
            </button>
            <button
              onClick={() => setCoinMetric("volume")}
              className={coinMetric === "volume" ? "active" : ""}
            >
              Volume
            </button>
            <button
              onClick={() => setCoinMetric("usd_market_cap")}
              className={coinMetric === "usd_market_cap" ? "active" : ""}
            >
              Market Cap
            </button>
          </div>
        </div>
        <div>
          {error && (
            <div
              className="loading-wrapper"
              style={{ width: "800px", height: "350px" }}
            >
              {error}
            </div>
          )}
          {loading && (
            <div
              className="loading-wrapper"
              style={{ width: "800px", height: "350px" }}
            >
              <span className="loader"></span>
            </div>
          )}
          {!loading && !error && data.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data}>
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: "#ffffffd6", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1_000_000_000_000)
                      return `$${value / 1_000_000_000_000}T`;
                    else if (value >= 1_000_000_000)
                      return `$${value / 1_000_000_000}B`;
                    else if (value >= 1_000_000)
                      return `$${value / 1_000_000}M`;
                    else if (value >= 1_000) return `$${value / 1_000}K`;
                    return value.toFixed(2);
                  }}
                  tick={{ fill: "#ffffffd6", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Area
                  type="monotone"
                  dataKey={coinMetric}
                  name={coinMetric}
                  stroke="#59b2e5ff"
                  fill="rgba(89, 178, 229, 0.54)"
                  strokeWidth={2}
                  dot={false}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const labelMap = {
                      usd: "USD",
                      usd_market_cap: "Market cap",
                      volume: "Volume",
                    };
                    const formattedMetric = labelMap[name];
                    const formattedNum = value.toLocaleString();
                    return [formattedNum, formattedMetric];
                  }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#ffffffd6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoricalChart;
