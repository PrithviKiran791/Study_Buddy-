"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LampContainer = ({
  children,
  className,
  childrenClassName,
  lampColor = "cyan", // "cyan" | "white" | "monochrome"
}) => {
  const isWhite = lampColor === "white" || lampColor === "monochrome";

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-start overflow-x-hidden overflow-y-auto w-full z-0",
        isWhite ? "bg-black" : "bg-slate-950",
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-[28rem] flex w-full items-center justify-center isolate z-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={cn(
            "absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic text-white [--conic-position:from_70deg_at_center_top]",
            isWhite
              ? "from-white/70 via-neutral-400/20 to-transparent"
              : "from-cyan-500 via-transparent to-transparent"
          )}
        >
          <div
            className={cn(
              "absolute w-[100%] left-0 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]",
              isWhite ? "bg-black" : "bg-slate-950"
            )}
          />
          <div
            className={cn(
              "absolute w-40 h-[100%] left-0 bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]",
              isWhite ? "bg-black" : "bg-slate-950"
            )}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={cn(
            "absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic text-white [--conic-position:from_290deg_at_center_top]",
            isWhite
              ? "from-transparent via-neutral-400/20 to-white/70"
              : "from-transparent via-transparent to-cyan-500"
          )}
        >
          <div
            className={cn(
              "absolute w-40 h-[100%] right-0 bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]",
              isWhite ? "bg-black" : "bg-slate-950"
            )}
          />
          <div
            className={cn(
              "absolute w-[100%] right-0 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]",
              isWhite ? "bg-black" : "bg-slate-950"
            )}
          />
        </motion.div>
        <div
          className={cn(
            "absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 blur-2xl",
            isWhite ? "bg-black" : "bg-slate-950"
          )}
        ></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div
          className={cn(
            "absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full opacity-50 blur-3xl",
            isWhite ? "bg-neutral-200/40" : "bg-cyan-500"
          )}
        ></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full blur-2xl",
            isWhite ? "bg-white/60" : "bg-cyan-400"
          )}
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem]",
            isWhite ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]" : "bg-cyan-400"
          )}
        ></motion.div>

        <div
          className={cn(
            "absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem]",
            isWhite ? "bg-black" : "bg-slate-950"
          )}
        ></div>
      </div>

      <div className={cn("relative z-20 flex flex-col items-center w-full px-4 pt-20 md:pt-24 pb-16", childrenClassName)}>
        {children}
      </div>
    </div>
  );
};

export function LampDemo() {
  return (
    <LampContainer>
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        Build lamps <br /> the right way
      </motion.h1>
    </LampContainer>
  );
}

export default LampContainer;
