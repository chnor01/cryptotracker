import { useParams } from "react-router-dom";
import HistoricalChart from "./HistoricalChart";




function CoinPage() {
  const { coinId } = useParams<{ coinId: string }>();

  if (!coinId) return <p>No coin selected</p>;

  return <HistoricalChart coinId={coinId} />;
}

export default CoinPage;
