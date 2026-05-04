import Container from "@/components/Container";

const TermsPage = () => (
  <main className="py-16">
    <Container className="space-y-8">
      <section className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold text-gray-900">
          Terms of Service
        </h1>
        <p className="text-gray-600">
          These terms govern your use of AweGift. By accessing or using our
          website, you agree to follow and be bound by these terms.
        </p>
        <div className="space-y-4 text-gray-700">
          <p>
            Use of our website is for personal and lawful purposes only. You may
            not misuse the service or attempt to access restricted areas.
          </p>
          <p>
            AweGift may update these terms from time to time. Continued use of
            the site after changes are made means you accept those changes.
          </p>
          <p>
            If you have any questions about these terms, please reach out to us
            at support@awegift.com.
          </p>
        </div>
      </section>
    </Container>
  </main>
);

export default TermsPage;
