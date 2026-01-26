import Container from "@/components/Container";

export default function Loading() {
  return (
    <Container className="py-4 md:py-8">
      {/* Page Header Skeleton */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div>
          <div className="h-10 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-80"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-4 bg-gray-200 rounded w-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      {/* Categories Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md overflow-hidden h-full animate-pulse border border-gray-100"
          >
            {/* Image Skeleton */}
            <div className="h-36 lg:h-44 bg-gray-200"></div>

            {/* Content Skeleton */}
            <div className="p-4 lg:p-5">
              <div className="h-4 lg:h-5 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Skeleton */}
      <div className="mt-12 bg-gradient-to-r from-theme-color/10 to-accent-color/10 rounded-2xl p-8 animate-pulse">
        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded w-80 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-6"></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="h-12 bg-gray-200 rounded-lg w-40"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-40"></div>
          </div>
        </div>
      </div>
    </Container>
  );
}
