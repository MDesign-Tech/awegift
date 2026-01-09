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
            className="relative inline-flex items-center justify-center gap-3 text-theme-color px-4 py-2 font-bold text-md overflow-hidden group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
            <span className="relative z-1 flex items-center gap-3">
                {/* Gift Icon with Unboxing Effect */}
                <motion.span
                    className="relative"
                    animate={isHovered ? {
                        rotate: [-5, 5, -5, 5, 0],
                        y: [0, -3, 0, -3, 0],
                    } : {}}
                    transition={{ duration: 0.5 }}
                >
                    <FaGift className="w-4 h-4" />

                    {/* Sparkles on hover */}
                    {isHovered && (
                        <>
                            <motion.span
                                className="absolute -top-1 -right-2 w-2 h-2 bg-accent-color rounded-full"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [-5, -15] }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.3 }}
                            />
                            <motion.span
                                className="absolute -top-0 -left-1 w-1.5 h-1.5 bg-accent-color rounded-full"
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
