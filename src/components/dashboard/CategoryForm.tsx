"use client";

import { useState, useEffect } from "react";
import { FiLoader, FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { CategoryType } from "../../../type";
import { CldUploadWidget, CldImage } from 'next-cloudinary';

// Function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

interface CategoryFormProps {
  category?: CategoryType | null;
  onCancel: () => void;
  onSuccess: () => void;
  refetchCategories: () => Promise<void>;
}

export default function CategoryForm({ category, onCancel, onSuccess, refetchCategories }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        image: category.image || "",
      });
    }
  }, [category]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.slug?.trim()) newErrors.slug = "Slug is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = category
        ? `/api/admin/categories/${category.id}`
        : `/api/admin/categories/add`;
      const method = category ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await refetchCategories();
        toast.success(category ? "Category updated successfully!" : "Category added successfully!");
        // Close modal after success message is shown
          onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${category ? 'update' : 'add'} category`);
      }
    } catch (error) {
      console.error(`Error ${category ? 'updating' : 'adding'} category:`, error);
      toast.error(`Error ${category ? 'updating' : 'adding'} category`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when name changes
      ...(field === "name" && !category && { slug: generateSlug(value) }),
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color text-sm sm:text-base ${errors.name ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Category name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color text-sm sm:text-base ${errors.description ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Category description for SEO and UI"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>

            {/* Image Upload */}
            <CldUploadWidget
              uploadPreset="default_unsigned"
              onSuccess={(result: any) => {
                if (result?.info?.secure_url) {
                  handleInputChange("image", result.info.secure_url);
                  toast.success("Category image uploaded successfully!");
                }
              }}
              onError={(error) => {
                console.error("Upload error:", error);
                let errorMessage = "Failed to upload category image";
                if (typeof error === 'object' && error !== null) {
                  errorMessage = (error as any).message || (error as any).statusText || errorMessage;
                } else if (typeof error === 'string') {
                  errorMessage = error;
                }
                toast.error(`Upload failed: ${errorMessage}`);
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
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-theme-color"
                >
                  <FiUpload className="mr-2 h-4 w-4" />
                  Upload Image
                </button>
              )}
            </CldUploadWidget>

            {/* Image Preview */}
            {formData.image && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <div className="relative inline-block">
                  <CldImage
                    src={formData.image}
                    alt="Category Preview"
                    width={120}
                    height={120}
                    className="w-32 h-32 object-cover border rounded-md shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange("image", "")}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    title="Remove image"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-theme-color text-white rounded-md hover:bg-theme-color/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              {category ? "Updating..." : "Adding..."}
            </span>
          ) : category ? (
            "Update Category"
          ) : (
            "Add Category"
          )}
        </button>
      </div>
    </form>
  );
}
