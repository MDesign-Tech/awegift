const CategorySectionSkeleton = ({ title, subtitle }: { title?: string; subtitle?: string }) => {
  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {title || "Loading..."}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-sm md:text-base">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="relative mb-3 border border-gray-200 rounded-lg aspect-[4/3] bg-gray-200 shadow-md">
              <div className="absolute top-2 right-2 bg-gray-300 text-xs px-2 py-1 rounded-full">
                <div className="w-6 h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="text-center space-y-1 px-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySectionSkeleton;