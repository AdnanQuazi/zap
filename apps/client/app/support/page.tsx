"use client";

import type React from "react";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AnimatedFAQ from "@/components/animated-faq";
import {
  MessageSquare,
  Mail,
  FileText,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { DOCS_URL } from "../constants";

export default function SupportPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formStatus, setFormStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const faqs = [
    {
      question: "How do I install Zap to my Slack workspace?",
      answer: (
        <div className="space-y-3">
          <p>Installing Zap is simple:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Click the "Add to Slack" button on our homepage</li>
            <li>Authorize Zap with the required permissions</li>
            <li>
              You'll be redirected to a success page once installation is
              complete
            </li>
          </ol>
          <p>The entire process takes less than a minute.</p>
        </div>
      ),
    },
    {
      question: "I can't see Zap in my Slack channels. What should I do?",
      answer: (
        <div className="space-y-3">
          <p>If you can't see Zap in your channels, try these steps:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Make sure you've invited Zap to the specific channel by typing{" "}
              <code className="bg-[#222] px-2 py-0.5 rounded text-[#fef800]">
                /invite @Zap
              </code>
            </li>
            <li>
              Check if you have the necessary permissions to add apps to
              channels
            </li>
            <li>Verify that the installation was completed successfully</li>
            <li>Try reinstalling Zap from our homepage</li>
          </ol>
          <p>If you're still having issues, please contact our support team.</p>
        </div>
      ),
    },
    {
      question: "What commands can I use with Zap?",
      answer: (
        <div className="space-y-3">
          <p>Zap supports several commands:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <code className="bg-[#222] px-2 py-0.5 rounded text-[#fef800]">
                /zap-ask [question]
              </code>{" "}
              - Ask any question about your company or documents
            </li>
            <li>
              <code className="bg-[#222] px-2 py-0.5 rounded text-[#fef800]">
                /zap-optout
              </code>{" "}
              - Stop Zap from storing your conversations and documents
            </li>
            <li>
              <code className="bg-[#222] px-2 py-0.5 rounded text-[#fef800]">
                /zap-purge
              </code>{" "}
              - Delete all your personal data stored by Zap
            </li>
            <li>
              <code className="bg-[#222] px-2 py-0.5 rounded text-[#fef800]">
                /zap-help
              </code>{" "}
              - View all available commands
            </li>
          </ul>
          <p>
            For a complete list of commands, type{" "}
            <code className="bg-[#222] px-2 py-0.5 rounded text-[#fef800]">
              /zap-help
            </code>{" "}
            in Slack.
          </p>
        </div>
      ),
    },
    {
      question: "What is Smart Context and how do I enable it?",
      answer: (
        <div className="space-y-3">
          <p>
            Smart Context is zap’s feature and security layer that keeps track
            of the recent conversation threads and relevant documents so that it
            can give more accurate, on‑topic replies. To enable Smart Context:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open your Slack workspace.</li>
            <li>Authorize Zap with the required permissions</li>
            <li>In the left sidebar under Apps, find and click on zap.</li>
          </ol>
          <p>
            Zap’s Home tab will open, showing a toggle button of Smart Context
          </p>
          <small>Only admins are allowed to enable/disable smart context</small>
        </div>
      ),
    },
    {
      question: "How can I stop zap from storing a particular message?",
      answer: (
        <div className="space-y-3">
          <p>Simply react to that message with the “🚫” emoji.</p>
        </div>
      ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");

    // Simulate form submission
    setTimeout(() => {
      setFormStatus("success");
      if (formRef.current) {
        formRef.current.reset();
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-24 pb-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-['Russo_One'] text-4xl md:text-5xl text-center mb-4"
          >
            Support Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/70 max-w-2xl mx-auto text-center text-lg"
          >
            Get help with Zap, our AI-powered Slack assistant. We're here to
            ensure you have the best experience possible.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 md:p-8">
              <h2 className="font-['Russo_One'] text-2xl mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#fef800]" />
                Contact Us
              </h2>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-white/80 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full bg-[#222] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#fef800]/50"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full bg-[#222] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#fef800]/50"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-white/80 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    required
                    className="w-full bg-[#222] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#fef800]/50"
                  >
                    <option value="">Select a topic</option>
                    <option value="installation">Installation Help</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-white/80 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="w-full bg-[#222] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#fef800]/50"
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  disabled={formStatus === "submitting"}
                  className="bg-[#fef800] text-[#121212] hover:bg-[#fef800]/90 font-medium w-full"
                >
                  {formStatus === "submitting" ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#121212]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </span>
                  ) : formStatus === "success" ? (
                    <span className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Message Sent!
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </Button>

                {formStatus === "error" && (
                  <p className="text-red-500 text-sm mt-2">
                    There was an error sending your message. Please try again.
                  </p>
                )}
              </form>
            </div>
          </motion.div>

          {/* Support Options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 md:p-8">
              <h2 className="font-['Russo_One'] text-2xl mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-[#fef800]" />
                Support Options
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-[#222] rounded-lg">
                  <Mail className="w-6 h-6 text-[#fef800] mt-1" />
                  <div>
                    <h3 className="font-medium text-lg mb-1">Email Support</h3>
                    <p className="text-white/70 mb-2">
                      For general inquiries and non-urgent issues
                    </p>
                    <a
                      href="mailto:askzap.ai@gmail.com"
                      className="text-[#fef800] hover:underline"
                    >
                      askzap.ai@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#222] rounded-lg">
                  <FileText className="w-6 h-6 text-[#fef800] mt-1" />
                  <div>
                    <h3 className="font-medium text-lg mb-1">Documentation</h3>
                    <p className="text-white/70 mb-2">
                      Comprehensive guides and tutorials
                    </p>
                    <a
                      href={DOCS_URL}
                      className="text-[#fef800] hover:underline flex items-center gap-1"
                    >
                      View Documentation
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <AnimatedFAQ
          title="Frequently Asked Questions"
          description="Quick answers to common questions about Zap"
          faqs={faqs}
          className="mb-16"
        />
      </div>

      <Footer />
    </main>
  );
}
