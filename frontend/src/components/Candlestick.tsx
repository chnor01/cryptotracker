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

function Candlestick({ coinId }: CandlestickProps) {
  const chartRef = useRef<any>(null);
  const [days, setDays] = useState(30);
  const [dataPoints, setDataPoints] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const ohlcData: OHLCDataPoint[] = await getOHLC(coinId, days);
        const canvasData = ohlcData.map((point) => ({
          x: new Date(point.timestamp),
          y: [point.open, point.high, point.low, point.close],
        }));
        setDataPoints(canvasData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
        setDataPoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days, coinId]);

  const options = {
    animationEnabled: true,
    zoomEnabled: true,
    theme: "dark1",
    backgroundColor: "#151515",
    toolTip: {
      contentFormatter: function (e) {
        const point = e.entries[0].dataPoint;
        const [open, high, low, close] = point.y;
        const time = new Date(point.x).toLocaleTimeString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        });
        return `
        <strong>${time}</strong><br/>
        Open: $${open.toLocaleString()}<br/>
        High: $${high.toLocaleString()}<br/>
        Low: $${low.toLocaleString()}<br/>
        Close: $${close.toLocaleString()}
    `;
      },
    },

    axisX: {
      labelFontColor: "#ffffffd6",
      valueFormatString: "DD MMM",
      gridThickness: 0,
      lineThickness: 0,
      tickLength: 0,
    },
    axisY2: {
      labelFontColor: "#ffffffd6",
      prefix: "$",
      gridThickness: 0,
      lineThickness: 0,
      tickLength: 0,
      labelFormatter: function (e) {
        if (e.value >= 1_000_000_000_000) {
          return `${e.value / 1_000_000_000_000}T`;
        } else if (e.value >= 1_000_000_000) {
          return `${e.value / 1_000_000_000}B`;
        } else if (e.value >= 1_000_000) {
          return `${e.value / 1_000_000}M`;
        } else if (e.value >= 1_000) {
          return `${e.value / 1_000}K`;
        } else {
          return e.value.toFixed(2);
        }
      },
    },
    data: [
      {
        type: "candlestick",
        axisYType: "secondary",
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
    <div className="candlestick-container">
      <div className="candlestick-btns">
        {[1, 7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={days === d ? "active" : ""}
          >
            {`${d}D`}
          </button>
        ))}
      </div>
      <div>
        {error && (
          <div
            className="loading-wrapper"
            style={{ width: "800px", height: "350px" }}
          >
            {error}
          </div>
        )}
        {loading && (
          <div
            className="loading-wrapper"
            style={{ width: "800px", height: "350px" }}
          >
            <span className="loader"></span>
          </div>
        )}
        {!loading && !error && dataPoints.length > 0 && (
          <CanvasJSChart
            options={options}
            onRef={(ref) => (chartRef.current = ref)}
          />
        )}
      </div>
    </div>
  );
}

export default Candlestick;
