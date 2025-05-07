"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Database } from "lucide-react";

export default function PrivacySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  const privacyFeatures = [
    {
      icon: <Shield className="w-8 h-8 text-[#fef800]" />,
      title: "Data Protection",
      description:
        "Your conversations and documents never leave your workspace without your explicit permission.",
    },
    // {
    //   icon: <Lock className="w-8 h-8 text-[#fef800]" />,
    //   title: "End-to-End Encryption",
    //   description:
    //     "All data is encrypted in transit and at rest using industry-standard protocols.",
    // },
    // {
    //   icon: <Eye className="w-8 h-8 text-[#fef800]" />,
    //   title: "Transparent Access",
    //   description:
    //     "Detailed logs of who accessed what information and when, with admin controls.",
    // },
    {
      icon: <Database className="w-8 h-8 text-[#fef800]" />,
      title: "No Data Retention",
      description:
        "We don't store your data longer than needed, and you control retention policies.",
    },
  ];

  return (
    <section className="py-20 bg-[#000000] relative" ref={ref}>
      <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 z-10 custom-gradient-reverse"></div>
      <div className="absolute inset-0 z-9 security-grid"></div>
      </div>
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-12">
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
            Privacy First, Always
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            We built Zap with security and privacy as core principles, not
            afterthoughts.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {privacyFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 relative overflow-hidden group"
            >
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-[#fef800]/5 rounded-full blur-xl group-hover:bg-[#fef800]/10 transition-all duration-500"></div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#fef800]/10 rounded-lg">
                  {feature.icon}
                </div>

                <div>
                  <h3 className="font-['Russo_One'] text-xl mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 h-1 bg-[#fef800]/30 w-0 group-hover:w-full transition-all duration-700"></div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
          }
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-[#fef800]/5 animate-pulse"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-40 h-40 rounded-full bg-[#fef800]/10 animate-pulse"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full bg-[#fef800]/15 animate-pulse"
                style={{ animationDelay: "600ms" }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-20 h-20 text-[#fef800]" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
