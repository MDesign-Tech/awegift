"use client";
import { twMerge } from "tailwind-merge";
import { useCurrency } from "../contexts/CurrencyContext";
import { formatCurrency } from "../lib/currency";

type CurrencyCode =
  | "USD"
  | "RWF"

interface Props {
  amount?: number;
  className?: string;
  fromCurrency?: CurrencyCode;
}

const PriceFormat = ({ amount, className, fromCurrency = "RWF" }: Props) => {
  const { selectedCurrency, convertPrice } = useCurrency();

  if (!amount)
    return <span className={twMerge("font-medium", className)}>-</span>;

  const convertedAmount = convertPrice(amount, fromCurrency);
  const formattedPrice = formatCurrency(convertedAmount, selectedCurrency);

  return (
    <span className={twMerge("font-medium", className)}>{formattedPrice}</span>
  );
};

export default PriceFormat;
