"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BarChart,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";

export default function SeeItInAction() {
  const [activeTab, setActiveTab] = useState("quick-questions");
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const usageExamples = [
    {
      id: "quick-questions",
      title: "Quick Questions",
      description:
        "Get instant answers to factual questions about your company",
      icon: <MessageSquare className="w-6 h-6" />,
      query: "/zap-ask What's our Q2 sales target?",
      response: (
        <>
          <p>Based on the latest sales planning document:</p>
          <p className="mt-2 font-medium text-[#fef800]">
            Q2 Sales Target: $4.2M
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>North America: $2.1M</li>
            <li>Europe: $1.3M</li>
            <li>Asia-Pacific: $0.8M</li>
          </ul>
          <p className="mt-2 text-sm text-white/60">
            This represents a 15% increase from Q1 and aligns with our annual
            growth target of 35%.
          </p>
        </>
      ),
    },
    {
      id: "document-lookups",
      title: "Document Lookups",
      description: "Extract information from your knowledge base and documents",
      icon: <FileText className="w-6 h-6" />,
      query: "/zap-ask Summarize the new hiring policy",
      response: (
        <>
          <p>
            Here's a summary of the updated hiring policy (effective March 15,
            2023):
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Two-stage interview process: technical + cultural fit</li>
            <li>
              Remote-first approach with quarterly in-person team gatherings
            </li>
            <li>Standardized skill assessment for all technical roles</li>
            <li>
              Diversity and inclusion goals integrated into hiring metrics
            </li>
            <li>Referral bonus increased to $2,000 for successful hires</li>
          </ul>
          <p className="mt-2 text-sm text-white/60">
            Source: HR-Policy-Update-2023.pdf (last updated: March 10, 2023)
          </p>
        </>
      ),
    },
    {
      id: "data-analysis",
      title: "Data Analysis",
      description: "Interpret company data and visualize trends",
      icon: <BarChart className="w-6 h-6" />,
      query: "/zap-ask Analyze customer_churn.docx",
      response: (
        <>
          <p>Analysis of Q1 2023 customer churn:</p>
          <div className="mt-3 p-3 bg-[#1a1a1a] rounded-lg space-y-2 text-sm text-white/90">
            <p>
              • January churn rate: <span className="font-medium">3.2%</span>
            </p>
            <p>
              • February churn rate: <span className="font-medium">4.1%</span>
            </p>
            <p>
              • March churn rate: <span className="font-medium">2.7%</span>{" "}
              <span className="text-green-400">(↓ 25%)</span>
            </p>
            <div className="pt-2">
              <p className="font-medium">Key findings:</p>
              <ul className="list-disc list-inside text-white/70">
                <li>Churn decreased significantly in March</li>
                <li>Retention initiatives launched late February had impact</li>
                <li>SMB segment showed the highest retention gains</li>
              </ul>
            </div>
          </div>
        </>
      ),
    },
  ];

  const commonCommands = [
    {
      command: "/zap-ask [question]",
      description: "Get direct answers to any question about your company",
    },
    {
      command: "/zap-ask analyze [document name]",
      description:
        "Analyze document in your knowledge base",
    },
    {
      command: "/zap-ask summarize conversation of past week",
      description: "Get a concise summary of a conversation",
    },
    {
      command: "/zap-ask compare [item1] and [item2]",
      description: "Compare two products, or documents",
    },
  ];

  // const exampleQueries = [
  //   "What was our revenue last quarter?",
  //   "Summarize the latest product roadmap",
  //   "Who's the project lead for Atlas?",
  //   "What are our top 3 customer pain points?",
  //   "When is the next company all-hands?",
  // ];

  // Handle typing animation
  useEffect(() => {
    if (!selectedQuery) return;

    // reset state
    setTypedText("");
    setShowResponse(false);
    setIsTyping(true);

    let cancelled = false;

    const doTyping = async () => {
      for (const char of selectedQuery) {
        if (cancelled) break;
        // append next character
        setTypedText((prev) => prev + char);
        // wait 50ms
        await new Promise((r) => setTimeout(r, 50));
      }

      if (!cancelled) {
        setIsTyping(false);
        // show response after a short pause
        setTimeout(() => {
          if (!cancelled) setShowResponse(true);
        }, 700);
      }
    };

    doTyping();

    return () => {
      cancelled = true;
    };
  }, [selectedQuery]);

  // Set initial query
  useEffect(() => {
    const currentExample = usageExamples.find((ex) => ex.id === activeTab);
    if (currentExample) {
      setSelectedQuery(currentExample.query);
    }
  }, [activeTab]);

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopied(command);
    setTimeout(() => setCopied(null), 2000);
  };

  // const handleTryQuery = (query: string) => {
  //   setSelectedQuery(`/ask ${query}`);

  //   // Scroll to demo section
  //   if (demoRef.current) {
  //     demoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  //   }
  // };

  return (
    <section className="py-24 relative overflow-hidden bg-[#000000] pb-0 ">
      <div className="absolute inset-0 z-10 custom-gradient"></div>
      <div className="absolute inset-0 z-9 security-grid"></div>
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
          <h2 className="font-['Russo_One'] text-3xl md:text-4xl mb-4">
            See{" "}
            <span
              className="relative z-10 text-[#fef800] glow-text"
              style={
                {
                  "--x": "50%",
                  "--y": "50%",
                } as React.CSSProperties
              }
            >
              Zap
            </span>{" "}
            in Action
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Experience how seamlessly Zap integrates with your workflow
          </p>
        </motion.div>

        {/* Usage Examples Tabs */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {usageExamples.map((example) => (
              <button
                key={example.id}
                className={`
                  px-5 py-3 rounded-lg flex items-center gap-2 transition-all duration-300
                  ${
                    activeTab === example.id
                      ? "bg-[#fef800] text-[#121212]"
                      : "bg-[#1a1a1a] text-white hover:bg-[#222]"
                  }
                `}
                onClick={() => setActiveTab(example.id)}
              >
                {example.icon}
                <span>{example.title}</span>
              </button>
            ))}
          </div>

          {/* Slack Demo */}
          <div
            ref={demoRef}
            className="bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Slack header */}
            <div className="bg-[#350d36] p-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-white font-medium">#general</div>
            </div>

            {/* Slack messages */}
            <div className="p-4 h-[470px] overflow-y-auto space-y-6">
              {/* User command */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center text-white font-bold">
                  <img
                    src="./Female.png"
                    alt="avatar-female"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">Jessica</span>
                    <span className="text-white/50 text-xs">10:32 AM</span>
                  </div>
                  <div className="relative bg-[#222] p-3 rounded mt-1 font-mono whitespace-pre">
                    {typedText}
                    {isTyping && (
                      <span
                        className="absolute top-3 h-4 w-1 animate-blink"
                        style={{ left: `${typedText.length}ch` }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* SlackAI response */}
              <AnimatePresence>
                {showResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-sm bg-[#000000] flex items-center justify-center text-[#121212] font-bold">
                      <img
                        src="./logo.jpg"
                        alt="zap-logo"
                        className="w-full h-full object-cover rounded-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium">Zap</span>
                        <span className="text-white/50 text-xs">10:32 AM</span>
                      </div>

                      <div className="bg-[#222] border border-[#fef800]/20 p-3 rounded mt-1">
                        {
                          usageExamples.find((ex) => ex.id === activeTab)
                            ?.response
                        }

                        {/* Action buttons */}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 text-center">
            <p className="text-white/70">
              {usageExamples.find((ex) => ex.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-8 relative">
            <div className="absolute -top-5 -left-5 text-[#fef800] text-6xl opacity-30"></div>
            <div className="absolute -bottom-5 -right-5 text-[#fef800] text-6xl opacity-30"></div>
            <blockquote className="text-xl text-white/90 italic text-center relative z-10">
              Zap has completely transformed how our team accesses
              information. What used to take 30 minutes of searching through
              documents now takes seconds. It's like having an expert colleague
              who knows everything about our company.
            </blockquote>

            <div className="mt-6 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#fef800] flex items-center justify-center text-[#121212] font-bold mr-3">
                M
              </div>
              <div className="text-left">
                <div className="font-medium">Michael Chen</div>
                <div className="text-white/60 text-sm">
                  Product Manager, Acme Inc.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Commands */}
        <div className="max-w-4xl mx-auto mb-10">
          <h3 className="font-['Russo_One'] text-2xl mb-6 text-center">
            Common Commands
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {commonCommands.map((cmd, index) => (
              <div
                key={index}
                className="bg-[#1a1a1a] rounded-lg border border-white/10 p-4 flex items-start gap-3 group hover:border-[#fef800]/30 transition-colors duration-300"
              >
                <div className="p-2 bg-[#222] rounded">
                  <MessageSquare className="w-5 h-5 text-[#fef800]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <code className="text-[#fef800] font-mono text-sm">
                      {cmd.command}
                    </code>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={() => handleCopyCommand(cmd.command)}
                    >
                      {copied === cmd.command ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50 hover:text-white" />
                      )}
                    </button>
                  </div>
                  <p className="text-white/70 text-sm mt-1">
                    {cmd.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Try Example Queries */}
        {/* <div className="max-w-3xl mx-auto">
          <h3 className="font-['Russo_One'] text-2xl mb-6 text-center">
            Try Example Queries
          </h3>

          <div className="flex flex-wrap justify-center gap-3">
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 hover:border-[#fef800]/30 rounded-full text-sm transition-all duration-300"
                onClick={() => handleTryQuery(query)}
              >
                {query}
              </button>
            ))}
          </div>
        </div> */}
      </div>
    </section>
  );
}
