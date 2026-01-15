import Container from "./Container";
import ServiceCardSkeleton from "./ServiceCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface ServicesSectionSkeletonProps {
  title?: string;
  subtitle?: string;
  count?: number;
}

const ServicesSectionSkeleton = ({
  title,
  subtitle,
  count = 8,
}: ServicesSectionSkeletonProps) => {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            {title ? (
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h2>
            ) : (
              <Skeleton className="h-10 w-48 mb-2" />
            )}
            {subtitle ? (
              <p className="text-gray-600 text-sm md:text-base">{subtitle}</p>
            ) : (
              <Skeleton className="h-6 w-80" />
            )}
          </div>
          <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse w-24 h-10"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-center">
          {Array.from({ length: count }).map((_, index) => (
            <ServiceCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ServicesSectionSkeleton;
