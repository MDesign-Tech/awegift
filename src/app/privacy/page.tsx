import Container from "@/components/Container";

const PrivacyPage = () => (
  <main className="py-16">
    <Container className="space-y-8">
      <section className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-600">
          Welcome to AweGift. Your privacy is important to us. This page describes how we collect, use, and protect your personal information when you use our website.
        </p>
        <div className="space-y-4 text-gray-700">
          <p>
            We collect only the information necessary to provide and improve our services, including contact details and order information. We do not sell your personal data.
          </p>
          <p>
            We use secure systems to store your information and limit access to authorized personnel. We also use cookies and similar technologies to enhance your experience.
          </p>
          <p>
            By using AweGift, you agree to the terms of this privacy policy. If you have any questions, please contact us at support@awegift.com.
          </p>
        </div>
      </section>
    </Container>
  </main>
);

export default PrivacyPage;
