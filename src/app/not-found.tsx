"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        // Animate 404 number
        gsap.from(".error-code", {
          scale: 0.5,
          opacity: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
        });

        // Animate text
        gsap.from(".error-text", {
          y: 30,
          opacity: 0,
          duration: 0.6,
          delay: 0.3,
          ease: "power2.out",
        });

        // Animate button
        gsap.from(".error-button", {
          y: 20,
          opacity: 0,
          duration: 0.5,
          delay: 0.5,
          ease: "power2.out",
        });

        // Floating animation for decorative elements
        gsap.to(".float-element", {
          y: -10,
          duration: 2,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-80px-73px)] flex flex-col items-center justify-center px-6"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="float-element absolute top-1/4 left-1/4 w-64 h-64 bg-[#A6ED45]/5 rounded-full blur-3xl" />
        <div
          className="float-element absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A6ED45]/3 rounded-full blur-3xl"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 text-center space-y-8">
        {/* 404 Number */}
        <div className="error-code relative">
          <h1 className="font-manjari text-[150px] md:text-[200px] leading-none font-bold text-[#A6ED45]">
            404
          </h1>
        </div>

        {/* Error message */}
        <div className="error-text space-y-4">
          <h2 className="font-manjari text-3xl md:text-4xl font-bold text-white">
            Page not found
          </h2>
          <p className="font-manjari text-lg text-[#A3A1A1] max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        {/* Action buttons */}
        <div className="error-button flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/">
            <Button className="rounded-[72px] bg-[#A6ED45] hover:bg-[#95e830] text-[#25262A] font-manjari font-bold text-[15px] w-[180px] h-[50px]">
              <span className="translate-y-[2px]">Go Home</span>
            </Button>
          </Link>
          <Link href="/aytokens">
            <Button
              variant="outline"
              className="rounded-[72px] border-[#A6ED45]/50 hover:border-[#A6ED45] hover:bg-[#A6ED45]/10 text-white font-manjari font-bold text-[15px] w-[180px] h-[50px]"
            >
              <span className="translate-y-[2px]">Explore ayTOKENs</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
