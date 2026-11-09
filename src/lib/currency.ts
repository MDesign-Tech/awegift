// --- 1. Type Definitions (Re-used from your initial code) ---

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

// --- 2. API Configuration and Caching ---

const API_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

// Interface for the fetched data structure (only what we need)
interface ExchangeRateData {
    conversion_rates: Record<string, number>;
    time_next_update_unix: number;
}

let cachedExchangeData: ExchangeRateData | null = null;

/**
 * Fetches the latest exchange rates relative to USD from the API.
 * Rates are cached and only fetched again if the next update time has passed.
 * @returns A promise that resolves to the conversion_rates map.
 */
const fetchRatesFromAPI = async (): Promise<Record<CurrencyCode, number>> => {
    const nowUnix = Math.floor(Date.now() / 1000);

    // Check if cache is valid (next update time hasn't passed)
    if (cachedExchangeData && cachedExchangeData.time_next_update_unix > nowUnix) {
        console.log("Using cached exchange rates.");
        return cachedExchangeData.conversion_rates as Record<CurrencyCode, number>;
    }

    console.log("Fetching new exchange rates from API...");
    try {
        const response = await fetch(API_ENDPOINT);
        console.log(`Server API response status: ${response.status}`);
        if (!response.ok) {
            console.error(`Server API response not ok. Status: ${response.status}, StatusText: ${response.statusText}`);
            throw new Error(`API call failed with status: ${response.status}, ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Server API response data:", data);

        const rates = data.rates as Record<string, number>;

        // Filter rates to include only the ones defined in CurrencyCode
        const filteredRates: Partial<Record<CurrencyCode, number>> = {};
        for (const code of Object.keys(currencyData) as CurrencyCode[]) {
            if (rates[code] !== undefined) {
                filteredRates[code] = rates[code];
            }
        }

        // Update cache with the new data
        cachedExchangeData = {
            conversion_rates: filteredRates as Record<CurrencyCode, number>,
            time_next_update_unix: (data.time_last_update_unix || Math.floor(Date.now() / 1000)) + 3600, // 1 hour from last update
        };

        return cachedExchangeData.conversion_rates;
    } catch (error) {
        console.error("Error fetching real-time exchange rates:", error);
        console.error("Error details:", (error as Error).message, (error as Error).stack);
        // CRITICAL: In a production app, you would fall back to a stored safe/mock rate or fail gracefully.
        throw new Error("Could not fetch real-time exchange rates. Please check API key and network.");
    }
};

// --- 3. Exported Conversion Functions (Now asynchronous) ---

/**
 * Gets the exchange rate from one currency to another using the latest API data.
 */
export const getExchangeRate = async (fromCurrency: CurrencyCode, toCurrency: CurrencyCode): Promise<number> => {
    if (fromCurrency === toCurrency) return 1;

    // Await the fetch for the latest rates relative to USD
    const rates = await fetchRatesFromAPI();

    // Get the rate of the currencies relative to USD
    const rateFromUSD = rates[fromCurrency];
    const rateToUSD = rates[toCurrency];

    if (!rateFromUSD || !rateToUSD) {
        throw new Error(`Exchange rate data missing for ${fromCurrency} or ${toCurrency}. 
                         Please ensure all your CurrencyCode types are supported by the API.`);
    }

    // Conversion Formula: (1 / Rate_From_to_USD) * Rate_To_to_USD
    const conversionRate = (1 / rateFromUSD) * rateToUSD;

    return conversionRate;
};

/**
 * Converts an amount from one currency to another using the latest API data.
 */
export const convertPrice = async (
    amount: number,
    fromCurrency: CurrencyCode = "USD",
    toCurrency: CurrencyCode = "RWF"
): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;

    // Await the fetch for the latest rates relative to USD
    const rates = await fetchRatesFromAPI();

    // Get the rate of the currencies relative to USD
    const rateFromUSD = rates[fromCurrency];
    const rateToUSD = rates[toCurrency];

    if (!rateFromUSD || !rateToUSD) {
        throw new Error(`Exchange rate data missing for ${fromCurrency} or ${toCurrency}. 
                         Please ensure all your CurrencyCode types are supported by the API.`);
    }

    // Step 1: Convert the amount to USD: amount / rateFromUSD
    const usdAmount = amount / rateFromUSD;

    // Step 2: Convert the USD amount to the target currency: usdAmount * rateToUSD
    const convertedAmount = usdAmount * rateToUSD;

    return convertedAmount;
};

// --- 4. Formatting Functions (Remain Synchronous) ---

export const getCurrencySymbol = (currencyCode: CurrencyCode): string => {
    return currencyData[currencyCode]?.symbol || "$";
};

export const formatCurrency = (
    amount: number,
    currencyCode: string = "RWF",
    locale: string = "en-US",
    currencyDisplay: Intl.NumberFormatOptions["currencyDisplay"] = "symbol"
): string => {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        currencyDisplay,
        minimumFractionDigits: 0,
        maximumFractionDigits: currencyCode === "RWF" ? 0 : 2,
    }).format(amount);
};