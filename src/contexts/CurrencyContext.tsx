"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// --- 1. Type Definitions (Full List) ---

type CurrencyCode =
  | "USD"
| "RWF";
//   | "EUR"
//   | "GBP"
//   | "JPY"
//   | "CAD"
//   | "AUD"
//   | "CHF"
//   | "CNY"
//   | "INR"
//   | "BDT"
//   | "PKR"
  

const currencyData: Record<CurrencyCode, { symbol: string; name: string; flag: string }> = {
  USD: { symbol: "$", name: "US Dollar", flag: "🇺🇸" },
RWF: { symbol: "FRw", name: "Rwandan Franc", flag: "🇷🇼" },
//   EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
//   GBP: { symbol: "£", name: "British Pound", flag: "🇬🇧" },
//   JPY: { symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
//   CAD: { symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
//   AUD: { symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
//   CHF: { symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
//   CNY: { symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
//   INR: { symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
//   BDT: { symbol: "৳", name: "Bangladeshi Taka", flag: "🇧🇩" },
//   PKR: { symbol: "₨", name: "Pakistani Rupee", flag: "🇵🇰" },
  
};

// --- 2. API Configuration and Caching (Moved to outside function scope) ---

const API_ENDPOINT = "https://v6.exchangerate-api.com/v6/42e9df5d934bb941cbe19c9e/latest/USD";

interface ExchangeRateData {
  conversion_rates: Record<string, number>;
  time_next_update_unix: number;
}

let cachedExchangeData: ExchangeRateData | null = null;

// Mock fallback rates for use until the API fetches (USD base)
const FALLBACK_RATES: Record<CurrencyCode, number> = {
    USD: 1, RWF: 1300 // Use a realistic RWF rate
};

// --- 3. Context Type and Definition ---

interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  exchangeRates: Record<CurrencyCode, number>;
  convertPrice: (amount: number, fromCurrency?: CurrencyCode) => number;
  getCurrencySymbol: (currencyCode: CurrencyCode) => string;
  getCurrencyName: (currencyCode: CurrencyCode) => string;
  getCurrencyFlag: (currencyCode: CurrencyCode) => string;
  isLoading: boolean; // Add loading state
  error: string | null; // Add error state
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

// --- 4. Currency Provider Component ---

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("RWF");
  const [exchangeRates, setExchangeRates] =
    useState<Record<CurrencyCode, number>>(FALLBACK_RATES); // Use fallback initially
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency && currencyData[savedCurrency as CurrencyCode]) {
      setSelectedCurrency(savedCurrency as CurrencyCode);
    }
  }, []);

  // --- API Fetching Logic ---
  const fetchAndCacheRates = useCallback(async () => {
        const nowUnix = Math.floor(Date.now() / 1000);
        setError(null);
    
        // 1. Check if cache is valid (next update time hasn't passed)
        if (cachedExchangeData && cachedExchangeData.time_next_update_unix > nowUnix) {
            console.log("Using cached exchange rates.");
            setExchangeRates(cachedExchangeData.conversion_rates as Record<CurrencyCode, number>);
            setIsLoading(false);
            return;
        }
    
        // 2. Fetch new data
        console.log("Fetching new exchange rates from API...");
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.result !== 'success') {
                throw new Error(`Exchange Rate API error: ${data['error-type'] || 'Unknown Error'}`);
            }
    
            const rates = data.conversion_rates as Record<string, number>;
            
            // Filter and map rates to your CurrencyCode type
            const filteredRates: Partial<Record<CurrencyCode, number>> = {};
            (Object.keys(currencyData) as CurrencyCode[]).forEach(code => {
                if (rates[code] !== undefined) { 
                    filteredRates[code] = rates[code];
                }
            });
            
            // 3. Update cache and state
            cachedExchangeData = {
                conversion_rates: filteredRates as Record<CurrencyCode, number>,
                time_next_update_unix: data.time_next_update_unix,
            };
    
            setExchangeRates(cachedExchangeData.conversion_rates);
            
        } catch (err: any) {
            console.error("Error fetching real-time exchange rates. Falling back to mock data.", err);
            setError("Could not fetch real-time rates. Using last known/default rates.");
            // If fetching fails, we keep the existing or FALLBACK_RATES
        } finally {
            setIsLoading(false);
        }
    }, []);


  useEffect(() => {
    // Initial fetch
    fetchAndCacheRates();
    
    // Set up interval based on the API's next update time or a default (e.g., 24 hours, or 3600000 ms if we rely on a 1hr service)
    // We'll use a conservative 1-hour interval (3600000 ms) if we don't have the exact 'time_next_update_unix' yet.
    // NOTE: This interval polling is usually best avoided if the API supports webhooks or server-sent events.
    const interval = setInterval(fetchAndCacheRates, 3600000); 

    return () => clearInterval(interval);
  }, [fetchAndCacheRates]); // Dependency on useCallback

  // --- Context Functions ---

  const setCurrency = (currency: CurrencyCode) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency);
  };

  // convertPrice is now SYNCHRONOUS, relying on the state-managed rates
  const convertPrice = (
    amount: number,
    fromCurrency: CurrencyCode = "USD"
  ): number => {
    
    if (fromCurrency === selectedCurrency) return amount;

    const rateFromUSD = exchangeRates[fromCurrency];
    const rateToUSD = exchangeRates[selectedCurrency];

    if (!rateFromUSD || !rateToUSD) {
        // Fallback for missing rate, usually due to a temporary error
        console.warn(`Missing rate for conversion ${fromCurrency} to ${selectedCurrency}. Returning original amount.`);
        return amount;
    }

    // Convert from source currency to USD first, then to target currency
    const usdAmount = amount / rateFromUSD;
    const convertedAmount = usdAmount * rateToUSD;

    return convertedAmount;
  };

  const getCurrencySymbol = (currencyCode: CurrencyCode): string => {
    return currencyData[currencyCode]?.symbol || "$";
  };

  const getCurrencyName = (currencyCode: CurrencyCode): string => {
    return currencyData[currencyCode]?.name || "US Dollar";
  };

  const getCurrencyFlag = (currencyCode: CurrencyCode): string => {
    return currencyData[currencyCode]?.flag || "🇺🇸";
  };

  const contextValue: CurrencyContextType = {
    selectedCurrency,
    setCurrency,
    exchangeRates,
    convertPrice,
    getCurrencySymbol,
    getCurrencyName,
    getCurrencyFlag,
    isLoading,
    error
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