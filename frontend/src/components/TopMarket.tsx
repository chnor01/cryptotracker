import { useEffect, useState } from "react";
import { getAllCoins } from "../api/cryptoApi";
import { useNavigate } from "react-router-dom";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
}

function TopMarket() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sortKey, setSortKey] = useState<keyof Coin | null>("market_cap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCoins, setTotalCoins] = useState(1000); // todo: fetch total num of coins from DB instead
  const totalPages = Math.ceil(totalCoins / itemsPerPage);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true);
      setError(null);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const response = await getAllCoins(
          itemsPerPage,
          offset,
          sortKey,
          sortOrder
        );
        setCoins(response);
      } catch (err) {
        console.error(err);
        setCoins([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCoins();
  }, [currentPage, sortKey, sortOrder]);

  const sortedCoins =
    sortKey && sortOrder
      ? [...coins].sort((a, b) => {
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
        })
      : coins;

  const handleSort = (key: keyof Coin) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("desc");
    } else {
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortKey(null);
        setSortOrder(null);
      } else {
        setSortOrder("desc");
      }
    }
  };
  const getSortSymbol = (key: keyof Coin) => {
    if (sortKey !== key || !sortOrder) return "";
    return sortOrder === "asc" ? "\u02C5" : "\u02C4";
  };

  return (
    <div className="top-market-app">
      {error && (
        <div
          className="loading-wrapper"
          style={{ width: "1200px", height: "850px" }}
        >
          {error}
        </div>
      )}
      {loading && (
        <div
          className="loading-wrapper"
          style={{ width: "1200px", height: "850px" }}
        >
          <span className="loader"></span>
        </div>
      )}
      {!loading && !error && coins.length > 0 && (
        <table className="crypto-table crypto-table--topmarket">
          <thead>
            <tr>
              <th
                onClick={() => handleSort("name")}
                style={{ textAlign: "left" }}
              >
                {getSortSymbol("name")} Coin
              </th>
              <th onClick={() => handleSort("current_price")}>
                {getSortSymbol("current_price")} Price
              </th>
              <th onClick={() => handleSort("price_change_percentage_24h")}>
                {getSortSymbol("price_change_percentage_24h")} 24H change
              </th>
              <th onClick={() => handleSort("market_cap")}>
                {getSortSymbol("market_cap")} Market cap
              </th>
              <th onClick={() => handleSort("circulating_supply")}>
                {getSortSymbol("circulating_supply")} Supply
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCoins.map((coin) => (
              <tr key={coin.id} onClick={() => navigate(`/coins/${coin.id}`)}>
                <td style={{ textAlign: "left" }}>
                  <img
                    src={`http://localhost:8000/icons/${coin.id}.png`}
                    alt={coin.symbol}
                    className="coin-icon"
                  />
                  {coin.symbol.toUpperCase()}, {coin.name}
                </td>
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
                <td>${coin.market_cap.toLocaleString()}</td>
                <td>
                  {coin.circulating_supply.toLocaleString()}{" "}
                  {coin.symbol.toUpperCase()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
