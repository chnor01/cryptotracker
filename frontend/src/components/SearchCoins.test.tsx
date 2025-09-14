// SearchCoins.test.tsx
import { describe, it, vi, beforeEach, expect } from "vitest";
import type { Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchCoins from "./SearchCoins";
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

vi.mock("../api/cryptoApi", () => ({
  searchCoin: vi.fn(),
}));

describe("SearchCoins component", () => {
  const mockResults = [
    { id: "bitcoin", name: "Bitcoin", symbol: "btc" },
    { id: "wrapped-bitcoin", name: "Wrapped Bitcoin", symbol: "wbtc" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.searchCoin as Mock).mockResolvedValue(mockResults);
  });

  it("updates query on input change", () => {
    render(
      <BrowserRouter>
        <SearchCoins />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      "Search coins"
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "bit" } });
    expect(input.value).toBe("bit");
  });

  it("calls searchCoin and displays results for matching query", async () => {
    render(
      <BrowserRouter>
        <SearchCoins />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      "Search coins"
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "bit" } });

    await waitFor(() => expect(api.searchCoin).toHaveBeenCalledWith("bit", 50));

    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("Wrapped Bitcoin")).toBeInTheDocument();
  });

  it("does not display results when input is empty", async () => {
    render(
      <BrowserRouter>
        <SearchCoins />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      "Search coins"
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });

    await waitFor(() => {
      const table = screen.queryByRole("table");
      expect(table).not.toBeInTheDocument();
    });
  });

  it("navigates to coin page on result click", async () => {
    render(
      <BrowserRouter>
        <SearchCoins />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      "Search coins"
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "bit" } });

    await waitFor(() => screen.getByText("Bitcoin"));
    fireEvent.mouseDown(screen.getByText("Bitcoin"));
    expect(mockNavigate).toHaveBeenCalledWith("/coins/bitcoin");
  });

  it("hides results when input loses focus", async () => {
    render(
      <BrowserRouter>
        <SearchCoins />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      "Search coins"
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "bit" } });

    await waitFor(() => screen.getByText("Bitcoin"));
    fireEvent.blur(input);

    await waitFor(() => {
      const table = screen.queryByRole("table");
      expect(table).not.toBeInTheDocument();
    });
  });

  it("handles API errors", async () => {
    (api.searchCoin as Mock).mockRejectedValueOnce(new Error("API error"));

    render(
      <BrowserRouter>
        <SearchCoins />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(
      "Search coins"
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "bit" } });

    await waitFor(() => expect(api.searchCoin).toHaveBeenCalledWith("bit", 50));

    const table = screen.queryByRole("table");
    expect(table).not.toBeInTheDocument();
  });
});
