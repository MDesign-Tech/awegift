"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProductType } from "../../type";

interface UseInfiniteProductsReturn {
  products: ProductType[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  reset: () => void;
  refetch: () => Promise<void>;
}

export const useInfiniteProducts = (
  apiEndpoint: string = "/api/admin/products",
  initialLimit: number = 20,
  searchQuery?: string,
  categoryFilter?: string
): UseInfiniteProductsReturn => {
  const router = useRouter();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const fetchProducts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        offsetRef.current = 0;
      }

      const params = new URLSearchParams({
        limit: initialLimit.toString(),
        offset: isLoadMore ? offsetRef.current.toString() : '0'
      });

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      if (categoryFilter) {
        params.append('category', categoryFilter);
      }

      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      // Check for unauthorized error
      if (data.error === "Unauthorized") {
        router.push("/auth/signin");
        return;
      }

      const newProducts = data.products || [];

      if (isLoadMore) {
        setProducts(prev => [...prev, ...newProducts]);
        offsetRef.current += initialLimit;
      } else {
        setProducts(newProducts);
        offsetRef.current = initialLimit;
      }

      setHasMore(data.hasMore === true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiEndpoint, initialLimit, searchQuery, categoryFilter]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchProducts(true);
    }
  }, [fetchProducts, loadingMore, hasMore, loading]);

  const reset = useCallback(async () => {
    setProducts([]);
    offsetRef.current = 0;
    setHasMore(true);
    setError(null);
    await fetchProducts(false);
  }, [fetchProducts]);

  const refetch = useCallback(async () => {
    await reset();
  }, [reset]);

  // Initial load
  useEffect(() => {
    fetchProducts(false);
  }, [fetchProducts]);

  // Reset when search or category changes
  useEffect(() => {
    reset();
  }, [searchQuery, categoryFilter, reset]);

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reset,
    refetch
  };
};

// Original scroll detection hook
export const useInfiniteScroll = (
  callback: () => void,
  hasMore: boolean,
  loading: boolean,
  containerRef?: React.RefObject<HTMLElement | null>
) => {
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const element = containerRef?.current || document.documentElement;
      const { scrollTop, scrollHeight, clientHeight } = element;

      // Trigger when user is 200px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        callback();
      }
    };

    const element = containerRef?.current || window;
    const throttledHandleScroll = throttle(handleScroll, 200);
    element.addEventListener("scroll", throttledHandleScroll);

    return () => {
      element.removeEventListener("scroll", throttledHandleScroll);
    };
  }, [callback, hasMore, loading, containerRef]);
};

// Throttle function to limit scroll event frequency
function throttle(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: any[]) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}
