import { useEffect, useState } from "react";
import { getTopMarket } from "../api/cryptoApi";

interface Coin {
  id: string;
  name: string;
  usd: number;
  usd_market_cap: number;
  usd_24h_vol: number;
  usd_24h_change: number;
  last_updated_at: number;
}

function TopMarket() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sortKey, setSortKey] = useState<keyof Coin>("usd_market_cap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
   
  const [totalCoins, setTotalCoins] = useState(1000); // todo: fetch total num of coins from DB instead
  const totalPages = Math.ceil(totalCoins / itemsPerPage);

  const fetchCoins = async (page: number) => {
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await getTopMarket(itemsPerPage, offset, sortKey, sortOrder);
      console.log(response)
      setCoins(response);
    } catch (err) {
      console.error(err);
      console.log("Failed to fetch coins.");
    }
  };

  useEffect(() => {
    fetchCoins(currentPage);
  }, [currentPage, sortKey, sortOrder]);


  const sortedCoins = [...coins].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return 0;
  });
  
  const handleSort = (key: keyof Coin) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortSymbol = sortOrder === "asc" ? "\u02C5" : "\u02C4";

  return (
    <div className="app-container">
      <h2>Coins Live Prices</h2>
      <table className="crypto-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>
              Coin {sortKey === "id" && sortSymbol}
            </th>
            <th onClick={() => handleSort("usd")}>
              Price {sortKey === "usd" && sortSymbol}
            </th>
            <th onClick={() => handleSort("usd_market_cap")}>
              Market Cap {sortKey === "usd_market_cap" && sortSymbol}
            </th>
            <th onClick={() => handleSort("usd_24h_vol")}>
              24H Volume {sortKey === "usd_24h_vol" && sortSymbol}
            </th>
            <th onClick={() => handleSort("usd_24h_change")}>
              24H Change {sortKey === "usd_24h_change" && sortSymbol}
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedCoins.map((coin) => (
            <tr key={coin.id}>
              <td>{coin.name}</td>
              <td>${coin.usd.toLocaleString()}</td>
              <td>{coin.usd_market_cap.toLocaleString()}</td>
              <td>{coin.usd_24h_vol.toLocaleString()}</td>
              <td
                style={{
                  color: coin.usd_24h_change < 0 ? "red" : "lightgreen",
                  fontWeight: "bold",
                }}
              >
                {coin.usd_24h_change.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TopMarket;
