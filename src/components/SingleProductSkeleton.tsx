const SingleProductSkeleton = () => {
  return (
    <div className="flex flex-col gap-10 py-10 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Product Image Skeleton */}
        <div className="space-y-4">
          <div className="bg-gray-200 rounded-lg h-96 w-full"></div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-gray-200 rounded h-20 w-20"></div>
            ))}
          </div>
        </div>

        {/* Product Details Skeleton */}
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="bg-gray-200 rounded h-8 w-3/4"></div>

          {/* Price and Rating */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="bg-gray-200 rounded h-6 w-24"></div>
              <div className="bg-gray-200 rounded h-4 w-16"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gray-200 rounded h-4 w-20"></div>
              <div className="bg-gray-200 rounded h-4 w-16"></div>
            </div>
          </div>

          {/* View count */}
          <div className="bg-gray-200 rounded h-4 w-48"></div>

          {/* Savings */}
          <div className="bg-gray-200 rounded h-4 w-40"></div>

          {/* Description */}
          <div className="space-y-2">
            <div className="bg-gray-200 rounded h-4 w-full"></div>
            <div className="bg-gray-200 rounded h-4 w-5/6"></div>
            <div className="bg-gray-200 rounded h-4 w-4/5"></div>
            <div className="bg-gray-200 rounded h-4 w-3/4"></div>
          </div>

          {/* Brand, Category, Tags */}
          <div className="space-y-2">
            <div className="bg-gray-200 rounded h-4 w-32"></div>
            <div className="bg-gray-200 rounded h-4 w-28"></div>
            <div className="bg-gray-200 rounded h-4 w-48"></div>
          </div>

          {/* Add to Cart Button */}
          <div className="bg-gray-200 rounded-md h-12 w-full"></div>

          {/* Payment Security */}
          <div className="bg-gray-100 p-5 rounded-md">
            <div className="bg-gray-200 rounded h-16 w-full mb-2"></div>
            <div className="bg-gray-200 rounded h-4 w-48 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Product Specifications Skeleton */}
      <div className="w-full p-10 bg-gray-50">
        <div className="bg-gray-200 rounded h-6 w-32 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-gray-200 rounded h-4 w-24"></div>
              <div className="bg-gray-200 rounded h-4 w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SingleProductSkeleton;
