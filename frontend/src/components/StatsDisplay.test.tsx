import { describe, it, vi, beforeEach, afterEach, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import StatsDisplay from "./StatsDisplay";
import * as api from "../api/cryptoApi";

const mockCoinData = {
  market_cap: 1200000000,
  market_cap_change_percentage_24h: 3.5,
  fully_diluted_valuation: 1500000000,
  total_volume: 50000000,
  high_24h: 60000,
  low_24h: 50000,
  ath: 65000,
  ath_date: "2021-04-14T00:00:00.000Z",
  atl: 1000,
  atl_date: "2015-01-01T00:00:00.000Z",
  circulating_supply: 18000000,
  max_supply: 21000000,
  total_supply: 20000000,
};

describe("StatsDisplay component", () => {
  beforeEach(() => {
    vi.spyOn(api, "getCoin").mockResolvedValue(mockCoinData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays coin stats correctly", async () => {
    render(<StatsDisplay coinId="bitcoin" />);

    await waitFor(() => screen.getByText("Market Cap"));
    await waitFor(() => screen.getByText("Market Cap 24H %"));
    await waitFor(() => screen.getByText("FDV"));
    await waitFor(() => screen.getByText("24H High"));

    expect(screen.getByText(/\$1.20B/)).toBeInTheDocument(); // market_cap formatted
    expect(screen.getByText("3.5%")).toBeInTheDocument(); // market_cap_change_percentage_24h
    expect(screen.getByText(/\$\s*50\s*000/)).toBeInTheDocument(); // low_24h
    expect(
      screen.getByText(new Date("2021-04-14").toLocaleDateString())
    ).toBeInTheDocument(); // ath_date
    expect(screen.getByText(/\$1.50B/)).toBeInTheDocument(); // FDV
    expect(screen.getByText("18.00M")).toBeInTheDocument(); // circulating_supply
  });

  it("shows 'No data available' if API returns null", async () => {
    vi.spyOn(api, "getCoin").mockResolvedValueOnce(null);

    render(<StatsDisplay coinId="bitcoin" />);
    await waitFor(() => screen.getByText(/No data available/));

    expect(screen.getByText(/No data available/)).toBeInTheDocument();
  });

  it("formats null numbers as '—'", async () => {
    const coinWithNulls = {
      ...mockCoinData,
      fully_diluted_valuation: null,
      max_supply: null,
      total_supply: null,
    };
    vi.spyOn(api, "getCoin").mockResolvedValueOnce(coinWithNulls);

    render(<StatsDisplay coinId="bitcoin" />);
    await waitFor(() => screen.getByText(/FDV/));

    expect(screen.getByText("$—")).toBeInTheDocument(); // FDV
  });
});
