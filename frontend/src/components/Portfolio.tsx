import { useEffect, useState } from "react";
import { addPortfolio, getPortfolio } from "@/api/cryptoApi";

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

function Portfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [coinId, setCoinId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setCoinId("");
    setAmount("");
    try {
      await addPortfolio(coinId, parseFloat(amount));
      await fetchPortfolio();
      setMessage("Portfolio updated");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Error updating portfolio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="portfolio-wrapper"
      style={{ position: "absolute", top: "50px" }}
    >
      <form onSubmit={handleSubmit} className="portfolio-form">
        <input
          type="text"
          placeholder="Coin ID"
          value={coinId}
          onChange={(e) => setCoinId(e.target.value)}
          className="form-field"
          required
        />
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
      {message && <p className="success-message">{message}</p>}
      <table>
        <thead>
          <tr>
            <th>Coin</th>
            <th>Amount</th>
            <th>Bought At</th>
            <th>Current Price</th>
            <th>Market Cap</th>
            <th>24h High</th>
            <th>24h Low</th>
            <th>Price Change 24h</th>
            <th>% Change 24h</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map((coin) => (
            <tr key={coin.id}>
              <td>{coin.coin_id}</td>
              <td>{coin.amount}</td>
              <td>{new Date(coin.created_at).toLocaleString()}</td>
              <td>${coin.current_price.toFixed(2)}</td>
              <td>${coin.market_cap.toLocaleString()}</td>
              <td>${coin.high_24h.toFixed(2)}</td>
              <td>${coin.low_24h.toFixed(2)}</td>
              <td>${coin.price_change_24h.toFixed(2)}</td>
              <td>{coin.price_change_percentage_24h.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Portfolio;
