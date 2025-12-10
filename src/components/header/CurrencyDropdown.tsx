"use client";
import { useState, useRef, useEffect } from "react";
import { IoChevronDownSharp } from "react-icons/io5";
import { FiCheck } from "react-icons/fi";
import { useCurrency } from "../../contexts/CurrencyContext";
import CurrencyNotification from "../notifications/CurrencyNotification";

type CurrencyCode =
  | "USD"
  // | "EUR"
  // | "GBP"
  // | "JPY"
  // | "CAD"
  // | "AUD"
  // | "INR"
  // | "BDT"
  // | "PKR"
  | "RWF";

const currencies: {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  region?: string;
}[] = [
    { code: "RWF", name: "Rwandan Franc", symbol: "FRw", flag: "https://flagcdn.com/w320/rw.png", region: "Africa" },
    { code: "USD", name: "US Dollar", symbol: "$", flag: "https://flagcdn.com/w320/us.png", region: "Global" },
    // { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", region: "Europe" },
    // { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", region: "Europe" },
    // { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", region: "Asia" },
    // {
    // },
    // { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", region: "Oceania" },
    // { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩", region: "South Asia" },
    // { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", region: "South Asia" },
    // { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰", region: "South Asia" },
  ];

const CurrencyDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    name: "",
    symbol: "",
    code: "",
  });
  const { selectedCurrency, setCurrency } = useCurrency();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCurrencySelect = (currency: {
    code: CurrencyCode;
    name: string;
    symbol: string;
    flag: string;
    region?: string;
  }) => {
    // Don't show notification if selecting the same currency
    if (currency.code === selectedCurrency) {
      setIsOpen(false);
      return;
    }

    setCurrency(currency.code);
    setIsOpen(false);

    // Show custom notification
    setNotificationData({
      name: currency.name,
      symbol: currency.flag,
      code: currency.code,
    });
    setShowNotification(true);
  };

  const currentCurrency =
    currencies.find((c) => c.code === selectedCurrency) || currencies[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="headerTopMenu cursor-pointer hover:text-orange-300 transition-colors flex items-center gap-1"
      >
        <img className="w-4 h-4 rounded-full object-cover" src={currentCurrency.flag} alt={currentCurrency.code} />
        <span>{currentCurrency.code}</span>
        <IoChevronDownSharp
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 z-50 py-2"
          style={{ backdropFilter: "blur(8px)" }}
        >
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencySelect(currency)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${currency.region === "South Asia"
                  ? "border-l-2 border-l-green-500 bg-green-50/30"
                  : ""
                }`}
            >
              <div className="flex items-center gap-3">
                <img className="w-6 h-6 rounded-full object-cover" src={currency.flag} alt={currency.code} />
                <div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    {currency.code}
                    {currency.region === "South Asia" && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-900">{currency.name}</div>
                </div>
              </div>
              {selectedCurrency === currency.code && (
                <FiCheck className="text-theme-color text-sm" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Custom Currency Notification */}
      <CurrencyNotification
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        currencyName={notificationData.name}
        currencySymbol={notificationData.symbol}
        currencyCode={notificationData.code}
      />
    </div>
  );
};

export default CurrencyDropdown;
