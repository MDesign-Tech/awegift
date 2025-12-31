"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface GiftCharacterProps {
    className?: string;
}

const GiftCharacter = ({ className }: GiftCharacterProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { stiffness: 150, damping: 15 };
    const eyeX = useSpring(useTransform(mouseX, [-200, 200], [-8, 8]), springConfig);
    const eyeY = useSpring(useTransform(mouseY, [-200, 200], [-6, 6]), springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            mouseX.set(e.clientX - centerX);
            mouseY.set(e.clientY - centerY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return (
        <motion.div
            ref={containerRef}
            className={className}
            animate={{
                filter: "drop-shadow(0 8px 16px hsl(0 0% 0% / 0.1))",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                {/* Gift Box Base */}
                <motion.rect
                    x="30"
                    y="90"
                    width="140"
                    height="100"
                    rx="8"
                    fill="url(#giftGradient)"
                />

                {/* Gift Box Shadow */}
                <ellipse cx="100" cy="195" rx="60" ry="8" fill="hsl(220 13% 20% / 0.1)" />

                {/* Ribbon Vertical */}
                <motion.rect
                    x="88"
                    y="90"
                    width="24"
                    height="100"
                    fill="url(#ribbonGradient)"
                />

                {/* Gift Box Lid */}
                <motion.rect
                    x="20"
                    y="60"
                    width="160"
                    height="35"
                    rx="6"
                    fill="url(#giftGradient)"
                    style={{ transformOrigin: "center" }}
                />

                {/* Ribbon on Lid */}
                <motion.rect
                    x="85"
                    y="60"
                    width="30"
                    height="35"
                    fill="url(#ribbonGradient)"
                    style={{ transformOrigin: "center" }}
                />

                {/* Bow */}
                <motion.g style={{ transformOrigin: "100px 45px" }}>
                    {/* Bow Left Loop */}
                    <ellipse cx="70" cy="45" rx="25" ry="18" fill="url(#ribbonGradient)" />
                    <ellipse cx="70" cy="45" rx="15" ry="10" fill="hsl(var(--hero-primary))" />

                    {/* Bow Right Loop */}
                    <ellipse cx="130" cy="45" rx="25" ry="18" fill="url(#ribbonGradient)" />
                    <ellipse cx="130" cy="45" rx="15" ry="10" fill="hsl(var(--hero-primary))" />

                    {/* Bow Center */}
                    <circle cx="100" cy="52" r="14" fill="url(#ribbonGradient)" />
                </motion.g>

                {/* Eyes Container */}
                <g>
                    {/* Left Eye White */}
                    <ellipse cx="70" cy="135" rx="18" ry="20" fill="white" />
                    {/* Right Eye White */}
                    <ellipse cx="130" cy="135" rx="18" ry="20" fill="white" />

                    {/* Left Eye Pupil */}
                    <motion.g style={{ x: eyeX, y: eyeY }}>
                        <circle cx="70" cy="135" r="8" fill="hsl(220 13% 15%)" />
                        <circle cx="73" cy="132" r="3" fill="white" />
                    </motion.g>

                    {/* Right Eye Pupil */}
                    <motion.g style={{ x: eyeX, y: eyeY }}>
                        <circle cx="130" cy="135" r="8" fill="hsl(220 13% 15%)" />
                        <circle cx="133" cy="132" r="3" fill="white" />
                    </motion.g>
                </g>

                {/* Cute Blush */}
                <motion.ellipse
                    cx="48"
                    cy="150"
                    rx="10"
                    ry="6"
                    fill="hsl(0 70% 80% / 0.5)"
                    animate={isHovered ? { opacity: 0.8 } : { opacity: 0.4 }}
                />
                <motion.ellipse
                    cx="152"
                    cy="150"
                    rx="10"
                    ry="6"
                    fill="hsl(0 70% 80% / 0.5)"
                    animate={isHovered ? { opacity: 0.8 } : { opacity: 0.4 }}
                />

                {/* Smile */}
                <motion.path
                    d="M 85 160 Q 100 175 115 160"
                    stroke="hsl(220 13% 20%)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                />

                {/* Gradients */}
                <defs>
                    <linearGradient id="giftGradient" x1="30" y1="60" x2="170" y2="190" gradientUnits="userSpaceOnUse">
                        <stop stopColor="hsl(var(--hero-primary))" />
                        <stop offset="1" stopColor="hsl(var(--hero-accent))" />
                    </linearGradient>
                    <linearGradient id="ribbonGradient" x1="85" y1="30" x2="115" y2="190" gradientUnits="userSpaceOnUse">
                        <stop stopColor="hsl(45 100% 65%)" />
                        <stop offset="1" stopColor="hsl(38 90% 50%)" />
                    </linearGradient>
                </defs>
            </svg>
        </motion.div>
    );
};

export default GiftCharacter;
