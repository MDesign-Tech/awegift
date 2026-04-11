"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { aboutUsImage } from "../../assets";

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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export default function MPage() {
  const router = useRouter();
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const aboutCanvasRef = useRef<HTMLCanvasElement>(null);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
    active: false,
    label: "",
  });
  const [aboutCursor, setAboutCursor] = useState({ x: 0, y: 0 });
  const lenisRef = useRef<Lenis | null>(null);
  const [mounted, setMounted] = useState(false);
  const particlesRef = useRef<Particle[]>([]);

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
      orientation: "vertical",
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // About Section Particles with Cursor Tracking
  useEffect(() => {
    const canvas = aboutCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize particles
    const particleCount = 50;
    const particles: Particle[] = [];
    const colors = [
      "rgba(237, 76, 7, 0.6)",
      "rgba(0, 206, 201, 0.6)",
      "rgba(203, 93, 255, 0.6)",
      "rgba(255, 127, 80, 0.5)",
      "rgba(63, 220, 227, 0.5)",
      "rgba(217, 187, 255, 0.5)",
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    particlesRef.current = particles;

    const handleMouseMove = (e: MouseEvent) => {
      if (!aboutSectionRef.current) return;
      const rect = aboutSectionRef.current.getBoundingClientRect();
      setAboutCursor({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const section = aboutSectionRef.current;
    if (section) {
      section.addEventListener("mousemove", handleMouseMove);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off walls
        if (
          particle.x - particle.radius < 0 ||
          particle.x + particle.radius > canvas.width
        ) {
          particle.vx *= -1;
          particle.x = Math.max(
            particle.radius,
            Math.min(canvas.width - particle.radius, particle.x),
          );
        }
        if (
          particle.y - particle.radius < 0 ||
          particle.y + particle.radius > canvas.height
        ) {
          particle.vy *= -1;
          particle.y = Math.max(
            particle.radius,
            Math.min(canvas.height - particle.radius, particle.y),
          );
        }

        // Attract to cursor
        const dx = aboutCursor.x - particle.x;
        const dy = aboutCursor.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 0.5;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }

        // Damping
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (section) {
        section.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [aboutCursor]);

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
      className="min-h-screen bg-[#05060b] text-white overflow-hidden"
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
                title: "Visual Creation",
                color:
                  "bg-gradient-to-r from-[#ed4c07] to-[#ff7f50] hover:from-[#ff7f50] hover:to-[#ed4c07]",
              },
              {
                title: "Event Management",
                color:
                  "bg-gradient-to-r from-[#00cec9] to-[#3fdce3] hover:from-[#3fdce3] hover:to-[#00cec9]",
              },
              {
                title: "Tech Solutions",
                color:
                  "bg-gradient-to-r from-[#cb5dff] to-[#d9bbff] hover:from-[#d9bbff] hover:to-[#cb5dff]",
              },
            ].map((service) => (
              <div
                key={service.title}
                className={`group relative rounded-full border border-white/20 px-7 py-3 text-base md:text-lg font-bold tracking-wide text-white ${service.color} shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-white/40`}
                data-cursor="link"
                onClick={() =>
                  lenisRef.current?.scrollTo(
                    `#${service.title.toLowerCase().replace(/ /g, "-")}`,
                  )
                }
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
            <span>E-Commerce</span>
            <span className="animate-bounce">⌄</span>
          </motion.div>
        </div>
      </section>

      <section
        className="m-reveal bg-[#070913] py-24 md:py-28 relative overflow-hidden"
        ref={aboutSectionRef}
      >
        <canvas
          ref={aboutCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="space-y-12">
            <div className="relative m-parallax-holder h-96 overflow-hidden">
              <img
                src={aboutUsImage.src}
                alt="Creative workspace with motion graphics"
                className="absolute inset-0 w-full h-full object-contain"
                loading="lazy"
              />
              <div className="m-parallax-layer absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(29, 131, 248,0.35),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(148, 159, 255,0.23),transparent_40%)]" />
            </div>
            <div className="text-center space-y-6">
              {/* <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                ABOUT US
              </h2> */}
              <p className="text-slate-300 leading-relaxed text-lg md:text-xl">
                We are a creative agency specializing in <br />{" "}
                <b>
                  <span className="bg-gradient-to-r from-[#ed4c07] to-[#ff7f50] bg-clip-text text-transparent">
                    Visual Creations
                  </span>
                  ,{" "}
                  <span className="bg-gradient-to-r from-[#00cec9] to-[#3fdce3] bg-clip-text text-transparent">
                    Event Management
                  </span>
                  ,
                </b>{" "}
                and{" "}
                <b>
                  <span className="bg-gradient-to-r from-[#cb5dff] to-[#d9bbff] bg-clip-text text-transparent">
                    Tech Solutions
                  </span>
                </b>{" "}
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 m-reveal" id="services">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-10">
              Our Services
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-dotted border-white/30"></div>

            <div className="space-y-20">
              <div className="flex items-start gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-[#05060b] border-2 border-white/20 rounded-full flex items-center justify-center mt-2 -ml-6 z-10">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <div className="flex-1" id="visual-creation">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-3xl font-bold mb-5">Visual Creation</h3>
                    <p className="text-slate-300 leading-relaxed text-lg mb-10">
                      We bring ideas to life through powerful visuals that
                      communicate, inspire, and connect.
                    </p>

                    <div className="space-y-14">
                      <div>
                        <h4 className="text-2xl font-bold mb-8">
                          Graphic Design
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="relative group overflow-hidden rounded-lg">
                            <h5 className="text-lg font-semibold mb-4 text-slate-400">
                              Branding
                            </h5>
                            {/* <p className="text-slate-400 mb-6">
                          Logo Design, Brand Identity, Rebranding, Brand Guidelines
                        </p> */}
                            <div className="grid grid-cols-2 gap-4">
                              <img
                                src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop"
                                alt="Branding design 1"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop"
                                alt="Branding design 2"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=400&h=300&fit=crop"
                                alt="Branding design 3"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <button
                                className="group relative rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-600/20 backdrop-blur-md border border-purple-400/30 text-white px-6 py-4 font-bold hover:from-purple-500/30 hover:via-pink-500/25 hover:to-purple-600/30 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 overflow-hidden"
                                onClick={() =>
                                  router.push(
                                    "/services?category=graphic-design",
                                  )
                                }
                              >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                  <span className="text-sm font-bold tracking-wide">
                                    More
                                  </span>
                                  <svg
                                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                  </svg>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </button>
                            </div>
                          </div>
                          <div className="relative group overflow-hidden rounded-lg">
                            <h5 className="text-lg font-semibold mb-4 text-slate-400">
                              Social Media & Flyers
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <img
                                src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop"
                                alt="Social media design 1"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop"
                                alt="Flyer design 1"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop"
                                alt="Social media design 2"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <button
                                className="group relative rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-blue-600/20 backdrop-blur-md border border-blue-400/30 text-white px-6 py-4 font-bold hover:from-blue-500/30 hover:via-cyan-500/25 hover:to-blue-600/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 overflow-hidden"
                                onClick={() =>
                                  router.push(
                                    "/services?category=graphic-design",
                                  )
                                }
                              >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                  <span className="text-sm font-bold tracking-wide">
                                    More
                                  </span>
                                  <svg
                                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                  </svg>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </button>
                            </div>
                          </div>
                          <div className="relative group overflow-hidden rounded-lg">
                            <h5 className="text-lg font-semibold mb-4 text-slate-400">
                              Invitation Design
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <img
                                src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop"
                                alt="Invitation design 1"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop"
                                alt="Invitation design 2"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop"
                                alt="Invitation design 3"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <button
                                className="group relative rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-rose-500/20 via-pink-500/15 to-rose-600/20 backdrop-blur-md border border-rose-400/30 text-white px-6 py-4 font-bold hover:from-rose-500/30 hover:via-pink-500/25 hover:to-rose-600/30 transition-all duration-300 shadow-lg hover:shadow-rose-500/25 overflow-hidden"
                                onClick={() =>
                                  router.push(
                                    "/services?category=event-wedding",
                                  )
                                }
                              >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                  <span className="text-sm font-bold tracking-wide">
                                    More
                                  </span>
                                  <svg
                                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                  </svg>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </button>
                            </div>
                          </div>
                          <div className="relative group overflow-hidden rounded-lg">
                            <h5 className="text-lg font-semibold mb-4 text-slate-400">
                              Packaging Design
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <img
                                src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&h=300&fit=crop"
                                alt="Packaging design 1"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&h=300&fit=crop"
                                alt="Packaging design 2"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&h=300&fit=crop"
                                alt="Packaging design 3"
                                className="rounded-lg transition-transform duration-300 hover:scale-105"
                              />
                              <button
                                className="group relative rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-green-600/20 backdrop-blur-md border border-green-400/30 text-white px-6 py-4 font-bold hover:from-green-500/30 hover:via-emerald-500/25 hover:to-green-600/30 transition-all duration-300 shadow-lg hover:shadow-green-500/25 overflow-hidden"
                                onClick={() =>
                                  router.push(
                                    "/services?category=branding-signage",
                                  )
                                }
                              >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                  <span className="text-sm font-bold tracking-wide">
                                    More
                                  </span>
                                  <svg
                                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                  </svg>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-2xl font-bold mb-8">
                          Photography & Videography
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                          <img
                            src="https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=400&h=300&fit=crop"
                            alt="Professional photography 1"
                            className="rounded-lg"
                          />
                          <img
                            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop"
                            alt="Event photography 1"
                            className="rounded-lg"
                          />
                          <img
                            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop"
                            alt="Portrait photography"
                            className="rounded-lg"
                          />
                          <img
                            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
                            alt="Commercial photography"
                            className="rounded-lg"
                          />
                          <img
                            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop"
                            alt="Product photography"
                            className="rounded-lg"
                          />
                          <img
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
                            alt="Video production"
                            className="rounded-lg"
                          />
                        </div>
                        <div className="text-center">
                          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25">
                            Book now
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-2xl font-bold mb-8">
                          Motion Design / Motion Graphics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="relative group overflow-hidden rounded-lg bg-black">
                            <video
                              className="w-full h-48 object-cover group-hover:controls-auto"
                              controls={false}
                              onMouseEnter={(e) =>
                                (e.currentTarget.controls = true)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.controls = false)
                              }
                            >
                              <source
                                src="https://www.w3schools.com/html/mov_bbb.mp4"
                                type="video/mp4"
                              />
                            </video>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-white fill-white ml-0.5"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="relative group overflow-hidden rounded-lg bg-black">
                            <video
                              className="w-full h-48 object-cover group-hover:controls-auto"
                              controls={false}
                              onMouseEnter={(e) =>
                                (e.currentTarget.controls = true)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.controls = false)
                              }
                            >
                              <source
                                src="https://www.w3schools.com/html/mov_bbb.mp4"
                                type="video/mp4"
                              />
                            </video>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-white fill-white ml-0.5"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="relative group overflow-hidden rounded-lg bg-black">
                            <video
                              className="w-full h-48 object-cover group-hover:controls-auto"
                              controls={false}
                              onMouseEnter={(e) =>
                                (e.currentTarget.controls = true)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.controls = false)
                              }
                            >
                              <source
                                src="https://www.w3schools.com/html/mov_bbb.mp4"
                                type="video/mp4"
                              />
                            </video>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-white fill-white ml-0.5"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-2xl font-bold mb-8">
                          Signage Design & Installation
                        </h4>
                        <p className="text-slate-400 mb-6">
                          Design, production, and installation of indoor and
                          outdoor signage that enhances brand visibility.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <img
                            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
                            alt="Signage design 1"
                            className="rounded-lg"
                          />
                          <img
                            src="https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=300&fit=crop"
                            alt="Signage design 2"
                            className="rounded-lg md:col-span-2"
                          />
                          <div className="rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center p-8 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 cursor-pointer group">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg
                                  className="w-8 h-8 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">
                                View More
                              </h3>
                              <p className="text-gray-400 text-sm">
                                Explore our complete signage portfolio
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="flex items-start gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-[#05060b] border-2 border-white/20 rounded-full flex items-center justify-center mt-2 -ml-6 z-10">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1" id="event-management">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-3xl font-bold mb-5">
                      Event Management
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-lg mb-10">
                      We are a 1-stop specialized events company that plans and
                      executes seamless, memorable events that leave lasting
                      impressions. From concept to completion, we handle every
                      detail to bring your vision to life.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-8 mb-10 max-w-md mx-auto">
                      <motion.div
                        className="relative w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-2 border-blue-500/30 flex items-center justify-center group cursor-pointer overflow-hidden"
                        whileHover={{ scale: 1.08 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 text-center px-8 transition-all duration-500">
                          <h4 className="text-3xl font-semibold mb-6 text-white group-hover:opacity-0 transition-opacity duration-300">
                            Pre-event planning
                          </h4>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0 flex flex-col items-center justify-center px-6">
                            <h4 className="text-2xl font-semibold mb-4 text-white">
                              Pre-event planning
                            </h4>
                            <ul className="text-slate-300 text-sm space-y-2 mb-6">
                              <li>Strategy & Budget</li>
                              <li>Logistics & Vendors</li>
                              <li>Marketing & Registration</li>
                              <li>Experience Design</li>
                              <li>Communication</li>
                            </ul>
                          </div>
                          <motion.button
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            Talk to Us
                          </motion.button>
                        </div>
                      </motion.div>

                      <svg
                        className="w-6 h-6 text-slate-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-8a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>

                      <motion.div
                        className="relative w-80 h-80 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-2 border-purple-500/30 flex items-center justify-center group cursor-pointer overflow-hidden"
                        whileHover={{ scale: 1.08 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 text-center px-8 transition-all duration-500">
                          <h4 className="text-3xl font-semibold mb-6 text-white group-hover:opacity-0 transition-opacity duration-300">
                            On-site Setup & Management
                          </h4>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0 flex flex-col items-center justify-center px-6">
                            <h4 className="text-2xl font-semibold mb-4 text-white">
                              On-site Setup & Management
                            </h4>
                            <ul className="text-slate-300 text-sm space-y-2 mb-6">
                              <li>Registration/Check-in</li>
                              <li>Logistics & Operations</li>
                              <li>Production & AV</li>
                              <li>Attendee Engagement</li>
                              <li>Safety Protocols</li>
                            </ul>
                          </div>
                          <motion.button
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-semibold transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            Talk to Us
                          </motion.button>
                        </div>
                      </motion.div>

                      <svg
                        className="w-6 h-6 text-slate-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-8a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>

                      <motion.div
                        className="relative w-80 h-80 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 border-2 border-orange-500/30 flex items-center justify-center group cursor-pointer overflow-hidden"
                        whileHover={{ scale: 1.08 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 text-center px-8 transition-all duration-500">
                          <h4 className="text-3xl font-semibold mb-6 text-white group-hover:opacity-0 transition-opacity duration-300">
                            Post-event Management
                          </h4>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0 flex flex-col items-center justify-center px-6">
                            <h4 className="text-2xl font-semibold mb-4 text-white">
                              Post-event Management
                            </h4>
                            <ul className="text-slate-300 text-sm space-y-2 mb-6">
                              <li>Follow-Up Communications</li>
                              <li>Evaluation & Feedback</li>
                              <li>Content Distribution</li>
                              <li>Report Generation</li>
                              <li>ROI Analysis</li>
                            </ul>
                          </div>
                          <motion.button
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-sm font-semibold transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            Talk to Us
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="flex items-start gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-[#05060b] border-2 border-white/20 rounded-full flex items-center justify-center mt-2 -ml-6 z-10">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <div className="flex-1" id="tech-solutions">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-3xl font-bold mb-5">Tech Solutions</h3>
                    <p className="text-slate-300 leading-relaxed text-lg mb-10">
                      We provide smart digital and technical solutions that help
                      businesses grow, operate efficiently, and stay ahead in a
                      fast-changing world.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                      <motion.div
                        className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors duration-300 group"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-lg font-semibold mb-4 text-white">
                          UI/UX Design
                        </h4>
                        <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                          <svg
                            className="w-6 h-6 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                            />
                          </svg>
                        </div>
                      </motion.div>

                      <motion.div
                        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors duration-300 group"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-lg font-semibold mb-4 text-white">
                          Web Design & Development
                        </h4>
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                          <svg
                            className="w-6 h-6 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                            />
                          </svg>
                        </div>
                      </motion.div>

                      <motion.div
                        className="p-6 rounded-2xl bg-gradient-to-br from-green-500/15 to-green-600/5 border border-green-500/20 hover:border-green-500/40 transition-colors duration-300 group"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-lg font-semibold mb-4 text-white">
                          SEO Optimization
                        </h4>
                        <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                          <svg
                            className="w-6 h-6 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                      </motion.div>

                      <motion.div
                        className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/15 to-pink-600/5 border border-pink-500/20 hover:border-pink-500/40 transition-colors duration-300 group"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-lg font-semibold mb-4 text-white">
                          Digital Solutions & Automation
                        </h4>
                        <div className="w-12 h-12 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                          <svg
                            className="w-6 h-6 text-pink-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                      </motion.div>

                      <motion.div
                        className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/15 to-orange-600/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors duration-300 group"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-lg font-semibold mb-4 text-white">
                          IT Support & Maintenance
                        </h4>
                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                          <svg
                            className="w-6 h-6 text-orange-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                      </motion.div>

                      <motion.div
                        className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-cyan-600/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors duration-300 group"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-lg font-semibold mb-4 text-white">
                          E-commerce Setup
                        </h4>
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                          <svg
                            className="w-6 h-6 text-cyan-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
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

      <section className="py-24 m-reveal relative overflow-hidden">
        {/* Animated Background Words */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Row 1 - Left to Right */}
          <div className="absolute top-10 left-0 w-full animate-marquee-left opacity-5">
            <div className="flex whitespace-nowrap">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={`row1-${i}`}
                  className="text-6xl md:text-8xl font-bold text-white/10 mx-8 tracking-wider"
                >
                  Graphic Design • Branding • Logo Design • Brand Identity •
                  Rebranding • Brand Guidelines • Social media • Flyers
                </span>
              ))}
            </div>
          </div>

          {/* Row 2 - Right to Left */}
          <div className="absolute top-32 right-0 w-full animate-marquee-right opacity-5">
            <div className="flex whitespace-nowrap">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={`row2-${i}`}
                  className="text-5xl md:text-7xl font-bold text-white/8 mx-6 tracking-wider"
                >
                  Banners • Invitation design • Packaging design • Photography •
                  Videography • Motion design • Motion Graphics
                </span>
              ))}
            </div>
          </div>

          {/* Row 3 - Left to Right (Slower) */}
          <div className="absolute top-56 left-0 w-full animate-marquee-left-slow opacity-5">
            <div className="flex whitespace-nowrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={`row3-${i}`}
                  className="text-4xl md:text-6xl font-bold text-white/6 mx-10 tracking-wider"
                >
                  Signage Design • Signage Installation • Billboards • Shop
                  signs • Promotional materials • UI/UX design
                </span>
              ))}
            </div>
          </div>

          {/* Row 4 - Right to Left (Faster) */}
          <div className="absolute top-80 right-0 w-full animate-marquee-right-fast opacity-5">
            <div className="flex whitespace-nowrap">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={`row4-${i}`}
                  className="text-3xl md:text-5xl font-bold text-white/7 mx-4 tracking-wider"
                >
                  Web Design • Web Development • SEO • Digital Solutions &
                  Automation • IT Support & Maintenance • E-commerce Setup
                </span>
              ))}
            </div>
          </div>

          {/* Row 5 - Diagonal Movement */}
          <div className="absolute top-1/2 left-0 w-full animate-marquee-diagonal opacity-5">
            <div className="flex whitespace-nowrap">
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={`row5-${i}`}
                  className="text-7xl md:text-9xl font-bold text-white/4 mx-12 tracking-wider"
                >
                  Creative • Design • Motion • Digital • Branding • Innovation •
                  Experience
                </span>
              ))}
            </div>
          </div>

          {/* Floating Words */}
          <motion.div
            className="absolute top-20 left-1/4 text-4xl font-bold text-white/3 opacity-5"
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -30, 20, 0],
              rotate: [0, 5, -3, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Graphic Design
          </motion.div>

          <motion.div
            className="absolute bottom-32 right-1/3 text-5xl font-bold text-white/4 opacity-5"
            animate={{
              x: [0, -80, 40, 0],
              y: [0, 25, -15, 0],
              rotate: [0, -4, 6, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          >
            Motion Graphics
          </motion.div>

          <motion.div
            className="absolute top-1/3 right-10 text-3xl font-bold text-white/3 opacity-5"
            animate={{
              x: [0, 60, -30, 0],
              y: [0, -20, 10, 0],
              rotate: [0, 3, -2, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          >
            UI/UX Design
          </motion.div>
        </div>

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
