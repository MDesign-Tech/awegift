"use client";

import { useState, useEffect } from "react";
import { FiLoader } from "react-icons/fi";
import { ProductType } from "../../../type";

const generateSKU = (product: { category: string; brand: string; title: string; id: string | number }) => {
  const { category, brand, title, id } = product;
  const catCode = category.substring(0, 3).toUpperCase();
  const brandCode = brand.substring(0, 3).toUpperCase();
  const productCode = title.substring(0, 3).toUpperCase();
  const uniqueId = id.toString().padStart(3, '0');
  return `${catCode}-${brandCode}-${productCode}-${uniqueId}`;
};

interface ProductFormProps {
  product?: ProductType | null;
  onSubmit: (product: ProductType) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, loading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductType>({
    id: 0,
    title: "",
    description: "",
    category: "",
    price: 0,
    discountPercentage: 0,
    stock: 0,
    brand: "M Design",
    sku: "",
    weight: 0,
    dimensions: { width: 0, height: 0, depth: 0 },
    warrantyInformation: "1 year warranty",
    shippingInformation: "Ships in 3-5 business days",
    availabilityStatus: "In Stock",
    returnPolicy: "30 days return policy",
    minimumOrderQuantity: 1,
    tags: [],
    images: [],
    thumbnail: "",
    meta: { createdAt: "", updatedAt: "", barcode: "", qrCode: "" },
  });

  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  const [imageInput, setImageInput] = useState("");


  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fill form if editing
  useEffect(() => {
    if (product) setFormData(product);
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Price must be greater than 0";
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (formData.stock < 0) newErrors.stock = "Stock must be 0 or greater";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      // Auto-generate SKU if product exists
      if ((field === "title" || field === "category" || field === "brand") && product?.id) {
        newData.sku = generateSKU({
          category: newData.category,
          brand: newData.brand,
          title: newData.title,
          id: product.id,
        });
      }

      return newData;
    });

    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleArrayChange = (field: keyof ProductType, value: string) => {
    const arr = value.split(',').map(v => v.trim()).filter(Boolean);
    handleInputChange(field as string, arr);
  };

  const handleDimensionChange = (dim: keyof ProductType['dimensions'], value: number) => {
    handleInputChange(`dimensions.${dim}`, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color ${errors.title ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color ${errors.description ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Brand *</label>
        <input
          type="text"
          value={formData.brand}
          onChange={(e) => handleInputChange("brand", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color ${errors.brand ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.brand && <p className="text-red-500 text-sm">{errors.brand}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Category *</label>
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
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color ${errors.category ? "border-red-500" : "border-gray-300"}`}
        >
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
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
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color mt-2"
            placeholder="Enter custom category"
          />
        )}
        {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
      </div>

      {/* Price & Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Price *</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color ${errors.price ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount %</label>
          <input
            type="number"
            step="0.01"
            value={formData.discountPercentage}
            onChange={(e) => handleInputChange("discountPercentage", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
          />
        </div>
      </div>

      {/* Stock & Availability */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Stock *</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => handleInputChange("stock", parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color ${errors.stock ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.stock && <p className="text-red-500 text-sm">{errors.stock}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Minimum Order Quantity</label>
          <input
            type="number"
            value={formData.minimumOrderQuantity}
            onChange={(e) => handleInputChange("minimumOrderQuantity", parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Availability Status</label>
        <select
          value={formData.availabilityStatus}
          onChange={(e) => handleInputChange("availabilityStatus", e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
        >
          <option value="In Stock">In Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Low Stock">Low Stock</option>
        </select>
      </div>

      {/* TAGS INPUT */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Tags</label>

        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <input
          type="text"
          value={tagInput}
          onChange={(e) => {
            const val = e.target.value;

            // Comma detected → add tag
            if (val.includes(",")) {
              const parts = val.split(",").map(t => t.trim()).filter(Boolean);
              const newTags = [...formData.tags, ...parts];

              // remove duplicates
              const unique = [...new Set(newTags)];

              handleInputChange("tags", unique);
              setTagInput("");
            } else {
              setTagInput(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (tagInput.trim() !== "") {
                const newTags = [...formData.tags, tagInput.trim()];
                handleInputChange("tags", [...new Set(newTags)]);
                setTagInput("");
              }
            }
          }}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Type tag and press comma or enter"
        />
      </div>


      {/* Dimensions & Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions & Weight</label>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
            />
          </div>
          {(['width', 'height', 'depth'] as (keyof ProductType['dimensions'])[]).map(d => (
            <div key={d}>
              <label className="block text-xs text-gray-600">{d.charAt(0).toUpperCase() + d.slice(1)}</label>
              <input
                type="number"
                step="0.01"
                value={formData.dimensions[d]}
                onChange={(e) => handleDimensionChange(d, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Media */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
        <input
          type="url"
          value={formData.thumbnail}
          onChange={(e) => handleInputChange("thumbnail", e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
          placeholder="https://example.com/image.jpg"
        />
        {formData.thumbnail && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Preview:</p>
            <img
              src={formData.thumbnail}
              alt="Thumbnail Preview"
              className="w-32 h-32 object-cover border rounded-md shadow-sm"
            />
          </div>
        )}

      </div>

      {/* IMAGES INPUT */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Images</label>

        <textarea
          value={imageInput}
          onChange={(e) => setImageInput(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Paste image URLs separated by commas"
        />

        <button
          type="button"
          onClick={() => {
            if (!imageInput.trim()) return;

            const urls = imageInput
              .split(",")
              .map(u => u.trim())
              .filter(u => u.startsWith("http") && u.length > 5);

            const merged = [...formData.images, ...urls];
            const unique = [...new Set(merged)];

            handleInputChange("images", unique);
            setImageInput("");
          }}
          className="mt-2 px-4 py-2 bg-theme-color text-white rounded-md"
        >
          Add Images
        </button>

        {/* Preview Grid */}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {formData.images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} className="w-full h-24 object-cover rounded-md border" />

                <button
                  type="button"
                  onClick={() => {
                    const filtered = formData.images.filter((_, index) => index !== i);
                    handleInputChange("images", filtered);
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Policies */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Return Policy</label>
        <input
          type="text"
          value={formData.returnPolicy}
          onChange={(e) => handleInputChange("returnPolicy", e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Warranty Information</label>
        <input
          type="text"
          value={formData.warrantyInformation}
          onChange={(e) => handleInputChange("warrantyInformation", e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Shipping Information</label>
        <input
          type="text"
          value={formData.shippingInformation}
          onChange={(e) => handleInputChange("shippingInformation", e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-theme-color text-white rounded-md disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : product ? "Update Product" : "Add Product"}
        </button>
      </div>
    </form>
  );
}
