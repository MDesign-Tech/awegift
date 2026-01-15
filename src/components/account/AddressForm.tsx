"use client";

import React, { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { Address } from "../../../type";

interface AddressFormProps {
  address?: Address;
  onSubmit: (address: Address) => void;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
  showSetDefault?: boolean;
}

export default function AddressForm({
  address,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
  showSetDefault = true,
}: AddressFormProps) {
  const [formData, setFormData] = useState<Address>({
    address: "",
    isDefault: false,
    ...address,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : false;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-color ${
            errors.address ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Gikondo, mereze"
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>

      {/* Set as Default - Only show for new addresses or when there are multiple addresses */}
      {!isEdit && showSetDefault && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleInputChange}
              className="mr-2 h-4 w-4 text-theme-color focus:ring-theme-color border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              Set as default address
            </span>
          </label>
        </div>
      )}

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
              <FiLoader className="animate-spin mr-2 h-4 w-4" />
              {isEdit ? "Updating..." : "Adding..."}
            </span>
          ) : isEdit ? (
            "Update Address"
          ) : (
            "Add Address"
          )}
        </button>
      </div>
    </form>
  );
}
