import Link from "next/link";
import { servicesData } from "@/constants/services";

export default function ServicesPromotion() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-theme-color">
              More from AweGift
            </p>
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Creative Services
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              From memorable events to standout brands, bring your next idea to
              life with our creative team.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex w-fit items-center rounded-md bg-theme-color px-5 py-3 font-semibold text-white transition hover:bg-accent-color focus:outline-none focus:ring-2 focus:ring-theme-color focus:ring-offset-2"
          >
            Discuss a project
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {servicesData.slice(0, 4).map((service) => (
            <Link
              key={service.id}
              href={`/contact?service=${encodeURIComponent(service.id)}`}
              className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-color"
            >
              <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={service.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 group-hover:text-theme-color">
                  {service.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {service.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
