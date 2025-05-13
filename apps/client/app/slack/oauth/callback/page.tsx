"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink,
  HelpCircle,
  FileText,
  MessageSquare,
} from "lucide-react";

export default function InstallationSuccessPage() {
  const [animationComplete] = useState(false);
  // useEffect(() => {
  //   // Trigger success animation after a short delay
  //   const timer = setTimeout(() => {
  //     setAnimationComplete(true)
  //     setShowConfetti(true)

  //     // Hide confetti after animation
  //     const confettiTimer = setTimeout(() => {
  //       setShowConfetti(false)
  //     }, 3000)

  //     return () => clearTimeout(confettiTimer)
  //   }, 800)

  //   return () => clearTimeout(timer)
  // }, [])

  return (
    <main className="min-h-screen bg-[#121212] text-white relative overflow-hidden flex flex-col items-center">
      {/* Main content */}
      <div className="container max-w-3xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center z-10 relative">
        {/* Success animation */}
        <div className="mb-8 relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-32 h-32 mx-auto"
          >
            {/* Circle background */}
            <motion.div
              className="absolute inset-0 rounded-full bg-[#fef800]/10"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />

            {/* Success checkmark */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: animationComplete ? 1 : 0,
                opacity: animationComplete ? 1 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Pulse effect */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 rounded-full border-2 border-[#fef800]"
              />
            </motion.div>
            <div className="w-32 h-32 rounded-full bg-[#000000] flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="zap-logo"
                className="w-32 h-32 rounded-full"
              />
            </div>
          </motion.div>
        </div>

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-12"
        >
          <h1 className="font-['Russo_One'] text-4xl md:text-5xl mb-4">
            Installation Complete!
          </h1>
          <p className="text-white/80 text-xl max-w-lg mx-auto">
            Zap is now successfully installed in your Slack workspace and ready
            to use.
          </p>
        </motion.div>

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full mb-16"
        >
          <h2 className="font-['Russo_One'] text-2xl mb-6 text-center">
            Next Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageSquare className="w-8 h-8 text-[#fef800]" />,
                title: "Invite Zap to Channels",
                description:
                  "Type @Zap in any channel where you want to use the assistant.",
              },
              {
                icon: <HelpCircle className="w-8 h-8 text-[#fef800]" />,
                title: "See Available Commands",
                description:
                  "Type /zap-help in Slack to see all available commands.",
              },
              {
                icon: <FileText className="w-8 h-8 text-[#fef800]" />,
                title: "Ask Your First Question",
                description:
                  "Try asking Zap a question with /zap-ask [question].",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 hover:border-[#fef800]/30 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#fef800]/10 flex items-center justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-['Russo_One'] text-xl mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/70">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="w-full mb-16"
        >
          <h2 className="font-['Russo_One'] text-2xl mb-6 text-center">
            Resources
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: "Documentation", href: "/docs" },
              { label: "FAQ", href: "/faq" },
              { label: "Support", href: "/support" },
            ].map((resource, index) => (
              <Link
                key={index}
                href={resource.href}
                className="flex items-center gap-2 px-5 py-3 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 hover:border-[#fef800]/30 rounded-lg transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4 text-[#fef800]" />
                <span>{resource.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Return to dashboard button
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mb-16"
        >
          <Link href="/">
            <Button className="bg-[#fef800] text-[#121212] hover:bg-[#fef800]/90 font-medium px-8 py-6 h-auto text-lg">
              Return to Dashboard
            </Button>
          </Link>
        </motion.div> */}
      </div>

      {/* Wave animation */}
      <WaveAnimation />

      {/* Footer */}
      <div className="w-full py-6 px-4 text-center text-white/50 text-sm z-10">
        © {new Date().getFullYear()} Zap. All rights reserved.
      </div>
    </main>
  );
}

function WaveAnimation() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 md:h-80 overflow-hidden z-0">
      {/* First wave */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{
          background:
            "linear-gradient(90deg, rgba(254, 248, 0, 0.05) 0%, rgba(254, 248, 0, 0.1) 50%, rgba(254, 248, 0, 0.05) 100%)",
          maskImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' class='shape-fill'%3E%3C/path%3E%3C/svg%3E\")",
          maskSize: "100% 100%",
          maskRepeat: "no-repeat",
        }}
        animate={{
          x: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Second wave */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background:
            "linear-gradient(90deg, rgba(254, 248, 0, 0.03) 0%, rgba(254, 248, 0, 0.07) 50%, rgba(254, 248, 0, 0.03) 100%)",
          maskImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' class='shape-fill'%3E%3C/path%3E%3C/svg%3E\")",
          maskSize: "100% 100%",
          maskRepeat: "no-repeat",
        }}
        animate={{
          x: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Third wave */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{
          background:
            "linear-gradient(90deg, rgba(254, 248, 0, 0.02) 0%, rgba(254, 248, 0, 0.05) 50%, rgba(254, 248, 0, 0.02) 100%)",
          maskImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' class='shape-fill'%3E%3C/path%3E%3C/svg%3E\")",
          maskSize: "100% 100%",
          maskRepeat: "no-repeat",
        }}
        animate={{
          x: [0, -80, 0],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-full"
        style={{
          background:
            "linear-gradient(to top, rgba(18, 18, 18, 0.8) 0%, rgba(18, 18, 18, 0) 100%)",
        }}
      />
    </div>
  );
}
