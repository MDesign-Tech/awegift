import Container from "@/components/Container";
import Title from "@/components/Title";
import { Metadata } from "next";
import {
  FaTruck,
  FaShieldAlt,
  FaHeadset,
  FaUndo,
  FaCreditCard,
  FaGift,
  FaBox,
  FaLeaf,
} from "react-icons/fa";
import RevealOnScroll from "@/components/RevealOnScroll";
// using external Unsplash links for service images (rendered with <img>)

export const metadata: Metadata = {
  title: "Our Services - AweGift",
  description:
    "Discover AweGift's premium services including fast delivery, secure payments, and exceptional customer support",
};

interface Service {
  id: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  alt?: string;
  features: string[];
}

const services: Service[] = [
  {
    id: 1,
    title: "Graphic Design & Brand Builder",
    description:
      "Full branding packages: logos, visual identity, and brand guidelines to make your business stand out.",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    alt: "Graphic design",
    features: [
      "Logo & identity",
      "Brand strategy",
      "Marketing collaterals",
      "Packaging design",
    ],
  },
  {
    id: 2,
    title: "Branding & Signage Installation",
    description:
      "End-to-end signage solutions including design, fabrication and professional installation.",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    alt: "Signage",
    features: [
      "Shopfront signage",
      "Vehicle branding",
      "Wayfinding systems",
      "Installation service",
    ],
  },
  {
    id: 3,
    title: "Event & Wedding Decor & Planning",
    description:
      "Personalized event planning and decor services to bring your vision to life for weddings and events.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    alt: "Event decor",
    features: [
      "Full event planning",
      "Themed decor",
      "Floral design",
      "Vendor coordination",
    ],
  },
  {
    id: 4,
    title: "Tech Savvy (Web & App Dev)",
    description:
      "Modern web and mobile app development, from MVPs to production-ready platforms.",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    alt: "Web and app development",
    features: [
      "Responsive websites",
      "Mobile apps",
      "E-commerce",
      "Maintenance & support",
    ],
  },
  {
    id: 5,
    title: "Photography & Videography",
    description:
      "Professional photo and video production for products, events, and marketing campaigns.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    alt: "Photography and videography",
    features: [
      "Product shoots",
      "Event coverage",
      "Promo videos",
      "Post-production",
    ],
  },
];

export default function ServicesPage() {
  return (
    <Container className="py-10 lg:py-20 lg:pt-0">
      <div className="max-w-6xl mx-auto">
        {/* Hero (clean) */}
        <section className="relative mb-12">
          <div className="relative rounded-lg overflow-hidden bg-transparent px-6 py-20 lg:py-28 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 text-orange-500">
              OUR SERVICES
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-light-text">
              Creative, technical and production services crafted to help your
              brand stand out — from identity to experiences and digital
              products.
            </p>
          </div>
        </section>

        {/* Alternating Service Sections */}
        <div className="space-y-12 mb-16">
          {services.map((service, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <RevealOnScroll key={service.id} className="w-full">
                <section
                  className={`flex flex-col lg:flex-row items-center gap-6 lg:gap-12 ${
                    isEven ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className="w-full lg:w-1/2 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500">
                    {service.image && (
                      <div className="relative w-full h-64 lg:h-96 overflow-hidden group/img">
                        <img
                          src={service.image}
                          alt={service.alt || service.title}
                          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover/img:scale-125 group-hover/img:brightness-110 will-change-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent group-hover/img:from-black/20 transition-all duration-500" />
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-1/2">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 transition-colors duration-300 group-hover:text-orange-500">
                      {service.title}
                    </h3>
                    <p className="text-light-text mb-4">
                      {service.description}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-theme-color rounded-full mt-1 flex-shrink-0" />
                          <span className="text-light-text">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* Why Choose Us Section */}
        <section className="bg-gradient-to-r from-theme-color/10 to-theme-color/5 rounded-lg p-8 lg:p-12 mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold text-center text-gray-800 mb-8">
              Why Choose AweGift?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-5 h-5 bg-theme-color rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Customer-First Approach
                  </h3>
                  <p className="text-light-text">
                    Your satisfaction is our top priority. We go the extra mile
                    to ensure every customer has an excellent experience.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-5 h-5 bg-theme-color rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Competitive Pricing
                  </h3>
                  <p className="text-light-text">
                    Quality products at affordable prices with regular special
                    offers and discounts.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-5 h-5 bg-theme-color rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Reliable & Trustworthy
                  </h3>
                  <p className="text-light-text">
                    Years of experience and thousands of satisfied customers
                    make us a trusted choice.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-5 h-5 bg-theme-color rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Continuous Improvement
                  </h3>
                  <p className="text-light-text">
                    We constantly upgrade our services based on customer
                    feedback and market trends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-gray-800 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-4 max-w-3xl mx-auto">
            <details className="bg-light-bg rounded-lg p-6 cursor-pointer border border-border-color">
              <summary className="font-semibold text-gray-800 flex justify-between items-center">
                How quickly can I expect my order?
                <span className="ml-4">+</span>
              </summary>
              <p className="text-light-text mt-4">
                Most orders are delivered within 3-7 business days depending on
                your location. We offer express delivery options for urgent
                orders.
              </p>
            </details>

            <details className="bg-light-bg rounded-lg p-6 cursor-pointer border border-border-color">
              <summary className="font-semibold text-gray-800 flex justify-between items-center">
                What is your return policy?
                <span className="ml-4">+</span>
              </summary>
              <p className="text-light-text mt-4">
                We offer a 30-day return policy for most items. If you're not
                satisfied with your purchase, simply contact our support team to
                initiate a return.
              </p>
            </details>

            <details className="bg-light-bg rounded-lg p-6 cursor-pointer border border-border-color">
              <summary className="font-semibold text-gray-800 flex justify-between items-center">
                How can I contact customer support?
                <span className="ml-4">+</span>
              </summary>
              <p className="text-light-text mt-4">
                You can reach us via live chat, email, WhatsApp, or phone. Our
                support team is available 24/7 to assist you.
              </p>
            </details>

            <details className="bg-light-bg rounded-lg p-6 cursor-pointer border border-border-color">
              <summary className="font-semibold text-gray-800 flex justify-between items-center">
                Are my payments secure?
                <span className="ml-4">+</span>
              </summary>
              <p className="text-light-text mt-4">
                Yes, we use industry-leading SSL encryption and Stripe payment
                processing to ensure all your transactions are completely
                secure.
              </p>
            </details>

            <details className="bg-light-bg rounded-lg p-6 cursor-pointer border border-border-color">
              <summary className="font-semibold text-gray-800 flex justify-between items-center">
                Do you offer gift wrapping?
                <span className="ml-4">+</span>
              </summary>
              <p className="text-light-text mt-4">
                Yes! We offer premium gift wrapping services with personalized
                messages and various design options to make your gifts special.
              </p>
            </details>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-theme-color text-white rounded-lg p-8 lg:p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Ready to Shop with Confidence?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Experience the AweGift difference. Browse our amazing collection of
            products and enjoy our premium services.
          </p>
          <a
            href="/products"
            className="inline-block bg-white text-theme-color px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Start Shopping Now
          </a>
        </section>
      </div>
    </Container>
  );
}
