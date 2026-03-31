"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

type Project = {
  id: number;
  title: string;
  description: string;
  category: string;
  color: string;
  details: string;
  image: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: "NOVA Immersion",
    description: "Cinematic web narrative for a launch campaign.",
    category: "Web Experience",
    color: "#F59E0B",
    image:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop&crop=center",
    details:
      "A full-screen interactive storytelling site with scroll-bound chapters, 3D parallax layers and dynamic audio cues.",
  },
  {
    id: 2,
    title: "Pulse UI Rebrand",
    description: "UI/UX system for an emerging fintech ecosystem.",
    category: "Digital Product",
    color: "#22D3EE",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center",
    details:
      "Modular component platform with advanced motion states and adaptive interactions for desktop and mobile.",
  },
  {
    id: 3,
    title: "Astra Motion",
    description: "Motion-led design for a creative studio identity.",
    category: "Branding",
    color: "#A855F7",
    image:
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop&crop=center",
    details:
      "Animated brand assets, ink-bleed transitions, and a strong dark highlight aesthetic with immersive hover feedback.",
  },
];

const splitChars = (text: string) =>
  text.split("").map((char, index) => (
    <motion.span
      key={`${char}-${index}`}
      className="inline-block"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.02, duration: 0.5, ease: "easeOut" }}
    >
      {char}
    </motion.span>
  ));

