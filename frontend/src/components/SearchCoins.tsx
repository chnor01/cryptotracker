import { useState, useEffect } from "react";
import { searchCoin } from "../api/cryptoApi";
import { useNavigate } from "react-router-dom";

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

function SearchCoin() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Coin[]>([]);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setError("");

      try {
        const response = await searchCoin(query, 50);
        setResults(response);
        console.log(response);
      } catch (err) {
        setError("No results");
        setResults([]);
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
        {results.length > 0 && isFocused && (
          <table className="crypto-table crypto-table--wide">
            <tbody>
              {results.map((coin) => (
                <tr
                  key={coin.id}
                  onMouseDown={() => navigate(`/coins/${coin.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{coin.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SearchCoin;
