import { describe, it, beforeEach, vi, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HistoricalChart from "./HistoricalChart";
import type { Mock } from "vitest";

import * as api from "../api/cryptoApi";
vi.mock("../api/cryptoApi", () => ({
  getCoin: vi.fn(),
  getHistoricalPrices: vi.fn(),
}));

describe("HistoricalChart component", () => {
  const mockCoin = {
    id: "bitcoin",
    symbol: "btc",
    current_price: 50000,
    market_cap_rank: 1,
    price_change_percentage_24h: 2.5,
  };

  const mockHistoricalData = [
    {
      id: "bitcoin",
      timestamp: "2024-09-14 00:00:00",
      usd: 48000,
      usd_market_cap: 900000000000,
      volume: 30000000,
    },
    {
      id: "bitcoin",
      timestamp: "2024-09-15 00:00:00",
      usd: 49000,
      usd_market_cap: 910000000000,
      volume: 35000000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getCoin as Mock).mockResolvedValue(mockCoin);
    (api.getHistoricalPrices as Mock).mockResolvedValue(mockHistoricalData);
  });

  it("fetches and displays live coin data and header info", async () => {
    render(<HistoricalChart coinId="bitcoin" />);

    await waitFor(() => expect(api.getCoin).toHaveBeenCalledWith("bitcoin"));
    await waitFor(() =>
      expect(api.getHistoricalPrices).toHaveBeenCalledWith("bitcoin", 30)
    );

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("BITCOIN BTC")).toBeInTheDocument();
    expect(screen.getByText("$50000")).toBeInTheDocument();
    expect(screen.getByText("2.5%")).toBeInTheDocument();
  });

  it("renders day buttons and allows switching days", async () => {
    render(<HistoricalChart coinId="bitcoin" />);

    const day7 = screen.getByText("7D");
    const day30 = screen.getByText("30D");

    expect(day30.className).toContain("active");

    fireEvent.click(day7);
    await waitFor(() =>
      expect(api.getHistoricalPrices).toHaveBeenCalledWith("bitcoin", 7)
    );

    expect(day7.className).toContain("active");
  });

  it("renders metric buttons and allows switching metrics", async () => {
    render(<HistoricalChart coinId="bitcoin" />);

    const usdBtn = screen.getByText("USD");
    const volumeBtn = screen.getByText("Volume");
    const marketCapBtn = screen.getByText("Market Cap");

    expect(usdBtn.className).toContain("active");

    fireEvent.click(volumeBtn);
    expect(volumeBtn.className).toContain("active");

    fireEvent.click(marketCapBtn);
    expect(marketCapBtn.className).toContain("active");
  });

  it("handles API errors", async () => {
    (api.getCoin as Mock).mockRejectedValueOnce(new Error("API error"));
    (api.getHistoricalPrices as Mock).mockRejectedValueOnce(
      new Error("API error")
    );

    render(<HistoricalChart coinId="bitcoin" />);

    await waitFor(() =>
      expect(screen.queryByText("BITCOIN BTC")).not.toBeInTheDocument()
    );
  });
});
