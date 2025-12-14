"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import { FiMessageSquare, FiCheckCircle, FiTrash2, FiSearch, FiPlus, FiEye } from "react-icons/fi";
import Link from "next/link";
import { QuoteProductType, ProductType } from "../../../../type";
import PriceFormat from "@/components/PriceFormat";

interface QuoteFormData {
  email?: string;
  phone?: string;
  products: QuoteProductType[];
  userNotes: string;
}

export default function QuotePage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<QuoteFormData>({
    email: "",
    phone: "",
    products: [{ productId: null, name: "", quantity: 1 }],
    userNotes: "How much",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ products?: string; userNotes?: string; email?: string; phone?: string; duplicates?: number[] }>({});
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<{ [key: number]: ProductType[] }>({});
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Populate form with user data when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        email: session.user.email || "",
        // Note: phone would need to be fetched from user profile if available
      }));
    }
  }, [session]);

  const validateForm = (): boolean => {
    const newErrors: { products?: string; userNotes?: string; email?: string; phone?: string; duplicates?: number[] } = {};

    // Validate products
    if (!Array.isArray(formData.products) || formData.products.length === 0) {
      newErrors.products = "Please add at least one product";
    } else {
      const bad = formData.products.find(
        (p: QuoteProductType) => !p.name || !p.name.trim() || !p.quantity || p.quantity <= 0
      );
      if (bad) {
        newErrors.products = "Please provide product name and a valid quantity";
      }

      // Check for duplicate product IDs (for selected products) or names (for custom products)
      const duplicateIndices: number[] = [];
      const seenProductIds = new Set<string>();
      const seenNames = new Set<string>();

      formData.products.forEach((product, index) => {
        const trimmedName = product.name.trim().toLowerCase();

        if (product.productId) {
          // Check for duplicate product IDs
          if (seenProductIds.has(product.productId)) {
            duplicateIndices.push(index);
          } else {
            seenProductIds.add(product.productId);
          }
        } else if (trimmedName) {
          // Check for duplicate custom product names
          if (seenNames.has(trimmedName)) {
            duplicateIndices.push(index);
          } else {
            seenNames.add(trimmedName);
          }
        }
      });

      if (duplicateIndices.length > 0) {
        newErrors.duplicates = duplicateIndices;
        newErrors.products = "Duplicate products found. Each product can only be added once.";
      }
    }

    if (!formData.userNotes.trim()) {
      newErrors.userNotes = "Please provide a message or project details";
    }

    // Validate email and phone if user is not logged in
    if (!session?.user) {
      if (!formData.email?.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (formData.phone && !/^[\+]?[0-9\-\s\(\)]{10,}$/.test(formData.phone.trim())) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const requestData = {
        products: formData.products,
        userNotes: formData.userNotes,
        ...(session?.user ? {} : { email: formData.email, phone: formData.phone }),
      };

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          email: session?.user ? session.user.email || "" : "",
          phone: "",
          products: [{ productId: null, name: "", quantity: 1 }],
          userNotes: ""
        });
        setSelectedProductIds(new Set()); // Clear selected product IDs
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

  const handleUserNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev: QuoteFormData) => ({ ...prev, userNotes: e.target.value }));
    if (errors.userNotes) setErrors((prev) => ({ ...prev, userNotes: undefined }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: QuoteFormData) => ({ ...prev, email: e.target.value }));
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: QuoteFormData) => ({ ...prev, phone: e.target.value }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handleProductChange = (
    index: number,
    field: keyof QuoteProductType,
    value: string | number
  ) => {
    setFormData((prev: QuoteFormData) => {
      const products = prev.products.map((p: QuoteProductType, i: number) =>
        i === index ? { ...p, [field]: field === "quantity" ? Number(value) : value } : p
      );
      return { ...prev, products };
    });
    if (errors.products) setErrors((prev) => ({ ...prev, products: undefined }));
  };

  const addProductRow = () => {
    setFormData((prev: QuoteFormData) => ({ ...prev, products: [...prev.products, { productId: null, name: "", quantity: 1 }] }));
  };

  const removeProductRow = (index: number) => {
    // Remove the product ID from selected set if it exists
    const productToRemove = formData.products[index];
    if (productToRemove.productId) {
      setSelectedProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productToRemove.productId as string);
        return newSet;
      });
    }

    setFormData((prev: QuoteFormData) => {
      const products = prev.products.filter((_: QuoteProductType, i: number) => i !== index);
      return { ...prev, products: products.length ? products : [{ productId: null, name: "", quantity: 1 }] };
    });
  };

  const handleProductNameChange = (index: number, value: string) => {
    const currentProductId = formData.products[index].productId;

    // If user is changing the name and it was a selected product, remove it from selected set
    if (currentProductId && value !== formData.products[index].name) {
      setSelectedProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentProductId);
        return newSet;
      });
    }

    handleProductChange(index, "name", value);

    // Filter suggestions
    if (value.trim()) {
      const filtered = allProducts.filter(product =>
        product.title.toLowerCase().includes(value.toLowerCase())
      );
      setProductSuggestions(prev => ({ ...prev, [index]: filtered }));
      setShowSuggestions(prev => ({ ...prev, [index]: true }));

      // Check if the current value exactly matches any suggestion
      const exactMatch = filtered.find(product => product.title.toLowerCase() === value.toLowerCase());
      if (!exactMatch) {
        // If no exact match, set productId to null (custom product)
        setFormData((prev: QuoteFormData) => {
          const products = prev.products.map((p: QuoteProductType, i: number) =>
            i === index ? { ...p, productId: null } : p
          );
          return { ...prev, products };
        });
      }
    } else {
      setProductSuggestions(prev => ({ ...prev, [index]: [] }));
      setShowSuggestions(prev => ({ ...prev, [index]: false }));
      // Empty value also means custom product
      setFormData((prev: QuoteFormData) => {
        const products = prev.products.map((p: QuoteProductType, i: number) =>
          i === index ? { ...p, productId: null } : p
        );
        return { ...prev, products };
      });
    }
  };

  const selectProductSuggestion = (index: number, product: ProductType) => {
    // Check if this product is already selected in another row
    if (selectedProductIds.has(product.id)) {
      alert(`Product "${product.title}" is already selected. Please choose a different product.`);
      return;
    }

    // Remove the old product ID from selected set if it exists
    const currentProductId = formData.products[index].productId;
    if (currentProductId) {
      setSelectedProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentProductId);
        return newSet;
      });
    }

    // Add the new product ID to selected set
    setSelectedProductIds(prev => new Set(prev).add(product.id));

    setFormData((prev: QuoteFormData) => {
      const products = prev.products.map((p: QuoteProductType, i: number) =>
        i === index ? { ...p, productId: product.id, name: product.title } : p
      );
      return { ...prev, products };
    });
    setShowSuggestions(prev => ({ ...prev, [index]: false }));
  };

  const handleProductNameBlur = (index: number) => {
    // Delay hiding suggestions to allow click
    setTimeout(() => {
      setShowSuggestions(prev => ({ ...prev, [index]: false }));
    }, 150);
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowSuccess(false)}
                className="bg-theme-color text-white px-6 py-3 rounded-lg hover:bg-theme-color/90 transition-colors"
              >
                Submit Another Request
              </button>
              {session?.user && (
                <Link
                  href="/account/quotes"
                  className="bg-theme-white border-1 border-theme-color text-theme-color px-6 py-3 rounded-lg hover:bg-blue-600/90 transition-colors"
                >
                  Go to Your Quotes
                </Link>
              )}
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Title className="text-3xl lg:text-4xl font-bold mb-4">Request a Quote</Title>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* Quote Form */}
          <div className="bg-theme-white border border-border-color rounded-lg p-2 lg:p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information - Only show for non-logged-in users */}
              {!session?.user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors ${
                        errors.email ? "border-red-500" : "border-border-color"
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors ${
                        errors.phone ? "border-red-500" : "border-border-color"
                      }`}
                      placeholder="+250 XXX XXX XXX"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Products *</label>
                <table className="w-full border border-gray-300">
                    <thead>
                    <tr>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 border-b border-gray-300">Product Name</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 border-b border-gray-300">Product Quantity</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 border-b border-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.products.map((product: QuoteProductType, idx: number) => {
                        const isDuplicate = errors.duplicates?.includes(idx);
                        return (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="py-2 px-2 relative">
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => handleProductNameChange(idx, e.target.value)}
                                onBlur={() => handleProductNameBlur(idx)}
                                placeholder="Enter product name"
                              className={`w-full min-w-34 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color outline-none ${
                                isDuplicate ? "border-red-500 bg-red-50" : ""
                                }`}
                              />
                              {isDuplicate && (
                                <p className="text-red-500 text-xs mt-1">Product already entered</p>
                              )}
                              {showSuggestions[idx] && productSuggestions[idx]?.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                                  {productSuggestions[idx].map((suggestion) => (
                                    <div
                                      key={suggestion.id}
                                      onClick={() => selectProductSuggestion(idx, suggestion)}
                                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    >
                                      <img
                                        src={suggestion.thumbnail || "/placeholder-product.svg"}
                                        alt={suggestion.title}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                      <span>{suggestion.title}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                        <td className="py-2 px-2">
                              <input
                                type="number"
                                min={1}
                                max={10000000}
                                value={product.quantity}
                                onChange={(e) => handleProductChange(idx, "quantity", Number(e.target.value))}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color outline-none"
                                placeholder="Qty"
                              />
                            </td>
                        <td className="py-2 px-2">
                              <button
                                type="button"
                                onClick={() => removeProductRow(idx)}
                                disabled={formData.products.length <= 1}
                                aria-label="Remove product"
                                className="text-red-500 p-2 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                {errors.products && <p className="text-red-500 text-sm mt-1">{errors.products}</p>}

                <div>
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="flex items-center mt-3 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-theme-color text-sm"
                  >
                    <FiPlus className="mr-2 h-4 w-4" />
                    Add another product
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="userNotes" className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  id="userNotes"
                  name="userNotes"
                  value={formData.userNotes}
                  onChange={handleUserNotesChange}
                  required
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors resize-vertical ${
                    errors.userNotes ? "border-red-500" : "border-border-color"
                  }`}
                  placeholder="Add any details, timelines or additional notes..."
                />
                {errors.userNotes && <p className="text-red-500 text-sm mt-1">{errors.userNotes}</p>}
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