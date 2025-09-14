import { describe, it, vi, beforeEach, afterEach, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TopMarket from "./TopMarket";
import * as api from "../api/cryptoApi";
import { BrowserRouter } from "react-router-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCoins = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    current_price: 50000,
    market_cap: 1000000000,
    price_change_percentage_24h: +2,
    circulating_supply: 18000000,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "eth",
    current_price: 4000,
    market_cap: 500000000,
    price_change_percentage_24h: -1,
    circulating_supply: 110000000,
  },
];

describe("TopMarket component", () => {
  beforeEach(() => {
    vi.spyOn(api, "getAllCoins").mockResolvedValue(mockCoins);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders table headers and coins", async () => {
    render(
      <BrowserRouter>
        <TopMarket />
      </BrowserRouter>
    );

    expect(screen.getByText("Coin")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("24H Price %")).toBeInTheDocument();
    expect(screen.getByText(/Market Cap/)).toBeInTheDocument();
    expect(screen.getByText("Circulating Supply")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
      expect(screen.getByText("Ethereum")).toBeInTheDocument();
    });
  });

  it("calls navigate on row click", async () => {
    render(
      <BrowserRouter>
        <TopMarket />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText("Bitcoin"));
    fireEvent.click(screen.getByText("Bitcoin"));
    expect(mockNavigate).toHaveBeenCalledWith("/coins/bitcoin");
  });

  it("sorts by price when header clicked", async () => {
    render(
      <BrowserRouter>
        <TopMarket />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText("Bitcoin"));

    const priceHeader = screen.getByText("Price");
    fireEvent.click(priceHeader);

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Bitcoin");
    expect(rows[2]).toHaveTextContent("Ethereum");

    fireEvent.click(priceHeader);
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Ethereum");
    expect(screen.getAllByRole("row")[2]).toHaveTextContent("Bitcoin");
  });

  it("pagination buttons work", async () => {
    render(
      <BrowserRouter>
        <TopMarket />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText("Bitcoin"));

    const prevButton = screen.getByText("Previous") as HTMLButtonElement;
    const nextButton = screen.getByText("Next") as HTMLButtonElement;

    expect(prevButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(false);

    fireEvent.click(nextButton);

    const prevButtonAfter = screen.getByText("Previous") as HTMLButtonElement;
    expect(prevButtonAfter.disabled).toBe(false);
  });

  it("calls getAllCoins with correct parameters", async () => {
    render(
      <BrowserRouter>
        <TopMarket />
      </BrowserRouter>
    );

    await waitFor(() => expect(api.getAllCoins).toHaveBeenCalled());

    expect(api.getAllCoins).toHaveBeenCalledWith(15, 0, "market_cap", "desc");
  });
});
