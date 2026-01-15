"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import GiftButton from '@/components/GiftButton';
import GiftCharacter from '@/components/GiftCharacter';
import Container from '@/components/Container';
import { bannerImages } from '@/assets';

const Banner = () => {
  const heroRef = useRef<HTMLElement>(null);
  const scrollProgress = useScrollProgress(heroRef);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [rightImages, setRightImages] = useState<string[]>([]);
  const [extendedImages, setExtendedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(1); // Start at 1 to show first real image
  const leftControls = useAnimation();
  const rightControls = useAnimation();

  // Sample images for floating cards
  const leftImages = bannerImages.map(img => img.src).slice(0, 4); // First 4 images for left side

  // Entrance animation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Check screen size for scaling
  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Fetch product images for right banner
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const response = await fetch('/api/gallery');
        const data = await response.json();
        if (data.images && data.images.length > 0) {
          setRightImages(data.images);
          // Create extended array for infinite scrolling: [last, ...images, first]
          const extended = [data.images[data.images.length - 1], ...data.images, data.images[0]];
          setExtendedImages(extended);
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
      }
    };
    fetchGalleryImages();
  }, []);

  // Auto slide functionality
  useEffect(() => {
    if (extendedImages.length <= 2) return; // Need at least original images + 2 duplicates

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= extendedImages.length - 1) {
          // Reached the duplicated first image, reset to actual first
          setTimeout(() => {
            rightControls.set({ x: '-100%' });
            setCurrentImageIndex(1);
          }, 500); // After animation completes
          return nextIndex;
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [extendedImages.length, rightControls]);

  // Navigation functions
  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= extendedImages.length - 1) {
        // Reached the duplicated first image, reset to actual first
        setTimeout(() => {
          rightControls.set({ x: '-100%' });
          setCurrentImageIndex(1);
        }, 500);
        return nextIndex;
      }
      return nextIndex;
    });
  };

  const goToPrev = () => {
    setCurrentImageIndex((prevIndex) => {
      const prevIndexValue = prevIndex - 1;
      if (prevIndexValue <= 0) {
        // Reached the duplicated last image, reset to actual last
        setTimeout(() => {
          rightControls.set({ x: `${-(extendedImages.length - 2) * 100}%` });
          setCurrentImageIndex(extendedImages.length - 2);
        }, 500);
        return prevIndexValue;
      }
      return prevIndexValue;
    });
  };


  // Update animation when image index changes
  useEffect(() => {
    if (extendedImages.length > 0) {
      rightControls.start({
        x: `${-currentImageIndex * 100}%`,
      });
    }
  }, [currentImageIndex, extendedImages.length, rightControls]);

  // Calculate transforms based on scroll progress
  const leftTranslateX = -120 + (isLoaded ? 120 : 0) - (scrollProgress * 1300);
  const rightTranslateX = 120 - (isLoaded ? 120 : 0) + (scrollProgress * 1300);
  const videoScale = isLargeScreen ? 1 + (scrollProgress * 5) : 1;

  return (
    <div className='w-full bg-light-bg overflow-hidden'>
    <Container className='container  w-full mx-auto overflow-hidden'>
    <section
      ref={heroRef}
      className="relative gap-2 py-4 flex w-full overflow-hidden h-full items-center justify-center lg:justify-between"
      style={{ willChange: 'transform' }}
    >
      
      {/* Left Floating Cards */}
      <motion.div
        className="hidden lg:flex translate-x-18 -translate-y-24 flex-col gap-4 flex-shrink-0"
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
        <div className="relative bg-white md:w-70 md:h-max rounded-2xl overflow-hidden">
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
              className="w-12 bg-white h-12 md:w-16 md:h-16 rounded-lg overflow-hidden shadow-lg shadow-black/30 bg-card"
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

      {/* Central Video Container */}
      <motion.div
        className="flex flex-col items-center justify-center flex-1"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          
        >
          {/* Text Content */}
          <div className="flex flex-col items-center justify-center gap-4 mb-4">
            <motion.h1
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-dark-text leading-[1.1] text-center"
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
        </motion.div>
        <div className="relative w-full h-max rounded-2xl overflow-hidden z-2" 
        style={{
          scale: videoScale,
          transition: 'scale 0.1s ease-out',
        }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full object-cover"
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

      {/* Right Floating Cards */}
      <motion.div
        className="hidden lg:flex -translate-x-18 -translate-y-24 flex-col items-end flex-shrink-0"
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
        <div className="relative bg-white md:w-60 md:h-80 rounded-2xl overflow-hidden group">
          <motion.div
            className="flex w-full h-full"
            animate={rightControls}
            initial={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
          >
            {extendedImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Product ${index + 1}`}
                className="md:w-60 md:h-80 object-cover flex-shrink-0"
              />
            ))}
          </motion.div>

          {/* Navigation arrows */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={goToPrev}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <FaChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <FaChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Slide indicators - show max 3 dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: Math.min(rightImages.length, 3) }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === ((currentImageIndex - 1) % 3) ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
    </Container>
    </div>
  );
};

export default Banner;

