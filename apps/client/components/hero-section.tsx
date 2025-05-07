"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { redirectToInstallation } from "@/lib/redirectToInstall";

export default function HeroSection() {
  const glowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return;

      const rect = glowRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      glowRef.current.style.setProperty("--x", `${x}px`);
      glowRef.current.style.setProperty("--y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 ">
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] to-[#000000]" />

      <div className="container mx-auto px-4 relative z-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <h1 className="font-['Russo_One'] text-4xl md:text-5xl lg:text-6xl leading-tight">
              <span className="relative inline-block">
                <span
                  ref={glowRef}
                  className="relative z-10 text-[#fef800] glow-text"
                  style={
                    {
                      "--x": "50%",
                      "--y": "50%",
                    } as React.CSSProperties
                  }
                >
                  Zap
                </span>
                <span className="absolute top-0 left-0 w-full h-full bg-[#fef800]/20 blur-xl rounded-full -z-10"></span>
              </span>{" "}
              - Supercharge Your Slack with AI
              <span className="block h-1 w-40 bg-[#fef800] mt-4 animate-pulse"></span>
            </h1>
            <p className="text-xl text-white/80 md:pr-10 max-w-lg">
              Answer questions, summarize conversations, and analyze documents
              without leaving your workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button onClick={redirectToInstallation} className="bg-[#fef800] text-[#121212] hover:bg-[#fef800]/90 font-medium text-lg px-8 py-6 relative overflow-hidden group">
                <span className="relative z-10">Add to Slack</span>
                <span className="absolute inset-0 bg-[#fef800] opacity-50 group-hover:animate-pulse"></span>
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-medium text-lg px-8 py-6"
              >
                Watch Demo
              </Button>
            </div>
            <div className="mt-8">
              <p className="text-white/60 mb-2">Trusted by innovative teams</p>
              <div className="flex flex-wrap gap-6 items-center">
                {["Acme", "Globex", "Initech", "Umbrella"].map((company) => (
                  <div key={company} className="text-white/40 font-medium">
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-[#350d36] p-3 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-white font-medium">
                  Slack - Zap AI Assistant
                </div>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center text-white font-bold">
                    <img
                      src="./Male.png"
                      alt="avatar-male"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div>
                    <div className="font-medium">John Doe</div>
                    <div className="bg-[#222] p-3 rounded mt-1">
                      /zap-ask What was decided in yesterday's meeting?
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-sm bg-[#000000] flex items-center justify-center text-[#121212] font-bold">
                    <img
                      src="./logo.jpg"
                      alt="zap-logo"
                      className="w-full h-full object-cover rounded-sm"
                    />
                  </div>
                  <div>
                    <div className="font-medium">Zap</div>
                    <div className="bg-[#222] p-3 rounded mt-1">
                      <p>Based on yesterday's meeting, the team decided:</p>
                      <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>
                          Launch date for the new feature is set for{" "}
                          <span className="text-[#fef800]">October 15th</span>
                        </li>
                        <li>
                          Marketing campaign will begin{" "}
                          <span className="text-[#fef800]">
                            two weeks prior
                          </span>{" "}
                          to launch
                        </li>
                        <li>Sarah will lead the QA team for final testing</li>
                        <li>
                          Weekly progress updates will be shared in the
                          #project-alpha channel
                        </li>
                      </ol>
                      <p className="mt-2 text-xs text-white/50">
                        Source: Meeting transcript from Sept 28, 2023
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#fef800]/20 rounded-full blur-xl"></div>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#fef800]/10 rounded-full blur-xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
