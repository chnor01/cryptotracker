import { useEffect, useState } from "react";
import { addPortfolio, getPortfolio, searchCoin } from "@/api/cryptoApi";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PiechartLabel {
  name: string;
  percent: number;
}

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
      const sortedByValue = [...data].sort(
        (a, b) => b.amount * b.current_price - a.amount * a.current_price
      );
      setPortfolio(sortedByValue);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const totalValue = portfolio.reduce(
    (sum, coin) => sum + coin.amount * coin.current_price,
    0
  );
  const avgValueCoin = totalValue / portfolio.length;
  const sumPriceChange24h = portfolio.reduce(
    (sum, coin) => sum + (coin.amount * coin.price_change_24h || 0),
    0
  );
  const totalChangePercent =
    (sumPriceChange24h / (totalValue - sumPriceChange24h)) * 100;

  const bestPerforming = [...portfolio]
    .sort(
      (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
    )[0]
    .coin_id.toUpperCase();

  const worstPerforming = [...portfolio]
    .sort(
      (a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h
    )[0]
    .coin_id.toUpperCase();

  // format for piechart data
  const chartData = portfolio.map((coin) => ({
    name: coin.coin_id.toUpperCase(),
    value: coin.amount * coin.current_price,
  }));
  const threshold = 5; // threshold in % for "others" category

  // filter low value coins < threshold
  const lowValueCoins = chartData.filter(
    (coin) => (coin.value / totalValue) * 100 < threshold
  );
  // sum value of low value coins
  const sumLowValue = lowValueCoins.reduce((sum, coin) => sum + coin.value, 0);

  const highValueCoins = chartData.filter(
    (coin) => (coin.value / totalValue) * 100 > threshold
  );

  // groups sum value of low value coins into "others"
  const sortedData =
    lowValueCoins.length > 0
      ? [...highValueCoins, { name: "Others", value: sumLowValue }]
      : highValueCoins;

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

  return (
    <div>
      <div style={{ display: "flex" }}>
        <div className="portfolio-summary" style={{ flex: 1 }}>
          <div className="summary-card">
            <p className="label">Total Value</p>
            <p className="value">${totalValue.toLocaleString()}</p>
          </div>
          <div className="summary-card">
            <p className="label">24H Change</p>
            <p
              className="value"
              style={{
                color: sumPriceChange24h < 0 ? "red" : "green",
              }}
            >
              ${sumPriceChange24h.toLocaleString()} (
              {totalChangePercent.toFixed(2)}%)
            </p>
          </div>
          <div className="summary-card">
            <p className="label">Number of Holdings</p>
            <p className="value">{portfolio.length}</p>
          </div>
          {portfolio.length > 0 && (
            <div className="summary-card">
              <p className="label">Top Holding</p>
              <p className="value">{portfolio[0].coin_id.toUpperCase()}</p>
            </div>
          )}
          {portfolio.length > 0 && (
            <div className="summary-card">
              <p className="label">Smallest Holding</p>
              <p className="value">
                {portfolio[portfolio.length - 1].coin_id.toUpperCase()}
              </p>
            </div>
          )}
          <div className="summary-card">
            <p className="label">Average Coin Price</p>
            <p className="value">${avgValueCoin.toLocaleString()}</p>
          </div>
          <div className="summary-card">
            <p className="label">Best Performing</p>
            <p className="value">{bestPerforming}</p>
          </div>
          <div className="summary-card">
            <p className="label">Worst Performing</p>
            <p className="value">${worstPerforming}</p>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={sortedData}
                innerRadius={80}
                outerRadius={100}
                cx="50%"
                cy="50%"
                dataKey="value"
                stroke="#151515"
                label={({ name, percent }: PiechartLabel) => {
                  return `${name} ${(percent * 100).toFixed(1)}%`;
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "#3c4657ff",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffffd6",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="portfolio-table-wrapper">
        <form className="portfolio-form" onSubmit={handleSubmit}>
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
            style={{ height: "49px", marginTop: "0px" }}
          >
            {loading ? "Buying..." : "Buy"}
          </button>
        </form>

        <table className="crypto-table crypto-table--portfolio">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Coin</th>
              <th>Amount</th>
              <th>Price</th>
              <th>24H change</th>
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
                <td>${coin.current_price.toLocaleString()}</td>
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
                <td>${(coin.amount * coin.current_price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Portfolio;