export default function MPage() {
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
    active: false,
    label: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const move = (e: PointerEvent) => {
      setCursor((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
    };

    const over = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const el = target?.closest?.("[data-cursor]") as HTMLElement | null;
      if (el) {
        const action = el.dataset.cursor || "default";
        setCursor({
          x: e.clientX,
          y: e.clientY,
          active: true,
          label: action === "link" ? "View" : "",
        });
      }
    };

    const out = () =>
      setCursor((prev) => ({ ...prev, active: false, label: "" }));

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);

    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
    };
  }, []);

  useEffect(() => {
    // GSAP & ScrollTrigger for section reveals and parallax
    const revealEls = gsap.utils.toArray<HTMLElement>(".m-reveal");

    const ctx = gsap.context(() => {
      revealEls.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "bottom 50%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      gsap.to(".m-parallax-layer", {
        yPercent: -22,
        ease: "none",
        scrollTrigger: {
          trigger: ".m-parallax-holder",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // Pinned storytelling panel
      ScrollTrigger.create({
        trigger: ".m-pin-panel",
        start: "top top",
        end: "+=1200",
        pin: true,
        scrub: 1,
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  useEffect(() => {
    // Lenis smooth scrolling
    const lenis = new Lenis({
      duration: 1.6,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smooth: true,
      orientation: "vertical",
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    // Three.js animated point sphere for hero background
    const canvas = heroCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BufferGeometry();
    const count = 6500;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 8 + Math.random() * 4;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.07,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    let frameId: number;
    const animate = () => {
      points.rotation.y += 0.0008;
      points.rotation.x += 0.0002;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <motion.main
      className="min-h-screen bg-[#05060b] text-white overflow-x-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(112, 78, 255,0.35),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(15, 247, 210,0.26),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255, 84, 156,0.22),transparent_45%)] blur-2xl"
          aria-hidden="true"
        />
      </div>

      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="https://player.vimeo.com/video/76979871?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <canvas
          ref={heroCanvasRef}
          className="absolute inset-0 w-full h-full"
        />

        <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-24 text-center">
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <img
              src="/M DESIGN LOGO final.svg"
              alt="M DESIGN logo"
              className="mx-auto h-20 md:h-28 lg:h-32"
            />
            <span className="sr-only">M DESIGN</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-xl md:text-2xl text-slate-200"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
          >
            M Design
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            {[
              {
                title: "Visual Creators",
                color: "bg-[#ed4c07] hover:bg-[#ff7f50]",
              },
              {
                title: "Event Management",
                color: "bg-[#00cec9] hover:bg-[#3fdce3]",
              },
              {
                title: "Tech Solutions",
                color: "bg-[#cb5dff] hover:bg-[#d9bbff]",
              },
            ].map((service) => (
              <div
                key={service.title}
                className={`group relative rounded-full border border-white/20 px-7 py-3 text-base md:text-lg font-bold tracking-wide text-white ${service.color} shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-white/40`}
                data-cursor="link"
              >
                <div className="relative z-10">{service.title}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="mt-14 inline-flex items-center gap-3 text-sm uppercase tracking-widest text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <span>Scroll to explore</span>
            <span className="animate-bounce">⌄</span>
          </motion.div>
        </div>
      </section>

      <section className="m-reveal bg-[#070913] py-24 md:py-28">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Story-led animation grounded in purpose
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg md:text-xl">
                Each section is not a block, it is a chapter; motion and
                interaction are structured to guide users through a narrative.
              </p>
            </div>
            <div className="relative m-parallax-holder h-80 overflow-hidden rounded-3xl border border-white/10 bg-[#0d1525]">
              <img
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&crop=center"
                alt="Creative workspace with motion graphics"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="m-parallax-layer absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(29, 131, 248,0.35),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(148, 159, 255,0.23),transparent_40%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/90 text-sm font-medium">
                  Interactive storytelling in motion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="m-pin-panel bg-[#060a15] py-24">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="sticky top-24 bg-[#070d1a]/60 border border-white/5 rounded-3xl p-10 backdrop-blur-xl shadow-[0_14px_48px_rgba(0,0,0,0.35)]">
            <motion.h3
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold"
            >
              Scroll-based storytelling elements
            </motion.h3>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Pinned progress sections, layered text, and subtle pace changes
              create a premium experience.
            </p>
          </div>
          <div className="mt-12 overflow-x-auto pb-6 -mx-6 px-6 lg:-mx-24 lg:px-24">
            <div className="flex gap-6 min-w-max snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {[
                {
                  title: "A hero with depth and motion",
                  description:
                    "3D particle systems and layered parallax create immersive depth",
                  image:
                    "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=center",
                  video:
                    "https://player.vimeo.com/video/76979871?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1",
                },
                {
                  title: "Sticky panels that anchor the narrative",
                  description:
                    "Scroll-triggered pinning keeps important content in focus",
                  image:
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=center",
                  video: null,
                },
                {
                  title: "Fast but graceful transitions as you scroll",
                  description:
                    "Smooth animations and micro-interactions guide the user journey",
                  image:
                    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop&crop=center",
                  video: null,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="h-72 w-[calc(100vw-4rem)] md:w-[calc(50vw-3rem)] lg:w-[calc(33.333vw-2rem)] rounded-2xl border border-white/10 bg-[#0c1221] overflow-hidden relative group snap-center flex-shrink-0"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  {item.video ? (
                    <div className="absolute inset-0">
                      <iframe
                        src={item.video}
                        className="w-full h-full object-cover"
                        frameBorder="0"
                        allow="autoplay; fullscreen"
                        title={item.title}
                      />
                      <div className="absolute inset-0 bg-black/30" />
                    </div>
                  ) : (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h4 className="text-xl font-semibold text-white mb-2">
                      {item.title}
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 m-reveal">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <h2 className="text-4xl md:text-5xl font-bold">
              Interactive projects
            </h2>
            <p className="text-slate-400 max-w-xl">
              Hover for depth and click to dive into each crafted case study
              experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.article
                key={project.id}
                data-cursor="link"
                className="group rounded-3xl border border-white/10 p-6 bg-[#0a0f1d] shadow-[0_10px_40px_rgba(0,0,0,0.2)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.32)]"
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedProject(project)}
              >
                <div className="h-48 rounded-2xl mb-5 overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  {project.category}
                </p>
                <h3 className="text-2xl font-semibold mb-2">{project.title}</h3>
                <p className="text-slate-400">{project.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              className="relative max-w-3xl w-full rounded-3xl bg-[#0f172a] p-8 border border-white/10 shadow-2xl"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-white/70 hover:text-white"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
              >
                ✕
              </button>
              <h3 className="text-3xl font-bold mb-3">
                {selectedProject.title}
              </h3>
              <p className="text-slate-300 mb-4">{selectedProject.details}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                <span>Category: {selectedProject.category}</span>
                <span>Motion, UI, Narrative</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-24 m-reveal relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop&crop=center)",
          }}
        />
        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div>
              <h2 className="text-4xl font-bold mb-5">About "m" Studio</h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                We are a boutique collective blending motion design, code and
                storytelling to create immersive digital experiences. Our work
                is shaped by simplicity, precision, and intent.
              </p>
            </div>
            <div className="space-y-5">
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0d1020]/80 backdrop-blur-sm">
                <h3 className="text-2xl font-semibold mb-2">Philosophy</h3>
                <p className="text-slate-400">
                  Design with empathy, animate with purpose, build with speed.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0d1020]/80 backdrop-blur-sm">
                <h3 className="text-2xl font-semibold mb-2">Approach</h3>
                <p className="text-slate-400">
                  Layered motions, micro-interactions, and fluid transitions
                  that feel natural and refined.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#06070f] m-reveal relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1920&h=1080&fit=crop&crop=center)",
          }}
        />
        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <h2 className="text-4xl font-bold mb-10">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Brand Narrative",
                detail:
                  "Concept systems, identity motion, storytelling experiences",
                color: "#22d3ee",
              },
              {
                title: "Product Experience",
                detail: "Design systems, UI motion, responsive product flows",
                color: "#f43f5e",
              },
              {
                title: "WebGL Interactions",
                detail: "WebGL shaders, physics-driven UI, 3D motion",
                color: "#a855f7",
              },
              {
                title: "Content Animation",
                detail: "Text, scroll transitions, Lottie and sprite motion",
                color: "#f59e0b",
              },
              {
                title: "Performance Design",
                detail:
                  "Optimized visuals, progressive loading, smooth 60fps interactions",
                color: "#22c55e",
              },
            ].map((service) => (
              <motion.article
                key={service.title}
                data-cursor="link"
                className="rounded-2xl border border-white/10 p-6 bg-[#0a0f1c]/90 backdrop-blur-sm hover:bg-[#101629]/90 transition-colors duration-300"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <h3
                  className="text-2xl font-semibold"
                  style={{ color: service.color }}
                >
                  {service.title}
                </h3>
                <p className="mt-3 text-slate-300">{service.detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-14 bg-[#050610] border-t border-white/10 m-reveal relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=600&fit=crop&crop=center)",
          }}
        />
        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <p className="text-sm text-slate-400">
                m Studio • A premium interactive agency
              </p>
              <p className="mt-2 text-lg">
                hello@mstudio.com • +1 234 567 8900
              </p>
            </div>
            <div className="flex gap-5 text-slate-300">
              {["Dribbble", "Instagram", "LinkedIn", "Github"].map((text) => (
                <a
                  key={text}
                  href="#"
                  className="text-sm hover:text-white transition-colors"
                  data-cursor="link"
                >
                  {text}
                </a>
              ))}
            </div>
          </div>
          <p className="mt-8 text-slate-500 text-sm">
            © {new Date().getFullYear()} m Studio. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Custom cursor overlay */}
      <span
        className={`custom-cursor ${cursor.active ? "custom-cursor-active" : ""}`}
        style={{
          transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
        }}
      >
        {cursor.label && (
          <span className="custom-cursor-label">{cursor.label}</span>
        )}
      </span>
    </motion.main>
  );
}
