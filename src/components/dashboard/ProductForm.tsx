"use client";

import { useState, useEffect } from "react";
import { FiX, FiUpload } from "react-icons/fi";

// Function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Function to generate meta title and description from title and description
const generateMeta = (title: string, description: string) => {
  const metaTitle = title || '';
  const metaDescription = description ? description.substring(0, 160) : '';
  return { metaTitle, metaDescription };
};

// Function to auto-generate SKU
const generateSKU = (product: { category: string; brand: string; title: string; id: string | number }) => {
  const { category, brand, title, id } = product;

  // Extract first 3 letters from category
  const catCode = category.substring(0, 3).toUpperCase();

  // Extract first 3 letters from brand
  const brandCode = brand.substring(0, 3).toUpperCase();

  // Extract first 3 letters from title
  const productCode = title.substring(0, 3).toUpperCase();

  // Add unique identifier
  const uniqueId = id.toString().padStart(3, '0');

  return `${catCode}-${brandCode}-${productCode}-${uniqueId}`;
};

import { ProductType  } from "../../../type";

interface ProductFormProps {
  product?: ProductType | null;
  onSubmit: (product: ProductType) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, loading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductType>({
    id: "",
    title: "",
    description: "",
    category: "",
    price: 0,
    discountPercentage: 0,
    rating: 0,
    stock: 0,
    brand: "",
    sku: "",
    weight: 0,
    dimensions: {
      width: 0,
      height: 0,
      depth: 0,
    },
    warrantyInformation: "",
    shippingInformation: "",
    availabilityStatus: "",
    reviews: [],
    returnPolicy: "",
    minimumOrderQuantity: 0,
    tags: [],
    images: [],
    thumbnail: "",
    meta: {
      createdAt: "",
      updatedAt: "",
      barcode: "",
      qrCode: "",
      slug: "",
      title: "",
      description: "",
    },
  });

  const [categories, setCategories] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) newErrors["title"] = "Title is required";
    if (!formData.description?.trim()) newErrors["description"] = "Description is required";
    if (!formData.price || formData.price <= 0) newErrors["price"] = "Price must be greater than 0";
    if (!formData.category?.trim()) newErrors["category"] = "Category is required";
    if (!formData.brand?.trim()) newErrors["brand"] = "Brand is required";
    if (formData.stock === undefined || formData.stock < 0) newErrors["stock"] = "Stock must be 0 or greater";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };

      if (field.includes('.')) {
        const keys = field.split('.');
        let current: any = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        (newData as any)[field] = value;
      }

      // Auto-generate slug when title changes
      if (field === "title") {
        newData.meta.slug = generateSlug(value);
      }

      // Auto-generate meta when title or description changes
      if (field === "title" || field === "description") {
        const { metaTitle, metaDescription } = generateMeta(
          field === "title" ? value : newData.title,
          field === "description" ? value : newData.description
        );
        newData.meta.title = metaTitle;
        newData.meta.description = metaDescription;
      }

      // Auto-generate SKU when title, category, or brand changes (only for existing products)
      if ((field === "title" || field === "category" || field === "brand") && product?.id) {
        const skuProduct = {
          category: field === "category" ? value : newData.category,
          brand: field === "brand" ? value : newData.brand,
          title: field === "title" ? value : newData.title,
          id: product.id
        };
        newData.sku = generateSKU(skuProduct);
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(",").map(tag => tag.trim()).filter(tag => tag);
    handleInputChange("basicInformation.tags", tags);
  };

  const handleDimensionChange = (dimension: string, value: number) => {
    handleInputChange(`specifications.dimensions.${dimension}`, value);
  };

  const handleImagesChange = (imagesString: string) => {
    const images = imagesString.split(",").map(img => img.trim()).filter(img => img);
    handleInputChange("media.images", images);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["title"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Product title"
                />
                {errors["title"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["title"]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["description"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Product description"
                />
                {errors["description"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["description"]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "other") {
                        setShowCustomCategory(true);
                        setCustomCategory("");
                      } else {
                        setShowCustomCategory(false);
                        handleInputChange("category", value);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                      errors["category"] ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                  {showCustomCategory && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        handleInputChange("category", e.target.value);
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color mt-2 ${
                        errors["category"] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter custom category"
                    />
                  )}
                  {errors["category"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["category"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(", ")}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["price"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors["price"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["price"]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountPercentage || ""}
                  onChange={(e) => handleInputChange("discountPercentage", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="0.00"
                />
              </div>

            </div>
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  value={formData.stock || ""}
                  onChange={(e) => handleInputChange("stock", parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["stock"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                />
                {errors["stock"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["stock"]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  value={formData.minimumOrderQuantity || ""}
                  onChange={(e) => handleInputChange("minimumOrderQuantity", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Status
                </label>
                <select
                  value={formData.availabilityStatus}
                  onChange={(e) => handleInputChange("availabilityStatus", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Low Stock">Low Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Media */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => handleInputChange("thumbnail", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images (comma-separated URLs)
                </label>
                <input
                  type="text"
                  value={formData.images.join(", ")}
                  onChange={(e) => handleImagesChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight || ""}
                    onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                    placeholder="0.00"
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (cm)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Width"
                    value={formData.dimensions.width || ""}
                    onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Height"
                    value={formData.dimensions.height || ""}
                    onChange={(e) => handleDimensionChange("height", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Depth"
                    value={formData.dimensions.depth || ""}
                    onChange={(e) => handleDimensionChange("depth", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Policies</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Policy
                </label>
                <input
                  type="text"
                  value={formData.returnPolicy}
                  onChange={(e) => handleInputChange("returnPolicy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="Return policy details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Information
                </label>
                <input
                  type="text"
                  value={formData.warrantyInformation}
                  onChange={(e) => handleInputChange("warrantyInformation", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="Warranty details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Information
                </label>
                <input
                  type="text"
                  value={formData.shippingInformation}
                  onChange={(e) => handleInputChange("shippingInformation", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="Shipping details"
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                      errors["brand"] ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Product brand"
                  />
                  {errors["brand"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["brand"]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (Auto-generated)
                  </label>
                  <input
                    type="text"
                    value={formData.meta.slug || ""}
                    onChange={(e) => handleInputChange("meta.slug", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                    placeholder="product-slug"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.meta.title || ""}
                  onChange={(e) => handleInputChange("meta.title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="Meta title for SEO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description (Auto-generated)
                </label>
                <textarea
                  value={formData.meta.description || ""}
                  onChange={(e) => handleInputChange("meta.description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="Meta description for SEO"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-theme-color text-white rounded-md hover:bg-theme-color/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    ></circle>
                    <path
                      fill="currentColor"
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {product ? "Updating..." : "Adding..."}
                </span>
              ) : product ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </button>
          </div>
        </form>
  );
}
