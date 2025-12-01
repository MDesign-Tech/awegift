"use client";
import { useState } from "react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import { FiMessageSquare, FiCheckCircle } from "react-icons/fi";

interface QuoteFormData {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}

export default function QuotePage() {
  const [formData, setFormData] = useState<QuoteFormData>({
    fullName: "",
    email: "",
    phone: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<QuoteFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<QuoteFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Please provide details about your request";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          reason: "",
        });
      } else {
        alert(data.error || "Failed to submit quote request");
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof QuoteFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (showSuccess) {
    return (
      <Container className="py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Quote Request Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your interest! Our team will review your request and get back to you soon.
            </p>
            <p className="text-gray-500 mb-6">
              You may receive a response via email, phone SMS, or in your notifications.
              Please allow 1-2 business days for our team to process your request.
            </p>
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
    <Container className="py-10 lg:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Title className="text-3xl lg:text-4xl font-bold mb-4">
            Request Free Quote
          </Title>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info Section */}
          <div>
            <h2 className="text-2xl font-semibold text-theme-color mb-6">
              Why Choose Our Services?
            </h2>

            <div className="space-y-6">

              <div className="bg-light-bg rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Competitive Pricing
                </h3>
                <p className="text-light-text">
                  We offer transparent pricing with no hidden fees. Get the best value for your investment.
                </p>
              </div>

              <div className="bg-light-bg rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Quick Response
                </h3>
                <p className="text-light-text">
                  Expect a response within 1-2 business days. We prioritize your inquiries and provide timely solutions.
                </p>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div className="bg-light-bg rounded-lg p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-theme-color mb-6 flex items-center gap-2">
              <FiMessageSquare className="w-6 h-6" />
              Request Your Quote
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors ${
                    errors.fullName ? "border-red-500" : "border-border-color"
                  }`}
                  placeholder="Your full name"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors ${
                    errors.email ? "border-red-500" : "border-border-color"
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors ${
                    errors.phone ? "border-red-500" : "border-border-color"
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Details / Message *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors resize-vertical ${
                    errors.reason ? "border-red-500" : "border-border-color"
                  }`}
                  placeholder="Please describe your project requirements, timeline, budget, and any specific details you'd like us to know..."
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                )}
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
        </div>
      </div>
    </Container>
  );
}