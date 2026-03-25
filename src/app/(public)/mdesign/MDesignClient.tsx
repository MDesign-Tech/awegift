"use client";

import { useEffect, useRef } from "react";
import Container from "@/components/Container";
import Title from "@/components/Title";

const serviceCards = [
  {
    id: "visual-creation",
    title: "Visual Creation",
    subtitle: "Main Service",
    description:
      "Bring ideas to life through visuals that communicate, inspire and connect.",
    highlight: true,
  },
  {
    id: "event-management",
    title: "Event Management",
    subtitle: "Seamless Execution",
    description:
      "Plan and run memorable events from concept to completion with precision.",
    highlight: false,
  },
  {
    id: "tech-solutions",
    title: "Tech Solutions",
    subtitle: "Smart & Scalable",
    description:
      "Build efficient, future-ready digital systems for growth and automation.",
    highlight: false,
  },
];

const visualSubsections = [
  {
    title: "Graphic Design",
    description:
      "Professional visual design solutions for all your marketing needs.",
    image:
      "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=300&fit=crop&crop=center",
    examples: [
      "Flyers",
      "Social media graphics",
      "Banners",
      "UI design",
      "Packaging design",
    ],
  },
  {
    title: "Branding",
    description:
      "Complete brand identity development to establish your market presence.",
    image:
      "https://images.unsplash.com/photo-1634942537034-253e92af8e6e?w=400&h=300&fit=crop&crop=center",
    examples: [
      "Logo Design",
      "Brand Identity",
      "Brand Guidelines",
      "Rebranding",
      "Packaging Design",
    ],
  },
  {
    title: "Photography & Videography",
    description:
      "Capturing memorable moments and creating compelling visual stories.",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&crop=center",
    examples: [
      "Wedding photography",
      "Event coverage",
      "Anniversary shoots",
      "Corporate headshots",
      "Product photography",
    ],
  },
  {
    title: "Signage Design & Installation",
    description:
      "Professional signage solutions for indoor and outdoor applications.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center",
    examples: [
      "2D signages",
      "3D signages",
      "A-frame sidewalk signs",
      "Banners",
      "Restroom signs",
      "Hazard warnings",
      "Wayfinding & Directional Signs",
      "Office & Interior Signage",
    ],
  },
  {
    title: "Motion Graphics",
    description:
      "Dynamic video content that engages and informs your audience.",
    image:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop&crop=center",
    examples: [
      "Motion videos",
      "Advertising videos",
      "Infographic videos",
      "Explainer videos",
      "Social media animations",
    ],
  },
];

const eventSteps = [
  {
    title: "Pre-event planning",
    note: "First step",
    details:
      "Scope definition, timeline planning, vendor coordination, and attendee experience mapping.",
    checklist: [
      "Set objectives and budget",
      "Choose venue and date",
      "Develop event schedule",
      "Confirm vendors and sponsors",
      "Build communication plan",
    ],
    examples: [
      "Strategy workshop sessions",
      "Logistics planning deck",
      "Registration flow setup",
    ],
  },
  {
    title: "On-site setup and event management",
    note: "Second step",
    details:
      "Execute the vision with efficient setup, team coordination, on-site staff and real-time troubleshooting.",
    checklist: [
      "Arrival and equipment check",
      "Venue branding + signage placement",
      "AV and lighting validation",
      "Guest check-in process",
      "Live program cueing",
    ],
    examples: [
      "Live event run-of-show",
      "Stage direction management",
      "Live-stream event production",
    ],
  },
  {
    title: "Post-event management",
    note: "Last step",
    details:
      "Collect feedback, measure outcomes, deliver follow-up reports, and optimize for future events.",
    checklist: [
      "Post-event survey",
      "Performance analytics report",
      "Content repurposing plan",
      "Thank-you communications",
      "Lessons learned summary",
    ],
    examples: [
      "Wrap-up analytics dashboard",
      "Media highlight cut",
      "Stakeholder performance presentation",
    ],
  },
];

const techCards = [
  {
    title: "Web Design & Development",
    description:
      "Responsive websites and web applications with conversion-first UX and clean code.",
  },
  {
    title: "SEO (Search Engine Optimization)",
    description:
      "Optimization strategy for visibility, traffic growth, and search rankings.",
  },
  {
    title: "Digital Solutions & Automation",
    description:
      "Process automation, integrated systems and data workflows to scale operations.",
  },
  {
    title: "IT Support & Maintenance",
    description:
      "Managed services, support SLAs, and secure infrastructure maintenance.",
  },
  {
    title: "E-commerce Setup",
    description:
      "Store setup, platform integration, payment workflows, and post-launch support.",
  },
];

