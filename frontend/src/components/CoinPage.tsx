import { useParams } from "react-router-dom";
import HistoricalChart from "./HistoricalChart";
import SearchCoins from "./SearchCoins";
import StatsDisplay from "./StatsDisplay";
import Candlestick from "./Candlestick";

function CoinPage() {
  const { coinId } = useParams<{ coinId: string }>();

  return (
    <div>
      <SearchCoins />
      <div style={{ display: "flex", minHeight: "541px" }}>
        <div style={{ flex: 1 }}>
          <HistoricalChart coinId={coinId} />
        </div>
        <div style={{ flex: 1, paddingTop: "140px", paddingRight: "60px" }}>
          <Candlestick coinId={coinId} />
        </div>
      </div>

      <div>
        <StatsDisplay coinId={coinId} />
      </div>
    </div>
  );
}

export default CoinPage;
