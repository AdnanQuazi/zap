"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Users,
  RefreshCw,
  Code,
  Bug,
  Puzzle,
  BookOpen,
  Github,
  FileText,
} from "lucide-react";
import { CONTRIBUTION_GUIDE_URL, GITHUB_URL } from "@/app/constants";

export default function OpenSource() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const keyMessages = [
    {
      title: "100% Open Source",
      description: "Every line of code is open for inspection and contribution",
      icon: <GitBranch className="w-6 h-6" />,
    },
    {
      title: "Community Driven",
      description: "Built by developers, for developers",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Continuously Improving",
      description: "Regular updates based on community feedback",
      icon: <RefreshCw className="w-6 h-6" />,
    },
  ];

  const contributionOptions = [
    {
      title: "Contribute Code",
      description: "Help us improve Zap's core functionality",
      icon: <Code className="w-6 h-6" />,
      color: "from-blue-500/20 to-blue-600/20",
      hoverColor: "group-hover:from-blue-500/30 group-hover:to-blue-600/30",
      iconColor: "text-blue-400",
    },
    {
      title: "Report Issues",
      description: "Identify bugs and suggest enhancements",
      icon: <Bug className="w-6 h-6" />,
      color: "from-red-500/20 to-red-600/20",
      hoverColor: "group-hover:from-red-500/30 group-hover:to-red-600/30",
      iconColor: "text-red-400",
    },
    {
      title: "Build Extensions",
      description: "Create plugins and extensions for specific use cases",
      icon: <Puzzle className="w-6 h-6" />,
      color: "from-purple-500/20 to-purple-600/20",
      hoverColor: "group-hover:from-purple-500/30 group-hover:to-purple-600/30",
      iconColor: "text-purple-400",
    },
    {
      title: "Improve Documentation",
      description: "Help make Zap more accessible to everyone",
      icon: <BookOpen className="w-6 h-6" />,
      color: "from-green-500/20 to-green-600/20",
      hoverColor: "group-hover:from-green-500/30 group-hover:to-green-600/30",
      iconColor: "text-green-400",
    },
  ];

  // const contributors = [
  //   { id: 1, initial: "A" },
  //   { id: 2, initial: "B" },
  //   { id: 3, initial: "C" },
  //   { id: 4, initial: "D" },
  //   { id: 5, initial: "E" },
  //   { id: 6, initial: "F" },
  //   { id: 7, initial: "+" },
  // ]

  // const githubStats = [
  //   {
  //     label: "Stars",
  //     value: "2.4k",
  //     icon: <Star className="w-4 h-4" />,
  //     color: "text-yellow-400",
  //   },
  //   {
  //     label: "Forks",
  //     value: "486",
  //     icon: <GitFork className="w-4 h-4" />,
  //     color: "text-blue-400",
  //   },
  //   {
  //     label: "Contributors",
  //     value: "73",
  //     icon: <User className="w-4 h-4" />,
  //     color: "text-green-400",
  //   },
  //   {
  //     label: "Latest",
  //     value: "v1.2.0",
  //     icon: <Tag className="w-4 h-4" />,
  //     color: "text-purple-400",
  //   },
  // ]

  // const contributorSteps = [
  //   {
  //     step: "1",
  //     title: "Fork the repo",
  //     description: "Create your own copy of the repository to work on",
  //   },
  //   {
  //     step: "2",
  //     title: "Pick an issue",
  //     description: "Find an open issue that interests you or create a new one",
  //   },
  //   {
  //     step: "3",
  //     title: "Submit your PR",
  //     description: "Create a pull request with your changes for review",
  //   },
  // ]

  return (
    <section
      className="py-24 relative overflow-hidden bg-[#0a0a0a] z-12"
      ref={ref}
    >
      <div className="absolute inset-0 bg-[#121212] opacity-100"></div>

      {/* Background grid pattern */}
      {/* <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div> */}

      {/* Animated code lines background */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-mono text-[#fef800] whitespace-nowrap"
            initial={{
              left: `${Math.random() * 100}%`,
              top: -100,
              opacity: 0.3 + Math.random() * 0.7,
            }}
            animate={{
              top: "100%",
            }}
            transition={{
              duration: 15 + Math.random() * 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          >
            {`import { Zap } from 'zap-ai';`}
          </motion.div>
        ))}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i + 15}
            className="absolute text-xs font-mono text-[#fef800] whitespace-nowrap"
            initial={{
              left: `${Math.random() * 100}%`,
              top: -100,
              opacity: 0.3 + Math.random() * 0.7,
            }}
            animate={{
              top: "100%",
            }}
            transition={{
              duration: 15 + Math.random() * 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          >
            {`slackApp.command("/zap-ask", ask);`}
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-['Russo_One'] text-3xl md:text-4xl mb-4">
            Join Our Open Source Community
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Zap is built with transparency and collaboration at its core
          </p>
        </motion.div>

        {/* Key Messages */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {keyMessages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 hover:border-[#fef800]/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(254,248,0,0.1)]"
            >
              <div className="w-12 h-12 rounded-lg bg-[#fef800]/10 flex items-center justify-center mb-4 text-[#fef800]">
                {message.icon}
              </div>
              <h3 className="font-['Russo_One'] text-xl mb-2">
                {message.title}
              </h3>
              <p className="text-white/70">{message.description}</p>
            </motion.div>
          ))}
        </div>

        {/* GitHub Stats */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex items-center justify-center mb-6">
              <Github className="w-8 h-8 text-white mr-3" />
              <h3 className="font-['Russo_One'] text-2xl">GitHub Stats</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {githubStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-[#222] rounded-lg p-4 flex flex-col items-center justify-center text-center"
                >
                  <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div> */}

        {/* Contribution Options */}
        <div className="max-w-5xl mx-auto mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-['Russo_One'] text-2xl mb-8 text-center"
          >
            Ways to Contribute
          </motion.h3>

          <div className="grid md:grid-cols-2 gap-6">
            {contributionOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="group"
              >
                <div
                  className={`bg-gradient-to-br ${option.color} ${option.hoverColor} border border-white/10 rounded-xl p-6 h-full transition-all duration-300 hover:border-white/20 hover:shadow-lg`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-[#222] flex items-center justify-center mb-4 ${option.iconColor}`}
                  >
                    {option.icon}
                  </div>
                  <h4 className="font-['Russo_One'] text-lg mb-2">
                    {option.title}
                  </h4>
                  <p className="text-white/70">{option.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Featured Contributors */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="max-w-3xl mx-auto mb-16 text-center"
        >
          <h3 className="font-['Russo_One'] text-2xl mb-6">Featured Contributors</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {contributors.map((contributor, index) => (
              <motion.div
                key={contributor.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  contributor.initial === "+"
                    ? "bg-[#333] text-white/70 cursor-pointer hover:bg-[#444] transition-colors duration-300"
                    : "bg-gradient-to-br from-[#fef800]/80 to-[#fef800]/60 text-[#121212]"
                }`}
              >
                {contributor.initial}
              </motion.div>
            ))}
          </div>
          <p className="text-white/60 mt-4 text-sm">And many more amazing contributors from around the world!</p>
        </motion.div> */}

        {/* Getting Started as a Contributor */}
        {/* <div className="max-w-4xl mx-auto mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="font-['Russo_One'] text-2xl mb-8 text-center"
          >
            Getting Started as a Contributor
          </motion.h3>

          <div className="grid md:grid-cols-3 gap-6">
            {contributorSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 relative"
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#fef800] text-[#121212] font-bold flex items-center justify-center">
                  {step.step}
                </div>
                {index < contributorSteps.length - 1 && (
                  <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 hidden md:block">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="#fef800"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <h4 className="font-['Russo_One'] text-lg mb-2">{step.title}</h4>
                <p className="text-white/70">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div> */}

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() =>
                window.open(GITHUB_URL, "_blank")
              }
              className="bg-[#fef800] text-[#121212] hover:bg-[#fef800]/90 font-medium px-6 py-6 cursor-pointer"
            >
              <Github className="w-5 h-5 mr-2" /> View on GitHub
            </Button>
            <a
              href={CONTRIBUTION_GUIDE_URL}
              target="_blank"
              className="inline-flex items-center text-[#fef800] hover:underline font-normal"
            >
              <FileText className="w-4 h-4 mr-2" /> Read Contribution Guide
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
