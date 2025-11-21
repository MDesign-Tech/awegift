"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "INR"
  | "BDT"
  | "PKR"
  | "RWF"; // 👈 ADD THIS

interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  exchangeRates: Record<CurrencyCode, number>;
  convertPrice: (amount: number, fromCurrency?: CurrencyCode) => number;
  getCurrencySymbol: (currencyCode: CurrencyCode) => string;
  getCurrencyName: (currencyCode: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

const currencyData: Record<CurrencyCode, { symbol: string; name: string }> = {
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
  CHF: { symbol: "CHF", name: "Swiss Franc" },
  CNY: { symbol: "¥", name: "Chinese Yuan" },
  INR: { symbol: "₹", name: "Indian Rupee" },
  BDT: { symbol: "৳", name: "Bangladeshi Taka" },
  PKR: { symbol: "₨", name: "Pakistani Rupee" },
  RWF: { symbol: "FRw", name: "Rwandan Franc" },
};

// Mock exchange rates - in a real app, you'd fetch these from an API
const mockExchangeRates: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 83.25,
  BDT: 109.5,
  PKR: 278.5,
  RWF: 1300,
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("USD");
  const [exchangeRates, setExchangeRates] =
    useState<Record<CurrencyCode, number>>(mockExchangeRates);

  // Load saved currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency && currencyData[savedCurrency as CurrencyCode]) {
      setSelectedCurrency(savedCurrency as CurrencyCode);
    }
  }, []);

  const setCurrency = (currency: CurrencyCode) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  const convertPrice = (
    amount: number,
    fromCurrency: CurrencyCode = "USD"
  ): number => {
    if (fromCurrency === selectedCurrency) return amount;

    // Convert from source currency to USD first, then to target currency
    const usdAmount = amount / exchangeRates[fromCurrency];
    const convertedAmount = usdAmount * exchangeRates[selectedCurrency];

    return convertedAmount;
  };

  const getCurrencySymbol = (currencyCode: CurrencyCode): string => {
    return currencyData[currencyCode]?.symbol || "$";
  };

  const getCurrencyName = (currencyCode: CurrencyCode): string => {
    return currencyData[currencyCode]?.name || "US Dollar";
  };

  // Simulate fetching exchange rates (in a real app, you'd call an API)
  useEffect(() => {
    const fetchExchangeRates = async () => {
      // In a real app, you would fetch from an API like:
      // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      // const data = await response.json();
      // setExchangeRates(data.rates);

      // For now, we'll use mock data with slight variations
      const simulatedRates = { ...mockExchangeRates };
      (Object.keys(simulatedRates) as CurrencyCode[]).forEach((currency) => {
        if (currency !== "USD") {
          // Add slight random variation to simulate real-time rates
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          simulatedRates[currency] *= 1 + variation;
        }
      });
      setExchangeRates(simulatedRates);
    };

    fetchExchangeRates();
    // Update rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const contextValue: CurrencyContextType = {
    selectedCurrency,
    setCurrency,
    exchangeRates,
    convertPrice,
    getCurrencySymbol,
    getCurrencyName,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
