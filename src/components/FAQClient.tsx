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

const faqCategories = [
  {
    id: "general",
    title: "Frequently Asked Questions",
    icon: "❓",
    faqs: [
      {
        question: "What is AweGift?",
        answer:
          "AweGift is an online marketplace that offers a wide range of customized gifts, creative products, and unique items for every occasion. We connect customers with high-quality products designed to make gifting simple, personal, and memorable.",
      },
      {
        question: "How fast is delivery?",
        answer:
          "Delivery times depend on your location and the type of product ordered. Standard delivery: 1–3 business days (within Kigali). Nationwide delivery: 2–5 business days. Customized products may take a bit longer due to production time.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept multiple secure payment options, including Mobile Money (MTN MoMo, Airtel Money), Bank transfers, and Debit/Credit cards (where available).",
      },
      {
        question: "How do I return a product?",
        answer:
          "If you're not satisfied with your purchase, you can request a return within a specified period (e.g., 3–7 days after delivery). The item must be unused and in its original condition. Customized items may not be eligible for return unless defective. Contact our support team to initiate the return process.",
      },
    ],
  },
];

export default function FAQClient() {
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
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.faqs.length > 0);

  return (
    <Container className="py-4 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}

        <div className="text-center mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about shopping on AweGift
            </p>
          </div>

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

        <div className="space-y-8 max-w-4xl mx-auto">
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
                                  <FiChevronDown className="w-5 h-5 text-theme-color shrink-0" />
                                ) : (
                                  <FiChevronRight className="w-5 h-5 text-theme-color shrink-0" />
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
                    Try different keywords or refine your search.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Category FAQs */
            <div className="space-y-4">
              {faqCategories[0].faqs.map((faq, index) => {
                const faqId = `${faqCategories[0].id}-${index}`;
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
                        <FiChevronDown className="w-5 h-5 text-theme-color shrink-0" />
                      ) : (
                        <FiChevronRight className="w-5 h-5 text-theme-color shrink-0" />
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
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-16 text-center bg-sky-color/10 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-theme-color mb-4">
          Still have questions?
        </h2>
        <p className="text-light-text mb-6">
          Can't find what you're looking for? Our customer support team is here
          to help.
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
    </Container>
  );
}
