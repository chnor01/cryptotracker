import { useState, useEffect } from "react";
import { searchCoin } from "../api/cryptoApi";

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

function SearchCoin() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Coin[]>([]);
  const [error, setError] = useState("");

    
  useEffect(() => {
  if (!query.trim()) {
    setResults([]);
    return;
  }
    const delay = setTimeout(async () => {
      setError("");

      try {
        const response = await searchCoin(query, 25);
        setResults(response);
        console.log(response)
      } catch (err) {
        setError("Coin not found or API error");
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
    }, [query]);


  return (
    <div className="app-container">
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter coin name, symbol, or ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="search-container">
      {results.length > 0 && (
        <table className="crypto-table">
          <tbody>
            {results.map((coin) => (
              <tr key={coin.id}>
                <td>{coin.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default SearchCoin;
