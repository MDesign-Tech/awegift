"use client";

import React, { useState, useEffect } from "react";
import ServicesSection from "./ServicesSection";
import ServicesSectionSkeleton from "@/components/ServicesSectionSkeleton";
import Container from "@/components/Container";
import { ServiceType } from "@/../../type";
import { servicesData } from "@/constants/services";

const DynamicServicesSection: React.FC = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        } else {
          // Fallback to static data if API fails
          setServices(servicesData);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        // Fallback to static data
        setServices(servicesData);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <ServicesSectionSkeleton
        title="Our Services"
        subtitle="Discover our comprehensive range of creative and technical services designed to bring your vision to life."
      />
    );
  }

  if (services.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our comprehensive range of creative and technical services designed to bring your vision to life.
            </p>
          </div>
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">
              No services available at the moment.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <ServicesSection
      title="Our Services"
      services={services}
      subtitle="Discover our comprehensive range of creative and technical services designed to bring your vision to life."
      viewMoreLink="/services"
    />
  );
};

export default DynamicServicesSection;