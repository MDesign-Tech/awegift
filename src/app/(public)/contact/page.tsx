import Container from "@/components/Container";
import ContactForm from "@/components/pages/ContactForm";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";
import { FiClock, FiMail, FiMapPin, FiPhone } from "react-icons/fi";

export const metadata: Metadata = generateSEO({
  title: "Contact AweGift | Get in Touch",
  description:
    "Contact AweGift in Kigali, Rwanda for help with personalized products, custom printing, branding, corporate supplies or an order.",
  url: "/contact",
});

export default function ContactPage() {
  return (
    <Container className="py-4 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* <Title className="text-3xl lg:text-4xl font-bold mb-4">
            Contact Us
          </Title> */}
          <h1 className="text-light-text text-lg">
            We&apos;d love to hear from you. Get in touch with our team.
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold text-theme-color mb-6">
              Get in Touch
            </h2>
            {/* <p className="text-light-text mb-8">
              Have questions about our products or services? Need help with an
              order? Our friendly customer service team is here to assist you.
            </p> */}

            {/* Contact Cards */}
            <div className="space-y-6">
              <div className="bg-light-bg rounded-lg p-6 flex items-start gap-4">
                <div className="bg-theme-color/10 p-3 rounded-lg">
                  <FiMapPin className="w-6 h-6 text-theme-color" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Address</h3>
                  <p className="text-light-text">
                    KN 78 St, Kigali - Rwabda
                  </p>
                </div>
              </div>

              <div className="bg-light-bg rounded-lg p-6 flex items-start gap-4">
                <div className="bg-theme-color/10 p-3 rounded-lg">
                  <FiPhone className="w-6 h-6 text-theme-color" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Phone</h3>
                  <p className="text-light-text">+250 781 990 310</p>
                </div>
              </div>

              <div className="bg-light-bg rounded-lg p-6 flex items-start gap-4">
                <div className="bg-theme-color/10 p-3 rounded-lg">
                  <FiMail className="w-6 h-6 text-theme-color" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                  <p className="text-light-text">support@aweegift.com</p>
                </div>
              </div>

              <div className="bg-light-bg rounded-lg p-6 flex items-start gap-4">
                <div className="bg-theme-color/10 p-3 rounded-lg">
                  <FiClock className="w-6 h-6 text-theme-color" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Business Hours
                  </h3>
                  <div className="text-light-text text-sm">
                    <p>Monday - Sunday: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-theme-white border border-border-color rounded-lg p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-theme-color mb-6">
              Send us a Message
            </h2>
            <ContactForm />
          </div>
        </div>

        {/* Additional Information */}
        {/* <div className="mt-16 text-center bg-sky-color/10 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-theme-color mb-4">
            Need Immediate Help?
          </h2>
          <p className="text-light-text mb-6">
            For urgent matters, you can reach us directly through our customer
            support hotline.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+250781990310"
              className="inline-flex items-center gap-2 bg-theme-color text-theme-white px-6 py-3 rounded-lg hover:bg-theme-color/90 transition-colors duration-200 font-medium"
            >
              <FiPhone className="w-4 h-4" />
              Call Us Now
            </a>
            <a
              href="mailto:support@awegift.com"
              className="inline-flex items-center gap-2 bg-theme-white text-theme-color border-2 border-theme-color px-6 py-3 rounded-lg hover:bg-theme-color hover:text-theme-white transition-colors duration-200 font-medium"
            >
              <FiMail className="w-4 h-4" />
              Email Support
            </a>
          </div>
        </div> */}
      </div>
    </Container>
  );
}
