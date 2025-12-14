"use client";

import { useState } from "react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import {
  FiChevronDown,
  FiChevronRight,
  FiHelpCircle,
  FiSearch,
} from "react-icons/fi";

/* 🔹 MOVE ALL DATA HERE */
const faqCategories = [
  {
    id: "orders",
    title: "Orders",
    icon: "📦",
    faqs: [
      {
        question: "Can I track my order?",
        answer:
          "Yes! You can track your order status by logging into your account and visiting the 'Orders' section.",
      },
    ],
  },
  // keep the rest exactly as you have
];

export default function FAQClient() {
  const [activeCategory, setActiveCategory] = useState("orders");
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleFAQ = (faqId: string) => {
    setOpenFAQ(openFAQ === faqId ? null : faqId);
  };

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.faqs.length > 0);

  return (
    <Container className="py-10 lg:py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Title className="text-3xl lg:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </Title>
          <p className="text-light-text text-lg mb-8">
            Find answers to common questions about shopping with AweGift
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border-color rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-theme-color mb-4">
              Categories
            </h2>
            <div className="space-y-2">
              {faqCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
                    activeCategory === category.id
                      ? "bg-theme-color text-theme-white"
                      : "bg-light-bg text-gray-700 hover:bg-theme-color/10"
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {searchTerm ? (
              /* Search Results */
              <div>
                <h2 className="text-2xl font-semibold text-theme-color mb-6">
                  Search Results for &ldquo;{searchTerm}&rdquo;
                </h2>
                {filteredCategories.length > 0 ? (
                  <div className="space-y-8">
                    {filteredCategories.map((category) => (
                      <div key={category.id}>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.title}
                        </h3>
                        <div className="space-y-4">
                          {category.faqs.map((faq, index) => {
                            const faqId = `${category.id}-${index}`;
                            const isOpen = openFAQ === faqId;

                            return (
                              <div
                                key={faqId}
                                className="bg-theme-white border border-border-color rounded-lg"
                              >
                                <button
                                  onClick={() => toggleFAQ(faqId)}
                                  className="w-full text-left p-4 flex items-center justify-between hover:bg-light-bg/50 transition-colors duration-200"
                                >
                                  <span className="font-medium text-gray-800 pr-4">
                                    {faq.question}
                                  </span>
                                  {isOpen ? (
                                    <FiChevronDown className="w-5 h-5 text-theme-color flex-shrink-0" />
                                  ) : (
                                    <FiChevronRight className="w-5 h-5 text-theme-color flex-shrink-0" />
                                  )}
                                </button>
                                {isOpen && (
                                  <div className="px-4 pb-4">
                                    <p className="text-light-text leading-relaxed">
                                      {faq.answer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiHelpCircle className="w-16 h-16 text-light-text mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No results found
                    </h3>
                    <p className="text-light-text">
                      Try different keywords or browse categories above.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Category FAQs */
              <div>
                {(() => {
                  const category = faqCategories.find(
                    (cat) => cat.id === activeCategory
                  );
                  if (!category) return null;

                  return (
                    <>
                      <h2 className="text-2xl font-semibold text-theme-color mb-6 flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        {category.title}
                      </h2>
                      <div className="space-y-4">
                        {category.faqs.map((faq, index) => {
                          const faqId = `${category.id}-${index}`;
                          const isOpen = openFAQ === faqId;

                          return (
                            <div
                              key={faqId}
                              className="bg-theme-white border border-border-color rounded-lg"
                            >
                              <button
                                onClick={() => toggleFAQ(faqId)}
                                className="w-full text-left p-4 flex items-center justify-between hover:bg-light-bg/50 transition-colors duration-200"
                              >
                                <span className="font-medium text-gray-800 pr-4">
                                  {faq.question}
                                </span>
                                {isOpen ? (
                                  <FiChevronDown className="w-5 h-5 text-theme-color flex-shrink-0" />
                                ) : (
                                  <FiChevronRight className="w-5 h-5 text-theme-color flex-shrink-0" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4">
                                  <p className="text-light-text leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center bg-sky-color/10 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-theme-color mb-4">
            Still have questions?
          </h2>
          <p className="text-light-text mb-6">
            Can&apos;t find what you&apos;re looking for? Our customer support
            team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block bg-theme-color text-theme-white px-6 py-3 rounded-lg hover:bg-theme-color/90 transition-colors duration-200 font-medium"
            >
              Contact Support
            </a>
            <a
              href="mailto:support@awegift.com"
              className="inline-block bg-theme-white text-theme-color border-2 border-theme-color px-6 py-3 rounded-lg hover:bg-theme-color hover:text-theme-white transition-colors duration-200 font-medium"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