export default function MDesignClient() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainRef.current.style.setProperty("--mouse-x", `${x}%`);
      mainRef.current.style.setProperty("--mouse-y", `${y}%`);
      mainRef.current.style.setProperty("--cursor-active", "1");
    };

    const handleMouseLeave = () => {
      if (mainRef.current) {
        mainRef.current.style.setProperty("--cursor-active", "0");
      }
    };

    const handleMouseEnter = () => {
      if (mainRef.current) {
        mainRef.current.style.setProperty("--cursor-active", "1");
      }
    };

    const elem = mainRef.current;
    if (elem) {
      elem.addEventListener("mousemove", handleMouseMove);
      elem.addEventListener("mouseleave", handleMouseLeave);
      elem.addEventListener("mouseenter", handleMouseEnter);
    }

    return () => {
      if (elem) {
        elem.removeEventListener("mousemove", handleMouseMove);
        elem.removeEventListener("mouseleave", handleMouseLeave);
        elem.removeEventListener("mouseenter", handleMouseEnter);
      }
    };
  }, []);

  return (
    <main
      ref={mainRef}
      className="mdesign-background text-slate-100 min-h-screen scroll-smooth relative"
    >
      <div className="glitch-overlay" />
      <Container className="py-12 md:py-16 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-sm uppercase tracking-widest text-orange-400 animate-pulse mb-3">
            MDesign Services
          </p>
          <Title className="text-3xl md:text-5xl font-black leading-tight text-white">
            Creative Design, Events & Tech Solutions
          </Title>
          <p className="mt-4 mx-auto max-w-2xl text-gray-300 text-base md:text-lg">
            Explore our visually rich flagship services and jump to each section
            for detailed capabilities and sample deliverables.
          </p>
          <div className="mt-6 h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-orange-400 via-fuchsia-400 to-cyan-400 animate-pulse-glow" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {serviceCards.map((card) => (
            <a
              key={card.id}
              href={`#${card.id}`}
              className={`group relative block rounded-2xl border p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${card.highlight ? "bg-gradient-to-br from-[#1b2742] via-[#10213b] to-[#0c1a32] border-[#ed4c07]" : "bg-[#09101e] border-slate-600"}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl bg-gradient-to-r from-orange-500/20 via-fuchsia-500/10 to-cyan-500/20" />
              <div className="relative z-10">
                <div className="text-sm uppercase tracking-wider text-orange-300 mb-2">
                  {card.subtitle}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        <section id="visual-creation" className="pb-16 pt-3">
          <div className="mb-6 border-l-4 border-orange-500 pl-4">
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Visual Creation
            </h2>
            <p className="text-sm text-orange-300 uppercase tracking-widest mt-1">
              MAIN SERVICE
            </p>
          </div>
          <p className="text-slate-300 leading-relaxed text-base md:text-lg mb-8">
            We bring ideas to life through powerful visuals that communicate,
            inspire, and connect. Our full spectrum visual services are built to
            elevate brands in every touchpoint.
          </p>

          {visualSubsections.map((item, index) => (
            <div key={item.title} className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Image Section */}
                <div className="order-2 lg:order-1">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-64 lg:h-80 object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="order-1 lg:order-2">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.examples.map((example) => (
                      <div
                        key={example}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-slate-700 bg-[#0d1a2f]/95 hover:border-orange-400 transition-colors group"
                      >
                        <div className="w-2 h-2 rounded-full bg-orange-400 group-hover:bg-orange-300 transition-colors flex-shrink-0" />
                        <span className="text-sm text-slate-200">
                          {example}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {index < visualSubsections.length - 1 && (
                <div className="mt-12 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
              )}
            </div>
          ))}
        </section>

        <section id="event-management" className="pb-16 pt-3">
          <div className="mb-6 border-l-4 border-cyan-400 pl-4">
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Event Management
            </h2>
            <p className="text-sm text-cyan-300 uppercase tracking-widest mt-1">
              Seamless Execution
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventSteps.map((step, i) => (
              <article
                key={step.title}
                className={`rounded-xl border p-6 shadow-lg ${i === 0 ? "border-orange-400 bg-[#102638]" : i === 1 ? "border-cyan-400 bg-[#10283b]" : "border-violet-400 bg-[#101a2f]"}`}
              >
                <div className="text-xs uppercase tracking-widest text-gray-300">
                  {step.note}
                </div>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-200 mb-4 leading-relaxed">
                  {step.details}
                </p>
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-orange-300 mb-2">
                    Checklist
                  </h4>
                  <ul className="list-disc list-inside text-slate-200 space-y-1">
                    {step.checklist.map((item) => (
                      <li key={`${step.title}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">
                    Examples
                  </h4>
                  <ul className="list-disc list-inside text-slate-200 space-y-1">
                    {step.examples.map((example) => (
                      <li key={`${step.title}-${example}`}>{example}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 text-center text-slate-400 text-sm">
            <span className="px-3 py-1 rounded-full bg-slate-800/40">
              Step 1 → Step 2 → Step 3
            </span>
          </div>
        </section>

        <section id="tech-solutions" className="pb-16 pt-3">
          <div className="mb-6 border-l-4 border-violet-400 pl-4">
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Tech Solutions (Tech Savvy)
            </h2>
            <p className="text-sm text-violet-300 uppercase tracking-widest mt-1">
              Smart Digital Systems
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-700 bg-[#081027]/90 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-transform"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-slate-200 leading-relaxed">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="text-center mt-8">
          <a
            href="/contact"
            className="inline-block rounded-full border border-orange-400 px-7 py-3 text-sm font-semibold uppercase tracking-wider text-orange-100 transition-all duration-200 hover:bg-orange-500 hover:text-white"
          >
            Talk to MDesign Experts
          </a>
        </div>
      </Container>
    </main>
  );
}
