import { useEffect, useState } from "react";
import { addPortfolio, getPortfolio, searchCoin } from "@/api/cryptoApi";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

interface Portfolio {
  id: number;
  coin_id: string;
  amount: number;
  created_at: string;
  current_price: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
}

const COLORS = [
  "#A2CFFE",
  "#A8E6CF",
  "#FFD3B6",
  "#FFAAA5",
  "#D9C6E6",
  "#FDFD96",
  "#B5EAD7",
  "#FFDAC1",
  "#E2F0CB",
  "#C7CEEA",
  "#FEC8D8",
  "#E0BBE4",
];

function Portfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [coinId, setCoinId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Coin[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const data = await getPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const response = await searchCoin(query, 50);
        setResults(response);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinId) {
      setMessage("Please select a coin.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setMessage("Please enter a valid number greater than 0.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await addPortfolio(coinId, parseFloat(amount));
      await fetchPortfolio();
      setMessage("Portfolio updated");
      setCoinId("");
      setAmount("");
      setQuery("");
      setResults([]);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Error updating portfolio");
    } finally {
      setLoading(false);
    }
  };

  const chartData = portfolio.map((coin) => ({
    name: coin.coin_id.toUpperCase(),
    value: coin.amount * coin.current_price,
  }));

  return (
    <div className="portfolio-wrapper">
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Legend
              height={100}
              align="center"
              iconSize={12}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="portfolio-table-wrapper">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Search coins"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-field"
            required
          />
          {results.length > 0 && isFocused && (
            <div className="portfoliosearch-container">
              <table className="crypto-table crypto-table--portfoliosearch">
                <tbody>
                  {results.map((coin) => (
                    <tr
                      key={coin.id}
                      onMouseDown={() => {
                        setCoinId(coin.id);
                        setQuery(coin.name);
                        setIsFocused(false);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ textAlign: "left" }}>
                        <img
                          src={`http://localhost:8000/icons/${coin.id}.png`}
                          alt={coin.symbol}
                          style={{
                            width: 26,
                            height: 26,
                            marginRight: 8,
                            verticalAlign: "middle",
                            borderRadius: "50%",
                          }}
                        />
                        {coin.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <input
            type="number"
            step="0.1"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-field"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="submit-register-button"
          >
            {loading ? "Adding..." : "Add to Portfolio"}
          </button>
        </form>

        <table className="crypto-table crypto-table--portfolio">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Coin</th>
              <th>Amount</th>
              <th>Price</th>
              <th>Price +/- 24h</th>
              <th> Total </th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((coin) => (
              <tr key={coin.id}>
                <td style={{ textAlign: "left" }}>
                  <img
                    src={`http://localhost:8000/icons/${coin.coin_id}.png`}
                    alt={coin.coin_id}
                    style={{
                      width: 26,
                      height: 26,
                      marginRight: 8,
                      verticalAlign: "middle",
                      borderRadius: "50%",
                    }}
                  />
                  {coin.coin_id}
                </td>
                <td>{coin.amount}</td>
                <td>${coin.current_price.toFixed(2)}</td>
                <td
                  style={{
                    color:
                      coin.price_change_percentage_24h < 0
                        ? "red"
                        : "lightgreen",
                    fontWeight: "bold",
                  }}
                >
                  {coin.price_change_percentage_24h.toFixed(2)}%
                </td>
                <td>${(coin.amount * coin.current_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Portfolio;
