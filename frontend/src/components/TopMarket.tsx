import { useEffect, useState } from "react";
import { getTopMarket } from "../api/cryptoApi";

interface Coin {
  id: string;
  usd: number;
  usd_market_cap: number;
  usd_24h_vol: number;
  usd_24h_change: number;
  last_updated_at: number;
}

function TopMarket() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const TopNum = 25;

  useEffect(() => {
    (async() => {
      try {
        const data = await getTopMarket(TopNum);
        setCoins(data);
        console.log(data)
      } catch (err) { console.error("error fetching coins", err)

      };

    })();
  }, []);

return (
  <div className="app-container">
    <h2>Top {TopNum} Coins by Market Cap</h2>
    <table className="crypto-table">
      <thead>
        <tr>
          <th>Name (ID)</th>
          <th>Market Cap ($)</th>
        </tr>
      </thead>
      <tbody>
        {coins.map((coin) => (
          <tr key={coin.id}>
            <td>{coin.id}</td>
            <td>{coin.usd_market_cap.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

}

export default TopMarket;
