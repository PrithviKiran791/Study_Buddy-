import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(10, 10, 12)",
  gradientBackgroundEnd = "rgb(0, 0, 0)",
  firstColor = "130, 130, 142",
  secondColor = "225, 225, 235",
  thirdColor = "38, 38, 44",
  fourthColor = "175, 175, 188",
  fifthColor = "70, 70, 80",
  pointerColor = "245, 245, 255",
  size = "80%",
  blendingValue = "screen",
  children,
  className,
  interactive = true,
  containerClassName,
}) => {
  const interactiveRef = useRef(null);
  const containerRef = useRef(null);
  const pos = useRef({ curX: 0, curY: 0, tgX: 0, tgY: 0 });

  useEffect(() => {
    const el = containerRef.current || document.body;
    el.style.setProperty("--gradient-background-start", gradientBackgroundStart);
    el.style.setProperty("--gradient-background-end", gradientBackgroundEnd);
    el.style.setProperty("--first-color", firstColor);
    el.style.setProperty("--second-color", secondColor);
    el.style.setProperty("--third-color", thirdColor);
    el.style.setProperty("--fourth-color", fourthColor);
    el.style.setProperty("--fifth-color", fifthColor);
    el.style.setProperty("--pointer-color", pointerColor);
    el.style.setProperty("--size", size);
    el.style.setProperty("--blending-value", blendingValue);
  }, [
    gradientBackgroundStart,
    gradientBackgroundEnd,
    firstColor,
    secondColor,
    thirdColor,
    fourthColor,
    fifthColor,
    pointerColor,
    size,
    blendingValue,
  ]);

  useEffect(() => {
    if (!interactive) return;

    let rafId;
    const loop = () => {
      if (interactiveRef.current) {
        pos.current.curX += (pos.current.tgX - pos.current.curX) / 18;
        pos.current.curY += (pos.current.tgY - pos.current.curY) / 18;
        interactiveRef.current.style.transform = `translate(${Math.round(
          pos.current.curX
        )}px, ${Math.round(pos.current.curY)}px)`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const onGlobalMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        pos.current.tgX = e.clientX - rect.left;
        pos.current.tgY = e.clientY - rect.top;
      } else {
        pos.current.tgX = e.clientX;
        pos.current.tgY = e.clientY;
      }
    };

    window.addEventListener("mousemove", onGlobalMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onGlobalMouseMove);
    };
  }, [interactive]);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full w-full relative overflow-hidden bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
        containerClassName
      )}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className={cn(
          "gradients-container absolute inset-0 pointer-events-none overflow-hidden blur-lg",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
        )}
      >
        {/* Blob 1 - Vertical Float (Silver Grey) */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.75)_0,_rgba(var(--first-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:center_center]`,
            `animate-first`,
            `opacity-100`
          )}
        />

        {/* Blob 2 - Reverse Circle (Soft White) */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.85)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%-400px)]`,
            `animate-second`,
            `opacity-95`
          )}
        />

        {/* Blob 3 - Linear Circle (Graphite) */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.9)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%+400px)]`,
            `animate-third`,
            `opacity-90`
          )}
        />

        {/* Blob 4 - Horizontal Wave (Light Grey) */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%-200px)]`,
            `animate-fourth`,
            `opacity-80`
          )}
        />

        {/* Blob 5 - Large Orbit (Charcoal Slate) */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.85)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%-800px)_calc(50%+800px)]`,
            `animate-fifth`,
            `opacity-90`
          )}
        />

        {/* Interactive Pointer Follower (Glowing White Aura) */}
        {interactive && (
          <div
            ref={interactiveRef}
            className={cn(
              `absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.6)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]`,
              `[mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2`,
              `opacity-65`
            )}
          />
        )}
      </div>

      {children && (
        <div className={cn("relative z-10 w-full h-full", className)}>
          {children}
        </div>
      )}
    </div>
  );
};

export default BackgroundGradientAnimation;
