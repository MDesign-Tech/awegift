"use client";

import { useState, useEffect } from "react";
import { FiLoader } from "react-icons/fi";
import { CategoryType } from "../../../type";

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
  onSubmit: (category: Omit<CategoryType, 'id' | 'meta'>) => void;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export default function CategoryForm({ category, onSubmit, onCancel, loading = false }: CategoryFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${errors.name ? "border-red-500" : "border-gray-300"
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${errors.description ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Category description for SEO and UI"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>

            <input
              type="url"
              value={formData.image}
              onChange={(e) => handleInputChange("image", e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-theme-color"
              placeholder="https://example.com/image.jpg"
            />

            {formData.image && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <img
                  src={formData.image}
                  alt="Thumbnail Preview"
                  className="w-32 h-32 object-cover border rounded-md shadow-sm"
                />
              </div>
            )}
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
