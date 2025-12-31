"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaGift } from "react-icons/fa";

interface GiftButtonProps {
    href: string;
    children: React.ReactNode;
}

const GiftButton = ({ href, children }: GiftButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.a
            href={href}
            className="relative inline-flex items-center justify-center gap-3 bg-theme-color text-theme-white px-8 py-4 font-bold text-lg overflow-hidden group shadow-lg rounded-lg"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
                boxShadow: isHovered
                    ? "0 12px 40px -8px hsl(var(--hero-primary) / 0.6), 0 0 60px hsl(var(--hero-accent) / 0.3)"
                    : "0 4px 20px -4px hsl(var(--hero-primary) / 0.4)",
            }}
        >
            {/* Background Glow Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
                animate={{
                    backgroundPosition: isHovered ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%",
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
            />

            {/* Content */}
            <span className="relative z-10 flex items-center gap-3">
                {/* Gift Icon with Unboxing Effect */}
                <motion.span
                    className="relative"
                    animate={isHovered ? {
                        rotate: [-5, 5, -5, 5, 0],
                        y: [0, -3, 0, -3, 0],
                    } : {}}
                    transition={{ duration: 0.5 }}
                >
                    <FaGift className="w-6 h-6" />

                    {/* Sparkles on hover */}
                    {isHovered && (
                        <>
                            <motion.span
                                className="absolute -top-2 -right-2 w-2 h-2 bg-white rounded-full"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [-5, -15] }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.3 }}
                            />
                            <motion.span
                                className="absolute -top-1 -left-2 w-1.5 h-1.5 bg-white rounded-full"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [-3, -12] }}
                                transition={{ duration: 0.5, delay: 0.2, repeat: Infinity, repeatDelay: 0.4 }}
                            />
                        </>
                    )}
                </motion.span>

                {children}

                {/* Arrow */}
                <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={isHovered ? { x: [0, 6, 0] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
            </span>
        </motion.a>
    );
};

export default GiftButton;
