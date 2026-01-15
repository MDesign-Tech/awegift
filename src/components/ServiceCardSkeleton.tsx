import { cn } from "@/lib/utils";

interface ServiceCardSkeletonProps {
  className?: string;
}

const ServiceCardSkeleton = ({ className }: ServiceCardSkeletonProps) => {
  return (
    <div className={cn("bg-white rounded-lg shadow-md overflow-hidden animate-pulse", className)}>
      {/* Service Image Skeleton */}
      <div className="aspect-[4/3] bg-gray-200 relative"></div>

      {/* Service Info Skeleton */}
      <div className="p-6 space-y-3">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>

        {/* Description lines */}
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;
