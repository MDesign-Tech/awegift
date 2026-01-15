"use client";

import ServiceCard from "../../ServicesCard";
import { ServiceType } from "@/../../type";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Container from "@/components/Container";

interface ServicesSectionProps {
  title: string;
  services: ServiceType[];
  viewMoreLink?: string;
  subtitle?: string;
  showViewMore?: boolean;
}

const ServicesSection = ({
  title,
  services,
  viewMoreLink = "/services",
  subtitle,
  showViewMore = true,
}: ServicesSectionProps) => {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white">
      <Container className="py-4 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 text-sm md:text-base">{subtitle}</p>
            )}
          </div>
          {showViewMore && (
            <Link href={viewMoreLink}>
              <Button
                variant="outline"
                size="md"
                className="transition-all duration-300"
              >
                Go to page
              </Button>
            </Link>
          )}
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-center">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">
              No services available at the moment.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
};

export default ServicesSection;
