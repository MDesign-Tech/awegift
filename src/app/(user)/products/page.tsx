import Container from "@/components/Container";
import EnhancedProductsSideNav from "@/components/products/EnhancedProductsSideNav";
import { getData } from "../helpers";
import InfiniteProductList from "@/components/products/InfiniteProductList";
import {
  getBestSellers,
  getNewArrivals,
  getOffers,
  searchProducts,
  getProductsByCategory,
} from "../helpers/productHelpers";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    category?: string | string[];
    search?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    min_price?: string;
    max_price?: string;
    color?: string;
    sort?: string;
    page?: string;
  }>;
}




const ProductsPage = async ({ searchParams }: Props) => {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;


  // Fetch all products and categories from local API
  const [productsData, categoriesData] = await Promise.all([
    getData(`/api/products?limit=0`), // Get all products
    getData(`/api/categories`), // Get categories from admin API
  ]);

  let products = productsData.products || [];
  const allProducts = [...products]; // Keep original for filters

  // Extract unique brands from all products
  const uniqueBrands = [
    ...new Set(allProducts.map((product: any) => product.brand)),
  ].sort();

  // Apply filters
  if (params.category) {
    const categories = Array.isArray(params.category) ? params.category : [params.category];
    const specialCategories = ["bestsellers"];
    const regularCategories = categories.filter(cat => !specialCategories.includes(cat));
    const specialCats = categories.filter(cat => specialCategories.includes(cat));

    // Apply special category filters
    specialCats.forEach(cat => {
      switch (cat) {
        case "bestsellers":
          products = getBestSellers(products);
          break;
      }
    });

    // Apply regular category filters - products must match ANY of the selected categories
    if (regularCategories.length > 0) {
      products = products.filter((product: any) =>
        product.categories && product.categories.some((cat: string) =>
          regularCategories.some(selectedCat => selectedCat.toLowerCase() === cat.toLowerCase())
        )
      );
    }
  }

  // Filter by search term
  if (params.search) {
    products = searchProducts(products, params.search);
  }

  // Filter by brand
  if (params.brand) {
    products = products.filter(
      (product: any) =>
        product.brand &&
        product.brand.toLowerCase().includes(params.brand!.toLowerCase())
    );
  }

  // Filter by price range
  if (params.min_price || params.max_price) {
    const minPrice = params.min_price ? parseFloat(params.min_price) : 0;
    const maxPrice = params.max_price ? parseFloat(params.max_price) : Infinity;
    products = products.filter(
      (product: any) => product.price >= minPrice && product.price <= maxPrice
    );
  }

  // Filter by color
  if (params.color) {
    products = products.filter((product: any) => {
      const colorLower = params.color!.toLowerCase();
      // Check in tags
      if (product.tags && Array.isArray(product.tags)) {
        const hasColorInTags = product.tags.some((tag: string) =>
          tag.toLowerCase().includes(colorLower)
        );
        if (hasColorInTags) return true;
      }
      // Check in title
      return product.title.toLowerCase().includes(colorLower);
    });
  }

  // Get the page title based on category
  const getPageTitle = () => {
    if (params.category) {
      const categories = Array.isArray(params.category) ? params.category : [params.category];
      const specialCategories = ["bestsellers"];
      const regularCategories = categories.filter(cat => !specialCategories.includes(cat));

      // If only one special category is selected
      if (categories.length === 1) {
        const singleCategory = categories[0] as string;
        switch (singleCategory) {
          case "bestsellers":
            return "Best Sellers";
          default:
            return `${singleCategory.charAt(0).toUpperCase() + singleCategory.slice(1)} Products`;
        }
      }

      // If multiple categories or regular categories
      if (regularCategories.length > 0) {
        if (regularCategories.length === 1) {
          const singleRegularCategory = regularCategories[0] as string;
          return `${singleRegularCategory.charAt(0).toUpperCase() + singleRegularCategory.slice(1)} Products`;
        } else {
          return "Filtered Products";
        }
      }

      // Multiple special categories
      return "Special Products";
    }
    if (params.search) {
      return `Search Results for "${params.search}"`;
    }
    return "All Products";
  };

  return (
    <Container className="py-4 sm:py-8 px-4 sm:px-6">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          {getPageTitle()}
        </h1>

        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-700">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" className="hover:text-gray-700">
                Products
              </Link>
            </li>
            {(params.category && (Array.isArray(params.category) ? params.category.length > 0 : params.category.trim() !== "")) && (
              <>
                <li>/</li>
                <li className="text-gray-900 font-medium">{getPageTitle()}</li>
              </>
            )}
          </ol>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-1/5 order-1 lg:order-1">
          <EnhancedProductsSideNav
            categories={categoriesData}
            brands={uniqueBrands}
            allProducts={allProducts}
          />
        </div>

        {/* Products Section */}
        <div className="flex-1 min-w-0 order-2 lg:order-2">
          <InfiniteProductList
            products={products}
            currentSort={params.sort || "default"}
          />
        </div>
      </div>
    </Container>
  );
};

export default ProductsPage;

