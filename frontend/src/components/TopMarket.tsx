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
  const [sortKey, setSortKey] = useState<keyof Coin>("market_cap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [totalCoins, setTotalCoins] = useState(1000); // todo: fetch total num of coins from DB instead
  const totalPages = Math.ceil(totalCoins / itemsPerPage);

  const navigate = useNavigate();

  const fetchCoins = async (page: number) => {
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await getAllCoins(
        itemsPerPage,
        offset,
        sortKey,
        sortOrder
      );
      console.log(response);
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
      setSortOrder("desc");
    }
  };

  const sortSymbol = sortOrder === "asc" ? "\u02C5" : "\u02C4";

  return (
    <div className="top-market-app">
      <table className="crypto-table crypto-table--narrow">
        <thead>
          <tr>
            <th
              onClick={() => handleSort("name")}
              style={{ textAlign: "left" }}
            >
              {sortKey === "name" && sortSymbol} Coin
            </th>
            <th onClick={() => handleSort("current_price")}>
              {sortKey === "current_price" && sortSymbol} Price
            </th>
            <th onClick={() => handleSort("price_change_percentage_24h")}>
              {sortKey === "price_change_percentage_24h" && sortSymbol} 24H
              Price %
            </th>
            <th onClick={() => handleSort("market_cap")}>
              {sortKey === "market_cap" && sortSymbol} Market Cap
            </th>
            <th onClick={() => handleSort("circulating_supply")}>
              {sortKey === "circulating_supply" && sortSymbol} Circulating
              Supply
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedCoins.map((coin) => (
            <tr key={coin.id} onClick={() => navigate(`/coins/${coin.id}`)}>
              <td style={{ textAlign: "left" }}>
                <img
                  src={`http://localhost:8000/images/${coin.id}.png`}
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
              <td>${coin.current_price.toLocaleString()}</td>
              <td
                style={{
                  color:
                    coin.price_change_percentage_24h < 0 ? "red" : "lightgreen",
                  fontWeight: "bold",
                }}
              >
                {coin.price_change_percentage_24h.toFixed(2)}%
              </td>
              <td>${coin.market_cap.toLocaleString()}</td>
              <td>
                {coin.circulating_supply} {coin.symbol.toUpperCase()}
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
