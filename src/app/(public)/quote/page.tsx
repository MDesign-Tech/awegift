"use client";
import { useState } from "react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import { FiMessageSquare, FiCheckCircle, FiPlus, FiTrash2 } from "react-icons/fi";

interface ProductItem {
  name: string;
  quantity: number;
}

interface QuoteFormData {
  products: ProductItem[];
  message: string;
}

export default function QuotePage() {
  const [formData, setFormData] = useState<QuoteFormData>({
    products: [{ name: "", quantity: 1 }],
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ products?: string; message?: string }>({});

  const validateForm = (): boolean => {
  const newErrors: { products?: string; message?: string } = {};

    // Validate products
    if (!Array.isArray(formData.products) || formData.products.length === 0) {
      newErrors.products = "Please add at least one product";
    } else {
      const bad = formData.products.find(
        (p) => !p.name || !p.name.trim() || !p.quantity || p.quantity <= 0
      );
      if (bad) {
        newErrors.products = "Please provide product name and a valid quantity";
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please provide a message or project details";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: formData.products, message: formData.message }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setFormData({ products: [{ name: "", quantity: 1 }], message: "" });
      } else {
        alert(data.error || "Failed to submit quote request");
      }
    } catch (err) {
      console.error("Error submitting quote:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, message: e.target.value }));
    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
  };

  const handleProductChange = (
    index: number,
    field: keyof ProductItem,
    value: string | number
  ) => {
    setFormData((prev) => {
      const products = prev.products.map((p, i) =>
        i === index ? { ...p, [field]: field === "quantity" ? Number(value) : String(value) } : p
      );
      return { ...prev, products };
    });
    if (errors.products) setErrors((prev) => ({ ...prev, products: undefined }));
  };

  const addProductRow = () => {
    setFormData((prev) => ({ ...prev, products: [...prev.products, { name: "", quantity: 1 }] }));
  };

  const removeProductRow = (index: number) => {
    setFormData((prev) => {
      const products = prev.products.filter((_, i) => i !== index);
      return { ...prev, products: products.length ? products : [{ name: "", quantity: 1 }] };
    });
  };

  if (showSuccess) {
    return (
      <Container className="py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Quote Request Submitted!</h1>
            <p className="text-lg text-gray-600 mb-6">Thank you for your interest! Our team will review your request and get back to you soon.</p>
            <p className="text-gray-500 mb-6">Please allow 1-2 business days for our team to process your request.</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="bg-theme-color text-white px-6 py-3 rounded-lg hover:bg-theme-color/90 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Title className="text-3xl lg:text-4xl font-bold mb-4">Request Quote</Title>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* Quote Form */}
          <div className="bg-light-bg rounded-lg p-6 lg:p-8">

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Products *</label>
                <div className="space-y-3">
                  {formData.products.map((product, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleProductChange(idx, "name", e.target.value)}
                        placeholder="Enter product name"
                        className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color outline-none"
                      />

                      <input
                        type="number"
                        min={1}
                        value={product.quantity}
                        onChange={(e) => handleProductChange(idx, "quantity", Number(e.target.value))}
                        className="w-28 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color outline-none"
                        placeholder="Qty"
                      />

                      <button
                        type="button"
                        onClick={() => removeProductRow(idx)}
                        aria-label="Remove product"
                        className="text-red-500 p-2 rounded hover:bg-red-50"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}

                  {errors.products && <p className="text-red-500 text-sm mt-1">{errors.products}</p>}

                  <div>
                    <button
                      type="button"
                      onClick={addProductRow}
                      className="inline-flex items-center gap-2 text-theme-color font-medium"
                    >
                      <FiPlus /> Add another product
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleMessageChange}
                  required
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors resize-vertical ${
                    errors.message ? "border-red-500" : "border-border-color"
                  }`}
                  placeholder="Add any details, timelines or additional notes..."
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-theme-color text-theme-white py-3 px-6 rounded-lg hover:bg-theme-color/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Request Quote"}
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div>
            <h2 className="text-2xl font-semibold text-theme-color mb-6">Why Choose Our Services?</h2>

            <div className="space-y-6">
              <div className="bg-light-bg rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-2">Competitive Pricing</h3>
                <p className="text-light-text">We offer transparent pricing with no hidden fees. Get the best value for your investment.</p>
              </div>

              <div className="bg-light-bg rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-2">Quick Response</h3>
                <p className="text-light-text">Expect a response within 1-2 business days. We prioritize your inquiries and provide timely solutions.</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Container>
  );
}