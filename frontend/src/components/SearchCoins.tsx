import { useState, useEffect } from "react";
import { searchCoin } from "../api/cryptoApi";
import { useNavigate } from "react-router-dom";

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

function SearchCoins() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Coin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setError(null);
      setLoading(true);
      try {
        const response = await searchCoin(query, 50);
        setResults(response);
      } catch (err) {
        setError("No coins found");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="search-coins-app">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search coins"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="results-container">
        {error && isFocused && (
          <div
            className="loading-wrapper"
            style={{ width: "422px", height: "300px" }}
          >
            {error}
          </div>
        )}
        {loading && isFocused && (
          <div
            className="loading-wrapper"
            style={{ width: "422px", height: "300px" }}
          >
            <span className="loader"></span>
          </div>
        )}
        {results.length > 0 && isFocused && (
          <table className="crypto-table crypto-table--searchcoins">
            <tbody>
              {results.map((coin) => (
                <tr
                  key={coin.id}
                  onMouseDown={() => navigate(`/coins/${coin.id}`)}
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
        )}
      </div>
    </div>
  );
}

export default SearchCoins;
