"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PlusCircle, Shield, MessageSquare, ArrowRight } from "lucide-react";
import { EMAIL } from "@/app/constants";

export default function GetStartedSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      number: "01",
      title: "Install the Bot",
      description:
        "Install the bot in your workspace by clicking on Add to Slack",
      icon: <PlusCircle className="w-6 h-6" />,
    },
    {
      number: "02",
      title: "Allow Permissions",
      description: "Grant necessary permissions when prompted",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      number: "03",
      title: "Start Using",
      description: "Invite Zap to channel and Type /zap-ask [question]",
      icon: <MessageSquare className="w-6 h-6" />,
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-[#0a0a0a]" ref={ref}>
      <div className="absolute inset-0  bg-gradient-to-b from-[#000000] to-[#121212] z-10"></div>

      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-['Russo_One'] text-3xl md:text-4xl mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Adding Zap to your Slack workspace is quick and easy. No complicated
            setup required.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fef800]/10 via-[#fef800]/30 to-[#fef800]/10 transform -translate-y-1/2 hidden md:block"></div>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative z-10"
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {/* Step card */}
                <div
                  className={`
                    relative rounded-2xl p-6 transition-all duration-300
                    ${
                      activeStep === index
                        ? "bg-gradient-to-br from-[#1a1a1a] to-[#222] border border-[#fef800]/30 shadow-[0_0_15px_rgba(254,248,0,0.15)]"
                        : "bg-gradient-to-br from-[#1a1a1a] to-[#222] border border-white/10"
                    }
                  `}
                >
                  {/* Step number and icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${
                          activeStep === index
                            ? "bg-[#fef800] text-[#121212]"
                            : "bg-gradient-to-br from-[#222] to-[#333] text-[#fef800]"
                        }
                      `}
                    >
                      {step.icon}
                    </div>
                    <div
                      className={`
                        text-2xl font-['Russo_One'] transition-colors duration-300
                        ${
                          activeStep === index
                            ? "text-[#fef800]"
                            : "text-white/40"
                        }
                      `}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Step content */}
                  <h3 className="font-['Russo_One'] text-xl mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/70">{step.description}</p>

                  {/* Arrow connector for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20">
                      <ArrowRight
                        className={`w-6 h-6 ${
                          activeStep === index || activeStep === index + 1
                            ? "text-[#fef800]"
                            : "text-white/30"
                        } transition-colors duration-300`}
                      />
                    </div>
                  )}

                  {/* Glowing effect when active */}
                  {activeStep === index && (
                    <>
                      <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-[#fef800]/10 rounded-full blur-xl"></div>
                      <div className="absolute -top-2 -left-2 w-16 h-16 bg-[#fef800]/10 rounded-full blur-xl"></div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <Button className="bg-[#fef800] text-[#121212] hover:bg-[#fef800]/90 font-medium text-lg px-8 py-6 relative overflow-hidden group">
              <span className="relative z-10">Add to Slack</span>
              <motion.span
                className="absolute inset-0 bg-[#fef800]/50 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              ></motion.span>
            </Button>

            <div className="mt-6 text-white/50 text-sm">
              Need help?{" "}
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`}
                target="_blank"
                className="text-[#fef800] hover:underline"
              >
                Contact our support team
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
