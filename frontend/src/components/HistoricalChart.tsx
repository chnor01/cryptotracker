import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { getHistoricalPrices } from "../api/cryptoApi";

interface HistoricalData {
  id: string;
  timestamp: string;
  usd: number;
  usd_market_cap: number;
  volume: number;
}

interface HistoricalChartProps {
  coinId: string;
}

function HistoricalChart({ coinId }: HistoricalChartProps) {
  const [data, setData] = useState<HistoricalData[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const loadData = async () => {
      try {
        const rawData = await getHistoricalPrices(coinId, days);
        console.log("raw", rawData);
        const formatted: HistoricalData[] = rawData.map(
          (item: HistoricalData) => ({
            ...item,
            timestamp: new Date(item.timestamp).toLocaleDateString(),
          })
        );
        setData(formatted);
        console.log("form", formatted);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    loadData();
  }, [days]);

  return (
    <div className="chart-container">
      <h2>{coinId.toUpperCase()} Price (USD)</h2>
      <div className="chart-range-buttons">
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

      <ResponsiveContainer width="50%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="5 5" stroke="#eee" />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: "#ffffffd6", fontSize: 13 }}
          />
          <YAxis />
          <Line
            type="monotone"
            dataKey="usd"
            name="USD"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="USD"
            stroke="#8884d8"
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
    </div>
  );
}

export default HistoricalChart;
