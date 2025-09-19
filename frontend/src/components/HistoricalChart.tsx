import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [liveData, rawData] = await Promise.all([
          getCoin(coinId),
          getHistoricalPrices(coinId, days),
        ]);
        console.log(rawData);
        const formatted: HistoricalData[] = rawData.map(
          (item: HistoricalData) => ({
            ...item,
            timestamp: new Date(item.timestamp).toLocaleDateString(),
          })
        );
        setData(formatted);
        setLivePrices(liveData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    loadData();
  }, [days]);

  return (
    <div className="chart-container">
      <h2>
        {livePrices && (
          <>
            <span className="rank-badge">#{livePrices.market_cap_rank}</span>
            <span
              style={{ letterSpacing: "2px", fontWeight: 200, fontSize: 22 }}
            >
              <img
                src={`http://localhost:8000/images/${coinId}.png`}
                alt={livePrices.symbol}
                style={{
                  width: 32,
                  height: 32,
                  marginRight: 8,
                  verticalAlign: "middle",
                  borderRadius: "50%",
                }}
              />
              {(coinId + " " + livePrices.symbol).toUpperCase()}{" "}
            </span>
            <span style={{ fontWeight: "bold", fontSize: 26 }}>
              ${livePrices.current_price}
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
        )}
      </h2>

      <div className="chart-days-buttons">
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={days === d ? "active" : ""}
          >
            {d === 365 ? "1Y" : `${d}D`}
          </button>
        ))}
      </div>
      <div className="chart-metrics-buttons">
        <button
          onClick={() => setCoinMetric("usd")}
          className={coinMetric === "usd" ? "active" : ""}
        >
          USD
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

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="5 5" stroke="#eee" />
            <XAxis
              dataKey="timestamp"
              tick={{ fill: "#ffffffd6", fontSize: 13 }}
            />
            <YAxis />
            <Line
              type="monotone"
              dataKey={coinMetric}
              name={coinMetric}
              stroke="#59b2e5ff"
              strokeWidth={2}
              dot={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="loading-chart">Loading chart...</div>
      )}
    </div>
  );
}

export default HistoricalChart;
