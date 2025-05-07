"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Brain, FileText, Search, Shield, MessageSquare, Database} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface FeatureNode {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  angle: number
}

export default function Features() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // Define the features with their positions in the circle
  const features: FeatureNode[] = [
    {
      id: "context-aware",
      title: "Context Aware",
      description: "Understands conversation history to provide relevant answers",
      icon: <Brain className="w-6 h-6" />,
      angle: 0, // Top
    },
    {
      id: "summarization",
      title: "Summarization",
      description: "Distills lengthy conversations into key takeaways",
      icon: <FileText className="w-6 h-6" />,
      angle: 60, // Top right
    },
    {
      id: "document-analysis",
      title: "Document Analysis",
      description: "Extracts insights from PDFs, Word docs, and text files",
      icon: <Search className="w-6 h-6" />,
      angle: 120, // Bottom right
    },
    {
      id: "privacy-first",
      title: "Privacy First",
      description: "Processes data securely within your workspace",
      icon: <Shield className="w-6 h-6" />,
      angle: 180, // Bottom
    },
    {
      id: "thread-intelligence",
      title: "Thread Intelligence",
      description: "Follows conversation threads for coherent responses",
      icon: <MessageSquare className="w-6 h-6" />,
      angle: 240, // Bottom left
    },
    {
      id: "knowledge-base",
      title: "Knowledge Base",
      description: "Builds team knowledge repository from shared information",
      icon: <Database className="w-6 h-6" />,
      angle: 300, // Top left
    },
  ]

  // Auto-rotate through features for demonstration
  useEffect(() => {
    if (isMobile) return // Don't auto-rotate on mobile

    const interval = setInterval(() => {
      const currentIndex = activeFeature ? features.findIndex((f) => f.id === activeFeature) : -1

      const nextIndex = currentIndex === features.length - 1 || currentIndex === -1 ? 0 : currentIndex + 1

      setActiveFeature(features[nextIndex].id)
    }, 3000)

    return () => clearInterval(interval)
  }, [activeFeature, features, isMobile])

  // Calculate position based on angle and distance
  const getPosition = (angle: number, distance: number) => {
    const radian = (angle - 90) * (Math.PI / 180) // Adjust angle to start from top
    return {
      x: Math.cos(radian) * distance,
      y: Math.sin(radian) * distance,
    }
  }

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#0a0a0a] ">
      <div className="absolute inset-0 bg-[#000000] opacity-100 security-grid"></div>

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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-['Russo_One'] text-3xl md:text-4xl mb-4">Powerful AI Features</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Zap brings intelligent capabilities to your Slack workspace, enhancing team productivity and knowledge
            sharing.
          </p>
        </motion.div>

        {/* Features diagram - desktop version */}
        <div className="hidden md:block relative">
          <div
            ref={containerRef}
            className="relative mx-auto"
            style={{
              width: "800px",
              height: "800px",
              maxWidth: "100%",
              maxHeight: "80vh",
            }}
          >
            {/* Center Zap logo */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[#000000] border border-[#fef800]/20 flex items-center justify-center z-20"
              animate={{
                boxShadow: [
                  "0 0 20px 0px rgba(254, 248, 0, 0.3)",
                  "0 0 30px 5px rgba(254, 248, 0, 0.4)",
                  "0 0 20px 0px rgba(254, 248, 0, 0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <div className="relative">
                <img src="./logo.jpg" alt="zap-logo" className="rounded-full"></img>
                 {/* <Zap className="w-16 h-16 text-[#fef800]" />
                <motion.div
                  className="absolute inset-0 text-[#fef800]"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.8, 1.1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <Zap className="w-16 h-16" />
                </motion.div>  */}
              </div>
            </motion.div>

            {/* Feature nodes */}
            {features.map((feature) => {
              const position = getPosition(feature.angle, 300) // 300px distance from center
              const isActive = activeFeature === feature.id

              return (
                <div key={feature.id}>
                  {/* Connection line with flowing energy */}
                  <svg
                    className="absolute left-1/2 top-1/2 -z-10 pointer-events-none"
                    width="800"
                    height="800"
                    style={{ transform: "translate(-50%, -50%)" }}
                  >
                    {/* Base connection line */}
                    <line
                      x1="400"
                      y1="400"
                      x2={400 + position.x}
                      y2={400 + position.y}
                      stroke="#fef800"
                      strokeWidth="1.5"
                      strokeOpacity="0.3"
                    />

                    {/* Flowing energy particles toward center */}
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="2"
                      fill="#fef800"
                      fillOpacity="0.8"
                      animate={{
                        cx: [400 + position.x, 400],
                        cy: [400 + position.y, 400],
                        opacity: [0.8, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                        repeatDelay: Math.random() * 0.5,
                      }}
                    />

                    <motion.circle
                      cx="0"
                      cy="0"
                      r="1.5"
                      fill="#fef800"
                      fillOpacity="0.6"
                      animate={{
                        cx: [400 + position.x, 400],
                        cy: [400 + position.y, 400],
                        opacity: [0.6, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                        repeatDelay: Math.random() * 0.5,
                        delay: 0.7,
                      }}
                    />

                    {/* Highlighted connection when active */}
                    {isActive && (
                      <motion.line
                        x1="400"
                        y1="400"
                        x2={400 + position.x}
                        y2={400 + position.y}
                        stroke="#fef800"
                        strokeWidth="3"
                        strokeOpacity="0.8"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                      />
                    )}

                    {/* Pulsing energy when active */}
                    {isActive && (
                      <>
                        <motion.circle
                          cx="0"
                          cy="0"
                          r="3"
                          fill="#fef800"
                          fillOpacity="1"
                          animate={{
                            cx: [400 + position.x, 400],
                            cy: [400 + position.y, 400],
                            opacity: [1, 0],
                            r: [3, 5],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeOut",
                            repeatDelay: 0.2,
                          }}
                        />
                        <motion.circle
                          cx="0"
                          cy="0"
                          r="2.5"
                          fill="#fef800"
                          fillOpacity="0.8"
                          animate={{
                            cx: [400 + position.x, 400],
                            cy: [400 + position.y, 400],
                            opacity: [0.8, 0],
                            r: [2.5, 4],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeOut",
                            repeatDelay: 0.2,
                            delay: 0.4,
                          }}
                        />
                      </>
                    )}
                  </svg>

                  {/* Feature node */}
                  <motion.div
                    className={cn("absolute w-48 flex flex-col items-center", "transition-all duration-300")}
                    style={{
                      left: `calc(50% + ${position.x}px)`,
                      top: `calc(50% + ${position.y}px)`,
                      transform: "translate(-50%, -20%)",
                    }}
                    // whileHover={{ scale: 1.05 }}
                    onHoverStart={() => setActiveFeature(feature.id)}
                    onHoverEnd={() => setActiveFeature(null)}
                  >
                    <motion.div
                      className={cn(
                        "w-16 h-16 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center mb-3",
                        isActive ? "border-[#fef800]" : "border-white/10",
                      )}
                      animate={
                        isActive
                          ? {
                              boxShadow: "0 0 15px 0px rgba(254, 248, 0, 0.5)",
                            }
                          : {
                              boxShadow: "0 0 0px 0px rgba(254, 248, 0, 0)",
                            }
                      }
                    >
                      <div className={cn("text-white/70", isActive ? "text-[#fef800]" : "text-white/70")}>
                        {feature.icon}
                      </div>
                    </motion.div>
                    <h3
                      className={cn(
                        "font-['Russo_One'] text-lg mb-1 text-center",
                        isActive ? "text-[#fef800]" : "text-white",
                      )}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-white/70 text-sm text-center max-w-[180px]">{feature.description}</p>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile version - stacked cards */}
        <div className="md:hidden space-y-4">
          <motion.div
            className="w-24 h-24 rounded-full bg-[#1a1a1a] border border-[#fef800]/20 flex items-center justify-center mx-auto mb-8"
            animate={{
              boxShadow: [
                "0 0 20px 0px rgba(254, 248, 0, 0.3)",
                "0 0 30px 5px rgba(254, 248, 0, 0.4)",
                "0 0 20px 0px rgba(254, 248, 0, 0.3)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <div className="relative">
            <img src="./logo.jpg" alt="zap-logo" className="rounded-full"></img>
              {/* <Zap className="w-12 h-12 text-[#fef800]" />
              <motion.div
                className="absolute inset-0 text-[#fef800]"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.8, 1.1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Zap className="w-12 h-12" />
              </motion.div> */}
            </div>
          </motion.div>

          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute -right-8 -top-8 w-16 h-16 bg-[#fef800]/5 rounded-full blur-xl"></div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#fef800]/10 rounded-lg">
                  <div className="text-[#fef800]">{feature.icon}</div>
                </div>

                <div>
                  <h3 className="font-['Russo_One'] text-lg mb-1">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 h-1 bg-[#fef800]/30 w-full"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
