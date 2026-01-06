"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import GiftButton from '@/components/GiftButton';

const Banner = () => {
  const heroRef = useRef<HTMLElement>(null);
  const scrollProgress = useScrollProgress(heroRef);
  const [isLoaded, setIsLoaded] = useState(false);
  const leftControls = useAnimation();
  const rightControls = useAnimation();

  // Sample images for floating cards
  const leftImages = [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=150&fit=crop',
  ];

  const rightImages = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
  ];

  // Entrance animation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Calculate transforms based on scroll progress
  const leftTranslateX = -120 + (isLoaded ? 120 : 0) - (scrollProgress * 500);
  const rightTranslateX = 120 - (isLoaded ? 120 : 0) + (scrollProgress * 500);
  const videoScale = 1 + (scrollProgress * 0.6);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen w-full bg-light-bg overflow-hidden"
      style={{ willChange: 'transform' }}
    >
      {/* Central Video Container */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          scale: videoScale,
          transition: 'scale 0.1s ease-out',
        }}
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Clean Content Area (No Browser Frame) */}
          <div className="h-full">
            {/* Text Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
              <motion.h1
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-dark-text leading-[1.1]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Welcome to AweGift
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <GiftButton href="/products">Shop Now</GiftButton>
              </motion.div>
            </div>
          </div>
        </motion.div>
        <div className="relative w-[70%] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=675&fit=crop"
          >
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              type="video/mp4"
            />
          </video>

          {/* Video overlay with brand */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-8">
          </div>
        </div>
      </motion.div>

      {/* Left Floating Cards */}
      <motion.div
        className="absolute left-0 top-1/3 -translate-y-1/2 flex flex-col gap-4 p-4"
        initial={{ x: '-120%' }}
        animate={{
          x: `${leftTranslateX}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 20,
          mass: 1,
        }}
        style={{ willChange: 'transform' }}
      >
        {/* Main large card */}
        <div className="relative w-48 h-60 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-xl shadow-black/40 bg-card">
          <img
            src={leftImages[0]}
            alt="Featured product"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Smaller cards row */}
        <div className="flex gap-2">
          {leftImages.slice(1).map((img, idx) => (
            <div
              key={idx}
              className="w-16 h-12 md:w-20 md:h-16 rounded-lg overflow-hidden shadow-lg shadow-black/30 bg-card"
            >
              <img
                src={img}
                alt={`Product ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Floating Cards */}
      <motion.div
        className="absolute right-0 top-1/3 -translate-y-1/2 flex flex-col items-end p-4"
        initial={{ x: '120%' }}
        animate={{
          x: `${rightTranslateX}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 20,
          mass: 1,
        }}
        style={{ willChange: 'transform' }}
      >
        {/* Card with navigation */}
        <div className="relative w-56 h-72 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-xl shadow-black/40 bg-card group">
          <img
            src={rightImages[0]}
            alt="Featured portrait"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Navigation arrows */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <FaChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <FaChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>
      </motion.div>


    </section>
  );
};

export default Banner;
