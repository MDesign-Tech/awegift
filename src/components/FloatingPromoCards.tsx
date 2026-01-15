"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface PromoCard {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
}

interface FloatingPromoCardsProps {
    promoCards: PromoCard[];
    allImages?: string[];
    autoRotateInterval?: number;
}

// Position indices: 0=TL, 1=BL, 2=BR, 3=TR (clockwise from top-left)
const POSITION_STYLES = [
    { top: 0, left: 0, right: "auto", bottom: "auto" },       // 0: Top-Left
    { top: "auto", left: 0, right: "auto", bottom: 0 },       // 1: Bottom-Left
    { top: "auto", left: "auto", right: 0, bottom: 0 },       // 2: Bottom-Right
    { top: 0, left: "auto", right: 0, bottom: "auto" },       // 3: Top-Right
];

const FloatingPromoCards = ({
    promoCards,
    allImages = [],
    autoRotateInterval = 5000,
}: FloatingPromoCardsProps) => {
    const displayCards = useMemo(() => promoCards.slice(0, 4), [promoCards]);

    // Track which position each card is at
    const [cardPositions, setCardPositions] = useState([0, 1, 2, 3]);
    const [cardImages, setCardImages] = useState<string[]>(
        displayCards.map((card) => card.image || "")
    );
    const [isHovering, setIsHovering] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const mergeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setShouldAnimate(!mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setShouldAnimate(!e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    const getRandomImage = useCallback((currentImage: string) => {
        if (allImages.length <= 1) return currentImage;
        const availableImages = allImages.filter((img) => img !== currentImage);
        return availableImages[Math.floor(Math.random() * availableImages.length)] || currentImage;
    }, [allImages]);

    // Rotate: TL→BL→BR→TR→TL (clockwise)
    const rotateCards = useCallback(() => {
        if (!shouldAnimate) return;

        setCardPositions((prev) => prev.map((pos) => (pos + 1) % 4));
        setCardImages((prev) => prev.map((img) => getRandomImage(img)));
    }, [getRandomImage, shouldAnimate]);

    useEffect(() => {
        if (isHovering || !shouldAnimate) return;
        const interval = setInterval(rotateCards, autoRotateInterval);
        return () => clearInterval(interval);
    }, [isHovering, autoRotateInterval, rotateCards, shouldAnimate]);

    const handleHover = useCallback(async () => {
        if (!shouldAnimate || isMerging) return;

        setIsHovering(true);
        setIsMerging(true);

        // Clear any existing timeout
        if (mergeTimeoutRef.current) {
            clearTimeout(mergeTimeoutRef.current);
        }

        // Merge phase
        mergeTimeoutRef.current = setTimeout(() => {
            // Explode with rotation
            setCardPositions((prev) => prev.map((pos) => (pos + 1) % 4));
            setCardImages((prev) => prev.map((img) => getRandomImage(img)));

            setTimeout(() => {
                setIsMerging(false);
            }, 50);
        }, 350);
    }, [getRandomImage, shouldAnimate, isMerging]);

    const handleLeave = () => {
        setIsHovering(false);
    };

    return (
        <div
            className="relative w-full h-full min-h-[350px] lg:min-h-[400px]"
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
        >
            {/* Glow effect on merge */}
            <AnimatePresence>
                {isMerging && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-24 h-24 rounded-full"
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{
                                scale: [0, 1.5, 2.5],
                                opacity: [0.8, 0.5, 0]
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{
                                background: "radial-gradient(circle, hsl(var(--hero-primary) / 0.6) 0%, transparent 70%)",
                                boxShadow: "0 0 60px 30px hsl(var(--hero-primary) / 0.3)",
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cards Grid Container */}
            <div className="relative w-full h-full p-1">
                {displayCards.map((card, cardIndex) => {
                    const currentPosIndex = cardPositions[cardIndex];
                    const posStyle = POSITION_STYLES[currentPosIndex];

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute"
                            style={{
                                width: "calc(50% - 6px)",
                                height: "calc(50% - 6px)",
                            }}
                            animate={{
                                top: isMerging ? "25%" : posStyle.top,
                                left: isMerging ? "25%" : posStyle.left,
                                right: isMerging ? "25%" : posStyle.right,
                                bottom: isMerging ? "25%" : posStyle.bottom,
                                scale: isMerging ? 0.4 : 1,
                                opacity: isMerging ? 0.8 : 1,
                                zIndex: isMerging ? 10 : 1,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                mass: 0.8,
                            }}
                        >
                            <motion.div
                                className="w-full h-full overflow-hidden bg-white p-4 flex flex-col shadow-card transition-shadow cursor-pointer relative rounded-lg"
                                whileHover={!isMerging ? {
                                    scale: 1.03,
                                    zIndex: 20,
                                    boxShadow: "var(--shadow-card-hover)",
                                } : {}}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Blurred Background Image */}
                                <div className="absolute inset-0 overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={`bg-${cardImages[cardIndex]}`}
                                            src={cardImages[cardIndex] || "/placeholder.svg"}
                                            alt=""
                                            className="w-full h-full object-cover scale-110 blur-xl opacity-60"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.6 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                        />
                                    </AnimatePresence>
                                    {/* Dark overlay for better contrast */}
                                    <div className="absolute inset-0 bg-card/40" />
                                </div>

                                {/* Card Image */}
                                <div className="relative overflow-visible flex-1 z-10">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={cardImages[cardIndex]}
                                            src={cardImages[cardIndex] || "/placeholder.svg"}
                                            alt={card.title}
                                            className="w-full h-full object-cover"
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                        />
                                    </AnimatePresence>

                                    {/* Subtle overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-card/20 to-transparent" />
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default FloatingPromoCards;
