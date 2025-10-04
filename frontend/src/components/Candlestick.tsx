import { useEffect, useState, useRef } from "react";
// @ts-ignore
import CanvasJSReact from "@canvasjs/react-charts";
import { getOHLC } from "@/api/cryptoApi";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

interface OHLCDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickProps {
  coinId: string;
}

function Candlestick({ coinId = "bitcoin" }: CandlestickProps) {
  const chartRef = useRef<any>(null);
  const [days, setDays] = useState(14);
  const [dataPoints, setDataPoints] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const ohlcData: OHLCDataPoint[] = await getOHLC(coinId, days);

      const canvasData = ohlcData.map((point) => ({
        x: new Date(point.timestamp),
        y: [point.open, point.high, point.low, point.close],
      }));

      setDataPoints(canvasData);
    };

    fetchData();
  }, []);

  const options = {
    animationEnabled: true,
    theme: "dark1",
    backgroundColor: "#151515",
    axisX: {
      valueFormatString: "DD MMM hh:mm",
    },
    axisY: {
      prefix: "$",
    },
    data: [
      {
        type: "candlestick",
        color: null,
        border: 0,
        risingColor: "#26a69a",
        fallingColor: "#ef5350",
        dataPoints: dataPoints.map((point) => {
          const isRising = point.y[3] >= point.y[0]; // close >= open
          return {
            ...point,
            color: isRising ? "#26a69a" : "#ef5350",
          };
        }),
      },
    ],
  };

  return (
    <CanvasJSChart
      options={options}
      onRef={(ref) => (chartRef.current = ref)}
    />
  );
}

export default Candlestick;
