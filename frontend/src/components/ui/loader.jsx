"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LoaderOne({ className }) {
  return (
    <div className={cn("flex items-center justify-center p-2", className)}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <motion.div
          className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary border-r-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner reverse rotating ring */}
        <motion.div
          className="absolute w-6 h-6 rounded-full border-2 border-blue-400/30 border-b-blue-400 border-l-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
          animate={{ rotate: -360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        {/* Center glowing orb */}
        <motion.div
          className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)]"
          animate={{ scale: [0.75, 1.25, 0.75], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export function LoaderOneDemo() {
  return <LoaderOne />;
}
