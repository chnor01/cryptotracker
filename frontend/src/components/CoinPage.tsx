import { useParams } from "react-router-dom";
import HistoricalChart from "./HistoricalChart";
import SearchCoins from "./SearchCoins";
import StatsDisplay from "./StatsDisplay";
import Candlestick from "./Candlestick";

function CoinPage() {
  const { coinId } = useParams<{ coinId: string }>();

  if (!coinId) return <p>No coin selected</p>;

  return (
    <div>
      <SearchCoins />
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ flex: 2, display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <HistoricalChart coinId={coinId} />
          </div>
          <div style={{ flex: 1, marginTop: "140px", marginRight: "30px" }}>
            <Candlestick coinId={coinId} />
          </div>
        </div>
      </div>
      <div>
        <StatsDisplay coinId={coinId} />
      </div>
    </div>
  );
}

export default CoinPage;
