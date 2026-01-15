import { useState, useEffect, useRef } from "react";
import { getData } from "@/app/(user)/helpers";
import { CategoryType } from "../../type";

interface UseCategorySearchProps {
  debounceDelay?: number;
}

interface CategoryWithId extends CategoryType {
  productCount?: number;
}

interface UseCategorySearchReturn {
  search: string;
  setSearch: (value: string) => void;
  categories: CategoryWithId[];
  filteredCategories: CategoryWithId[];
  suggestedCategories: CategoryWithId[];
  isLoading: boolean;
  isInitialLoading: boolean;
  hasSearched: boolean;
  clearSearch: () => void;
  refetchCategories: () => Promise<void>;
}

export const useCategorySearch = ({
  debounceDelay = 300,
}: UseCategorySearchProps = {}): UseCategorySearchReturn => {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CategoryWithId[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithId[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<CategoryWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE_URL = "/api/categories";

  // Function to fetch categories
  const fetchCategories = async () => {
    const endpoint = API_BASE_URL;
    setIsInitialLoading(true);
    try {
      const data = await getData(endpoint);
      setCategories(data || []);
      // Set first 10 categories as suggested/trending categories
      setSuggestedCategories((data || []).slice(0, 10));
    } catch (error) {
      console.error("Error fetching categories", error);
      setCategories([]);
      setSuggestedCategories([]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Fetch all categories on hook initialization (fallback)
  useEffect(() => {
    fetchCategories();
  }, [API_BASE_URL]);

  // Search function using API endpoint
  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredCategories([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Use API search endpoint for better results
      const searchEndpoint = `/api/admin/categories/search?q=${encodeURIComponent(
        searchTerm
      )}&limit=10`;
      const searchData = await getData(searchEndpoint);

      if (Array.isArray(searchData)) {
        setFilteredCategories(searchData);
      } else {
        // Fallback to local filtering if API search fails
        const filtered = categories
          .filter((item: CategoryWithId) =>
            item?.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 10); // Limit results
        setFilteredCategories(filtered);
      }
    } catch (error) {
      console.error("Error performing search", error);
      // Fallback to local filtering on error
      const filtered = categories
        .filter((item: CategoryWithId) =>
          item?.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10); // Limit results
      setFilteredCategories(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle search with debouncing
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(search);
    }, debounceDelay);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, categories, API_BASE_URL, debounceDelay]);

  const clearSearch = () => {
    setSearch("");
    setFilteredCategories([]);
    setHasSearched(false);
  };

  return {
    search,
    setSearch,
    categories,
    filteredCategories,
    suggestedCategories,
    isLoading,
    isInitialLoading,
    hasSearched,
    clearSearch,
    refetchCategories: fetchCategories,
  };
};