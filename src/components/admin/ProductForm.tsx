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

interface ProductFormProps {
  product?: (ProductType & { id?: string }) | null;
  onSubmit: (product: ProductType) => void;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export type ProductType = {
  basicInformation: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  };
  pricing: {
    price: number;
    discountPercentage: number;
    costPrice: number;
  };
  inventory: {
    stock: number;
    minimumOrderQuantity: number;
    availabilityStatus: string;
  };
  media: {
    thumbnail: string;
    images: string[];
  };
  specifications: {
    weight: number;
    dimensions: {
      width: number;
      height: number;
      depth: number;
    };
    color: string;
    material: string;
  };
  policies: {
    returnPolicy: string;
    warrantyInformation: string;
    shippingInformation: string;
  };
  metadata: {
    sku: string;
    barcode: string;
    brand: string;
    qrCode: string
  };
  seo: {
    slug: string;
    metaTitle: string;
    metaDescription: string;
  };
};

export default function ProductForm({ product, onSubmit, onCancel, loading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductType>({
    basicInformation: {
      title: "",
      description: "",
      category: "groceries",
      tags: [],
    },
    pricing: {
      price: 0,
      discountPercentage: 0,
      costPrice: 0,
    },
    inventory: {
      stock: 1,
      minimumOrderQuantity: 1,
      availabilityStatus: "In Stock",
    },
    media: {
      thumbnail: "",
      images: [],
    },
    specifications: {
      weight: 0,
      dimensions: {
        width: 0,
        height: 0,
        depth: 0,
      },
      color: "",
      material: "",
    },
    policies: {
      returnPolicy: "7 days return policy",
      warrantyInformation: "No warranty",
      shippingInformation: "Standard Derivery",
    },
    metadata: {
      sku: "",
      barcode: "",
      brand: "",
      qrCode: ""
    },
    seo: {
      slug: "",
      metaTitle: "",
      metaDescription: "",
    },
  });


  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.basicInformation.title?.trim()) newErrors["basicInformation.title"] = "Title is required";
    if (!formData.basicInformation.description?.trim()) newErrors["basicInformation.description"] = "Description is required";
    if (!formData.pricing.price || formData.pricing.price <= 0) newErrors["pricing.price"] = "Price must be greater than 0";
    if (!formData.basicInformation.category?.trim()) newErrors["basicInformation.category"] = "Category is required";
    if (!formData.metadata.brand?.trim()) newErrors["metadata.brand"] = "Brand is required";
    if (formData.inventory.stock === undefined || formData.inventory.stock < 0) newErrors["inventory.stock"] = "Stock must be 0 or greater";

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
    const keys = field.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      // Auto-generate slug when title changes
      if (field === "basicInformation.title" && value.trim()) {
        newData.seo.slug = generateSlug(value);
      }

      // Auto-generate meta title and description when title or description changes
      if (field === "basicInformation.title" || field === "basicInformation.description") {
        const { metaTitle, metaDescription } = generateMeta(
          field === "basicInformation.title" ? value : newData.basicInformation.title,
          field === "basicInformation.description" ? value : newData.basicInformation.description
        );
        newData.seo.metaTitle = metaTitle;
        newData.seo.metaDescription = metaDescription;
      }

      // Auto-generate SKU when title, category, or brand changes (only for existing products)
      if ((field === "basicInformation.title" || field === "basicInformation.category" || field === "metadata.brand") && product?.id) {
        const skuProduct = {
          category: field === "basicInformation.category" ? value : newData.basicInformation.category,
          brand: field === "metadata.brand" ? value : newData.metadata.brand,
          title: field === "basicInformation.title" ? value : newData.basicInformation.title,
          id: product.id
        };
        newData.metadata.sku = generateSKU(skuProduct);
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
                  value={formData.basicInformation.title}
                  onChange={(e) => handleInputChange("basicInformation.title", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["basicInformation.title"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Product title"
                />
                {errors["basicInformation.title"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["basicInformation.title"]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.basicInformation.description}
                  onChange={(e) => handleInputChange("basicInformation.description", e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["basicInformation.description"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Product description"
                />
                {errors["basicInformation.description"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["basicInformation.description"]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.basicInformation.category}
                    onChange={(e) => handleInputChange("basicInformation.category", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                      errors["basicInformation.category"] ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Product category"
                  />
                  {errors["basicInformation.category"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["basicInformation.category"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.basicInformation.tags.join(", ")}
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
                  value={formData.pricing.price || ""}
                  onChange={(e) => handleInputChange("pricing.price", parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["pricing.price"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors["pricing.price"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["pricing.price"]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricing.discountPercentage || ""}
                  onChange={(e) => handleInputChange("pricing.discountPercentage", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricing.costPrice || ""}
                  onChange={(e) => handleInputChange("pricing.costPrice", parseFloat(e.target.value) || 0)}
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
                  value={formData.inventory.stock || ""}
                  onChange={(e) => handleInputChange("inventory.stock", parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["inventory.stock"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                />
                {errors["inventory.stock"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["inventory.stock"]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  value={formData.inventory.minimumOrderQuantity || ""}
                  onChange={(e) => handleInputChange("inventory.minimumOrderQuantity", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Status
                </label>
                <select
                  value={formData.inventory.availabilityStatus}
                  onChange={(e) => handleInputChange("inventory.availabilityStatus", e.target.value)}
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
                  value={formData.media.thumbnail}
                  onChange={(e) => handleInputChange("media.thumbnail", e.target.value)}
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
                  value={formData.media.images.join(", ")}
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
                    value={formData.specifications.weight || ""}
                    onChange={(e) => handleInputChange("specifications.weight", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.color}
                    onChange={(e) => handleInputChange("specifications.color", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                    placeholder="Product color"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.material}
                    onChange={(e) => handleInputChange("specifications.material", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                    placeholder="Product material"
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
                    value={formData.specifications.dimensions.width || ""}
                    onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Height"
                    value={formData.specifications.dimensions.height || ""}
                    onChange={(e) => handleDimensionChange("height", parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Depth"
                    value={formData.specifications.dimensions.depth || ""}
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
                  value={formData.policies.returnPolicy}
                  onChange={(e) => handleInputChange("policies.returnPolicy", e.target.value)}
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
                  value={formData.policies.warrantyInformation}
                  onChange={(e) => handleInputChange("policies.warrantyInformation", e.target.value)}
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
                  value={formData.policies.shippingInformation}
                  onChange={(e) => handleInputChange("policies.shippingInformation", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="Shipping details"
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  value={formData.metadata.brand}
                  onChange={(e) => handleInputChange("metadata.brand", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
                    errors["metadata.brand"] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Product brand"
                />
                {errors["metadata.brand"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["metadata.brand"]}</p>
                )}
              </div>


              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.metadata.barcode}
                  onChange={(e) => handleInputChange("metadata.barcode", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color"
                  placeholder="Barcode number"
                />
              </div> */}

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
