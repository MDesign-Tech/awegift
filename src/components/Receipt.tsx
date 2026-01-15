// @/components/Receipt.tsx
"use client";

import { useState } from "react";
import { FiDownload, FiLoader } from "react-icons/fi";
import Button from "./ui/Button";

interface ReceiptProps {
  orderId: string;
}

const Receipt = ({ orderId }: ReceiptProps) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/download-receipt?orderId=${orderId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `awegift-receipt-${orderId.slice(-8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert("Error: " + (error.error || "Failed to download receipt"));
      }
    } catch (error) {
      alert("Error: Failed to download receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <>
          <FiLoader className="animate-spin mr-2" />
          Generating...
        </>
      ) : (
        <>
          <FiDownload className="mr-2" />
          Download Receipt
        </>
      )}
    </Button>
  );
};

export default Receipt;