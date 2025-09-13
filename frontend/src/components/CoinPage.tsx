import { useParams } from "react-router-dom";
import HistoricalChart from "./HistoricalChart";
import SearchCoins from "./SearchCoins";
import StatsDisplay from "./StatsDisplay";

function CoinPage() {
  const { coinId } = useParams<{ coinId: string }>();

  if (!coinId) return <p>No coin selected</p>;

  return (
    <div>
      <SearchCoins />
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          {" "}
          <HistoricalChart coinId={coinId} />{" "}
        </div>
        <div style={{ flex: 1 }}>
          {" "}
          <StatsDisplay coinId={coinId} />{" "}
        </div>
      </div>
    </div>
  );
}

export default CoinPage;
