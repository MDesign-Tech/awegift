"use client";
import { motion } from "framer-motion";
import Container from "./Container";
import GiftCharacter from "./GiftCharacter";
import GiftButton from "./GiftButton";

interface PromoCard {
    id: string;
    title: string;
    subtitle?: string;
    code?: string;
    ctaText?: string;
    image?: string;
    accentColor?: string;
}

interface HeroBannerProps {
    title: string;
    subtitle?: string;
    buttonText: string;
    buttonHref: string;
    images: Array<{ src: string; alt: string }>;
    promoCards: PromoCard[];
    backgroundColor?: string;
    textColor?: string;
    autoSlideInterval?: number;
}

const HeroBanner = ({
    title,
    subtitle,
    buttonText,
    buttonHref,
    images,
    promoCards,
    autoSlideInterval = 5000,
}: HeroBannerProps) => {
    // Extract all images for dynamic swapping
    const allProductImages = promoCards
        .map((card) => card.image)
        .filter((img): img is string => Boolean(img));

    return (
        <section className="relative overflow-hidden bg-light-bg">
            {/* Subtle background pattern */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <Container className="py-4 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-stretch">

                    {/* Left Section: Hero Content */}
                    <motion.div
                        className="lg:col-span-3 relative"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Clean Content Area (No Browser Frame) */}
                        <div className="h-full flex flex-col justify-center">

                            <div className="flex-1 flex flex-col sm:flex-row items-center gap-8 lg:gap-10">

                                {/* Text Content */}
                                <div className="flex-1  lg:text-left">
                                    <motion.h1
                                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-dark-text leading-[1.1] mb-20"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.5 }}
                                    >
                                        {title}
                                    </motion.h1>


                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    >
                                        <GiftButton href={buttonHref}>{buttonText}</GiftButton>
                                    </motion.div>

                                    {/* Trust indicators */}
                                    <motion.div
                                        className="flex items-center justify-center lg:justify-start gap-6 mt-8 text-sm text-muted-foreground"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7, duration: 0.5 }}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Free Delivery
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Easy Returns
                                        </span>
                                    </motion.div>
                                </div>

                                {/* Gift Character */}
                                <motion.div
                                    className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 flex-shrink-0"
                                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{
                                        delay: 0.4,
                                        duration: 0.6,
                                        type: "spring",
                                        stiffness: 200,
                                    }}
                                >
                                    <GiftCharacter className="w-full h-full cursor-pointer" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </Container>
        </section>
    );
};

export default HeroBanner;
