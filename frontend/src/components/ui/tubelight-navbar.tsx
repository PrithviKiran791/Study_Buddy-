"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0]?.name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    if (typeof window !== "undefined") {
      const match = items.find((item) => item.url === window.location.pathname)
      if (match) setActiveTab(match.name)
    }

    return () => window.removeEventListener("resize", handleResize)
  }, [items])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 bg-background/80 border border-border backdrop-blur-xl py-1.5 px-2 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors duration-200 select-none",
                isActive
                  ? "text-primary font-bold"
                  : "text-foreground/70 hover:text-foreground",
              )}
            >
              {/* Text & Icon elevated above the lamp background */}
              <span className="relative z-10 hidden md:inline">{item.name}</span>
              <span className="relative z-10 md:hidden flex items-center justify-center">
                <Icon size={18} strokeWidth={2.5} />
              </span>

              {/* Animated Tubelight Active Pill & Lamp Effect */}
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full h-full bg-primary/10 border border-primary/20 rounded-full pointer-events-none"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                >
                  {/* Tubelight Lamp Fixture at the top edge */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full shadow-[0_0_8px_1px_hsl(var(--primary))]">
                    {/* Tight intense bloom */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-6 h-4 bg-primary/40 rounded-full blur-[3px]" />
                    
                    {/* Medium diffused halo */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-10 h-6 bg-primary/30 rounded-full blur-md" />
                    
                    {/* Wide ambient tubelight radiance */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-16 h-8 bg-primary/20 rounded-full blur-lg" />
                  </div>

                  {/* Downward light beam shining across the active tab pill */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-primary/25 via-primary/10 to-transparent" />
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
