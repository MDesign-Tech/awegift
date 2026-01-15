"use client";

import { useState, useEffect } from "react";
import { FiLoader, FiX, FiUpload, FiTrash2, FiPlus } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { ProductType } from "../../../type";
import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { getCurrencySymbol } from "@/lib/currency";

const generateSKU = (product: { categories: string[]; brand: string; title: string; id: string | number }) => {
  const { categories, brand, title, id } = product;
  const catCode = (categories && categories.length > 0) ? categories[0].substring(0, 3).toUpperCase() : 'GEN';
  const brandCode = (brand || '').substring(0, 3).toUpperCase() || 'BRD';
  const productCode = (title || '').substring(0, 3).toUpperCase() || 'PRD';
  const uniqueId = id.toString().padStart(3, '0');
  return `${catCode}-${brandCode}-${productCode}-${uniqueId}`;
};

interface ProductFormProps {
  product?: ProductType | null;
  onCancel: () => void;
  onSuccess: () => void;
  refetchProducts: () => Promise<void>;
}

export default function ProductForm({ product, onCancel, onSuccess, refetchProducts }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductType>({
    id: "",
    title: "M Design",
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rem dolores, quo soluta sit ea ratione eligendi neque suscipit sequi, veniam id, nostrum amet? Officia dolorem, adipisci velit error natus maxime sed, provident eum assumenda eaque perspiciatis. Sit culpa quaerat vero minus. Necessitatibus sapiente, sed dolor cumque magnam quam perferendis dolorem.",
    categories: [],
    price: 1,
    discount: 1,
    stock: 1,
    brand: "M Design",
    sku: "",
    weight: 1,
    dimensions: { width: 1, height: 1 },
    warrantyInformation: "1 year warranty",
    returnPolicy: "30 days return policy",
    minimumOrderQuantity: 3,
    tags: [],
    colors: [],
    reviews: [],
    rating: 1,
    images: [],
    thumbnail: "",
    currency: "RWF",
    isActive: true,
    isFeatured: false,
    meta: { createdAt: "", updatedAt: "", barcode: "", qrCode: "" },
  });

  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });
  const [addingCategory, setAddingCategory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingThumbnail, setDeletingThumbnail] = useState(false);




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
      } finally {
        setCategoriesLoading(false);
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
    if (!formData.categories || formData.categories.length === 0) newErrors.category = "At least one category is required";
    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (formData.stock < 0) newErrors.stock = "Stock must be 0 or greater";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToFirstError = () => {
    // Find the first error field and scroll to it
    const errorFields = ['title', 'description', 'brand', 'category', 'price', 'stock'];
    for (const field of errorFields) {
      if (errors[field]) {
        const element = document.getElementById(field) as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
          break;
        }
      }
    }
  };


  const handleDeleteImage = async (url: string) => {
    setDeletingId(url);
    try {
      const public_id = url.split("/").pop()?.split(".")[0]; // optional: extract public_id from URL
      const response = await fetch("/api/cloudinary/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter(img => img !== url)
        }));
        toast.success("Image deleted successfully!");
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete image: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Error deleting image. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };


  const handleDeleteThumbnail = async () => {
    setDeletingThumbnail(true);
    try {
      const public_id = formData.thumbnail.split("/").pop()?.split(".")[0];
      const response = await fetch("/api/cloudinary/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      if (response.ok) {
        handleInputChange("thumbnail", "");
        toast.success("Thumbnail deleted successfully!");
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete thumbnail: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting thumbnail:", error);
      toast.error("Error deleting thumbnail. Please try again.");
    } finally {
      setDeletingThumbnail(false);
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

      // Auto-generate SKU if product exists
      if ((field === "title" || field === "categories" || field === "brand") && product?.id) {
        newData.sku = generateSKU({
          categories: newData.categories,
          brand: newData.brand,
          title: newData.title,
          id: product.id,
        });
      }

      return newData;
    });

    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleDimensionChange = (dim: keyof ProductType['dimensions'], value: number) => {
    handleInputChange(`dimensions.${dim}`, value);
  };

  const handleCategoryFormChange = (field: string, value: string) => {
    setCategoryFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when name changes
      ...(field === "name" && { slug: value.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') }),
    }));
  };

  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim() || !categoryFormData.description.trim()) {
      toast.error("Category name and description are required");
      return;
    }

    setAddingCategory(true);
    try {
      const response = await fetch("/api/admin/categories/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        const newCategory = await response.json();
        toast.success("Category added successfully!");

        // Refresh categories list
        const categoriesRes = await fetch("/api/admin/categories");
        if (categoriesRes.ok) {
          const updatedCategories = await categoriesRes.json();
          setCategories(updatedCategories);
          setCategoriesLoading(false);
        }

        // Auto-select the new category
        handleInputChange("categories", [...formData.categories, newCategory.name]);

        // Hide the form and reset
        setShowAddCategoryForm(false);
        setCategoryFormData({ name: "", slug: "", description: "", image: "" });
      } else {
        const errorData = await response.json();
if (response.status === 401 && errorData.code === 'USER_DELETED') {
  toast.error('Account deleted');
}
 toast.error(errorData.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Error adding category");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to first error after a brief delay to allow DOM updates
      setTimeout(() => scrollToFirstError(), 100);
      return;
    }

    setLoading(true);
    try {
      const url = product
        ? `/api/admin/products/${String(product.id)}`
        : `/api/admin/products/add`;
      const method = product ? "PUT" : "POST";

      // Exclude id and meta fields as they are handled by the backend
      const { id, meta, ...dataToSend } = formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        await refetchProducts();
        toast.success(product ? "Product updated successfully!" : "Product added successfully!");
        onSuccess();

      } else {
        const errorData = await response.json();
        if (response.status === 404 && errorData.error === "Product not found") {
          toast.error("This product no longer exists. Please refresh the page.");
        } else {
          toast.error(errorData.error || `Failed to ${product ? 'update' : 'add'} product`);
        }
      }
    } catch (error) {
      console.error(`Error ${product ? 'updating' : 'adding'} product:`, error);
      toast.error(`Error ${product ? 'updating' : 'adding'} product`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color text-sm sm:text-base ${errors.title ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color text-sm sm:text-base ${errors.description ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
        <input
          id="brand"
          type="text"
          value={formData.brand}
          onChange={(e) => handleInputChange("brand", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color text-sm sm:text-base ${errors.brand ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.brand && <p className="text-red-500 text-sm">{errors.brand}</p>}
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categories *</label>
        <div className="space-y-2">
          {categoriesLoading ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : (
            categories.map(cat => (
              <label key={cat.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.categories.includes(cat.name)}
                  onChange={(e) => {
                    const categoryName = cat.name;
                    const newCategories = e.target.checked
                      ? [...formData.categories, categoryName]
                      : formData.categories.filter(c => c !== categoryName);
                    handleInputChange("categories", newCategories);
                  }}
                  className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color"
                />
                <span className="ml-2 text-sm text-gray-900">{cat.name}</span>
              </label>
            ))
          )}
          <button
            type="button"
            onClick={() => setShowAddCategoryForm(true)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-theme-color text-sm"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add New Category
          </button>
        </div>

        {showAddCategoryForm && (
          <div className="mt-4 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-base sm:text-md font-medium text-gray-900 mb-3">Add New Category</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => handleCategoryFormChange("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color border-gray-300 text-sm sm:text-base"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => handleCategoryFormChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color border-gray-300 text-sm sm:text-base"
                  placeholder="Category description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Image
                </label>
                <CldUploadWidget
                  uploadPreset="default_unsigned"
                  onSuccess={(result: any) => {
                    if (result?.info?.secure_url) {
                      setCategoryFormData(prev => ({ ...prev, image: result.info.secure_url }));
                      toast.success("Category image uploaded!");
                    }
                  }}
                  onError={(error) => {
                    console.error("Upload error:", error);
                    toast.error("Failed to upload category image");
                  }}
                  options={{
                    maxFiles: 1,
                    resourceType: "image",
                    folder: "categories"
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-theme-color text-sm"
                    >
                      <FiUpload className="mr-2 h-4 w-4" />
                      Upload Image
                    </button>
                  )}
                </CldUploadWidget>
                {categoryFormData.image && (
                  <div className="mt-2">
                    <CldImage
                      src={categoryFormData.image}
                      alt="Category preview"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover border rounded-md"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addingCategory}
                  className="w-full sm:w-auto px-4 py-2 bg-theme-color text-white rounded-md hover:bg-theme-color/90 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
                >
                  {addingCategory ? (
                    <>
                      <FiLoader className="animate-spin mr-2 h-4 w-4" />
                      Adding...
                    </>
                  ) : (
                    "Add Category"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryForm(false);
                    setCategoryFormData({ name: "", slug: "", description: "", image: "" });
                  }}
                  disabled={!product}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
      </div>

      {/* Price & Discount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price ({getCurrencySymbol("RWF")}) *</label>
          <input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color text-sm sm:text-base ${errors.price ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Discount (RWF)</label>
          <input
            type="number"
            step="0.01"
            value={formData.discount}
            onChange={(e) => handleInputChange("discount", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color text-sm sm:text-base border-gray-300"
          />
        </div>
      </div>

      {/* Stock & Availability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
          <input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => handleInputChange("stock", parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color text-sm sm:text-base ${errors.stock ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.stock && <p className="text-red-500 text-sm">{errors.stock}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Quantity</label>
          <input
            type="number"
            value={formData.minimumOrderQuantity}
            onChange={(e) => handleInputChange("minimumOrderQuantity", parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color text-sm sm:text-base border-gray-300"
          />
        </div>
      </div>


      {/* TAGS INPUT */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Tags</label>

        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-theme-color/10 text-theme-color rounded-full group hover:bg-theme-color/20 transition-colors"
            >
              {tag}
              <button
                type="button"
                onClick={() => {
                  const newTags = formData.tags.filter((_, index) => index !== i);
                  handleInputChange("tags", newTags);
                }}
                className="ml-1 hover:bg-theme-color/30 rounded-full p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                title={`Remove ${tag}`}
              >
                <FiX className="h-3 w-3" />
              </button>
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

      {/* COLORS INPUT */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Colors</label>

        <div className="flex flex-wrap gap-2 mb-2">
          {formData.colors.map((color, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full group hover:bg-green-200 transition-colors"
            >
              {color}
              <button
                type="button"
                onClick={() => {
                  const newColors = formData.colors.filter((_, index) => index !== i);
                  handleInputChange("colors", newColors);
                }}
                className="ml-1 hover:bg-green-300 rounded-full p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                title={`Remove ${color}`}
              >
                <FiX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <input
          type="text"
          value={colorInput}
          onChange={(e) => {
            const val = e.target.value;

            // Comma detected → add color
            if (val.includes(",")) {
              const parts = val.split(",").map(c => c.trim()).filter(Boolean);
              const newColors = [...formData.colors, ...parts];

              // remove duplicates
              const unique = [...new Set(newColors)];

              handleInputChange("colors", unique);
              setColorInput("");
            } else {
              setColorInput(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (colorInput.trim() !== "") {
                const newColors = [...formData.colors, colorInput.trim()];
                handleInputChange("colors", [...new Set(newColors)]);
                setColorInput("");
              }
            }
          }}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Type color and press comma or enter"
        />
      </div>

      {/* Dimensions & Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions & Weight</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
            />
          </div>
          {(['width', 'height'] as (keyof ProductType['dimensions'])[]).map(d => (
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


      {/* IMAGES UPLOAD */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>

        {/* Images Upload */}
        <div className="mb-4">
          <CldUploadWidget
            uploadPreset="default_unsigned"
            onSuccess={(result: any) => {
              try {
                if (result?.info?.secure_url) {
                  // Use functional update to ensure we have the latest state
                  setFormData(prevFormData => {
                    const newImages = [...prevFormData.images, result.info.secure_url];
                    // Remove duplicates in case of race conditions
                    const uniqueImages = [...new Set(newImages)];
                    const updatedFormData = {
                      ...prevFormData,
                      images: uniqueImages
                    };
                    // Set first image as thumbnail if no thumbnail is set
                    if (!prevFormData.thumbnail && uniqueImages.length === 1) {
                      updatedFormData.thumbnail = result.info.secure_url;
                    }
                    return updatedFormData;
                  });
                  toast.success("Image uploaded successfully!");
                } else {
                  console.error("Upload result missing secure_url:", result);
                  toast.error("Upload failed: Invalid response");
                }
              } catch (error) {
                console.error("Error processing upload result:", error);
                toast.error("Upload failed: Processing error");
              }
            }}
            onError={(error) => {
              console.error("Upload error:", error);
              let errorMessage = "Failed to upload image";
              if (typeof error === 'object' && error !== null) {
                errorMessage = (error as any).message || (error as any).statusText || errorMessage;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }
              toast.error(`Upload failed: ${errorMessage}`);
            }}
            onClose={() => {
              // Reset uploading state when widget closes
              setUploadingImages(false);
            }}
            options={{
              // maxFiles: 10 - formData.images.length, // Adjust max files based on existing images
              resourceType: "image",
              folder: "products/gallery",
              maxFileSize: 10000000, // 10MB limit
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => {
                 
                  setUploadingImages(true);
                  open();
                }}
                disabled={uploadingImages}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-theme-color disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImages ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-4 w-4" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload className="mr-2 h-4 w-4" />
                    Upload Images ({formData.images.length})
                  </>
                )}
              </button>
            )}
          </CldUploadWidget>
        </div>

        {/* Images Preview Grid */}
        {formData.images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Product Images ({formData.images.length})
              {uploadingImages && (
                <span className="ml-2 text-theme-color text-xs">(Uploading...)</span>
              )}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.images.map((img, i) => (
                <div key={`${img}-${i}`} className="relative group">
                  <CldImage
                    src={img}
                    alt={`Product image ${i + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover border rounded-md shadow-sm"
                  />
                  {/* Radio button for thumbnail selection */}
                  <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded px-2 py-1">
                    <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="thumbnail"
                        checked={formData.thumbnail === img}
                        onChange={() => handleInputChange("thumbnail", img)}
                        className="mr-1 w-3 h-3 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color"
                      />
                      Set as thumbnail
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img)}
                    disabled={deletingId === img}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-700 hover:scale-110"
                    title="Remove image"
                  >
                    {deletingId === img ? (
                      <FiLoader className="animate-spin h-3 w-3" />
                    ) : (
                      <FiX className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}

            </div>
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

      {/* STATUSES */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Statuses</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange("isActive", e.target.checked)}
              className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => handleInputChange("isFeatured", e.target.checked)}
              className="w-4 h-4 text-theme-color bg-gray-100 border-gray-300 focus:ring-theme-color focus:ring-2 accent-theme-color"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Featured</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || addingCategory}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-theme-color text-white rounded-md disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
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




