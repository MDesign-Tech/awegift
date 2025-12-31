"use client"

import { useState, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface GiftMascotProps {
    size?: number
}

const GiftMascot = ({ size = 200 }: GiftMascotProps) => {
    const [isHovered, setIsHovered] = useState(false)

    // Mouse position for eye tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth out the mouse movement
    const springConfig = { damping: 25, stiffness: 150 }
    const smoothMouseX = useSpring(mouseX, springConfig)
    const smoothMouseY = useSpring(mouseY, springConfig)

    // Map mouse position to eye movement range
    // Assuming window size, but we'll update with event listener
    const eyeX = useTransform(smoothMouseX, [0, window.innerWidth], [-5, 5])
    const eyeY = useTransform(smoothMouseY, [0, window.innerHeight], [-5, 5])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [mouseX, mouseY])

    return (
        <motion.div
            className="relative cursor-pointer"
            style={{ width: size, height: size }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
                scale: isHovered ? 1.05 : 1,
                y: isHovered ? -10 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Glow Effect */}
            <motion.div
                className="absolute inset-0 bg-[#ff6b2c] rounded-none blur-3xl opacity-0"
                animate={{ opacity: isHovered ? 0.3 : 0 }}
                transition={{ duration: 0.3 }}
            />

            {/* Main Box Body */}
            <div className="absolute inset-x-[10%] bottom-0 top-[20%] bg-[#ed4c07] shadow-lg flex items-center justify-center overflow-hidden border-2 border-[#101828]">
                {/* Face */}
                <div className="flex gap-8 z-10">
                    {/* Left Eye */}
                    <div className="relative w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-black">
                        <motion.div
                            className="w-3 h-3 bg-black rounded-full"
                            style={{ x: eyeX, y: eyeY }}
                        />
                    </div>
                    {/* Right Eye */}
                    <div className="relative w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-black">
                        <motion.div
                            className="w-3 h-3 bg-black rounded-full"
                            style={{ x: eyeX, y: eyeY }}
                        />
                    </div>
                </div>

                {/* Mouth - Appears on Hover */}
                <motion.div
                    className="absolute bottom-8 w-6 h-3 border-b-4 border-black rounded-full"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: isHovered ? 1 : 0, opacity: isHovered ? 1 : 0 }}
                />
            </div>

            {/* Horizontal Ribbon */}
            <div className="absolute inset-x-0 top-[40%] h-[15%] bg-[#ff6b2c] border-y-2 border-[#101828]" />

            {/* Vertical Ribbon */}
            <div className="absolute inset-y-[20%] left-[45%] w-[10%] bg-[#ff6b2c] border-x-2 border-[#101828]" />

            {/* Lid */}
            <motion.div
                className="absolute inset-x-0 top-0 h-[25%] bg-[#ed4c07] border-2 border-[#101828] z-20"
                animate={{
                    y: isHovered ? -5 : 0,
                    rotate: isHovered ? -2 : 0
                }}
            >
                {/* Lid Ribbon Vertical */}
                <div className="absolute inset-y-0 left-[45%] w-[10%] bg-[#ff6b2c] border-x-2 border-[#101828]" />
            </motion.div>

            {/* Bow */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 z-30 w-[40%] h-[20%]">
                <div className="absolute left-[10%] top-0 w-[40%] h-full bg-[#ff6b2c] rounded-tl-lg border-2 border-[#101828] skew-x-12 origin-bottom-right" />
                <div className="absolute right-[10%] top-0 w-[40%] h-full bg-[#ff6b2c] rounded-tr-lg border-2 border-[#101828] -skew-x-12 origin-bottom-left" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[60%] bg-[#ff6b2c] border-2 border-[#101828] rounded-sm" />
            </div>

        </motion.div>
    )
}

export default GiftMascot
