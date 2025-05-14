"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  Shield,
  Lock,
  Eye,
  Database,
  FileText,
  Server,
  Users,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: <Shield className="w-5 h-5" /> },
    {
      id: "data-collection",
      title: "Data Collection",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "data-usage",
      title: "Data Usage",
      icon: <Server className="w-5 h-5" />,
    },
    {
      id: "data-sharing",
      title: "Data Sharing",
      icon: <Users className="w-5 h-5" />,
    },
    { id: "security", title: "Security", icon: <Lock className="w-5 h-5" /> },
    {
      id: "user-rights",
      title: "User Rights",
      icon: <Eye className="w-5 h-5" />,
    },
    {
      id: "retention",
      title: "Data Retention",
      icon: <Database className="w-5 h-5" />,
    },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" , block: "center"});
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <Navbar />

      <div className="pt-24 pb-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-['Russo_One'] text-4xl md:text-5xl text-center mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/70 max-w-2xl mx-auto text-center text-lg"
          >
            We take your privacy seriously. This policy explains how we collect,
            use, and protect your data.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Navigation sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="sticky top-24 bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
              <h3 className="font-['Russo_One'] text-lg mb-4">Contents</h3>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? "bg-[#fef800]/10 text-[#fef800]"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {section.icon}
                      <span>{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div id="overview" className="mb-12">
              <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#fef800]" />
                Overview
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                <p className="text-white/80 mb-4">
                  Welcome to Zap ("we," "our," or "us"). We respect your privacy
                  and are committed to protecting your personal information.
                  This Privacy Policy explains how we collect, use, disclose,
                  and safeguard your information when you use our Slack
                  application "Zap".
                </p>
                <p className="text-white/80 mb-4">
                  By using Zap, you agree to the collection and use of
                  information in accordance with this policy. We will not use or
                  share your information with anyone except as described in this
                  Privacy Policy.
                </p>
                <p className="text-white/80">Last updated: April 20, 2025</p>
              </div>
            </div>

            <div id="data-collection" className="mb-12">
              <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#fef800]" />
                Data Collection
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                <h3 className="font-medium text-xl mb-3">
                  Information We Collect
                </h3>
                <p className="text-white/80 mb-4">
                  We collect the following types of information when you use
                  Zap:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/80 mb-6">
                  <li>
                    Slack workspace information (workspace name, ID, team
                    domain)
                  </li>
                  <li>User information (user ID, display name,)</li>
                  <li>
                    Any messages you send or forward to channels that Zap is
                    added to (including threads and attachments)
                  </li>
                  <li>
                    Files (PDFs, DOCX, TXT) you upload in channels that Zap is
                    added to
                  </li>
                  <li>
                    Usage data (features used, commands executed, timestamps)
                  </li>
                </ul>

                <h3 className="font-medium text-xl mb-3">
                  How We Collect Information
                </h3>
                <p className="text-white/80 mb-4">
                  We collect information in the following ways:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  <li>
                    When you install Zap, you go through Slack’s OAuth flow and
                    explicitly grant the scopes (permissions) we request.
                  </li>
                  <li>
                    After installation, Zap only reads or writes data in the
                    channels (and direct messages) where you’ve explicitly added
                    it. We do not access any other channels or workspace data.
                  </li>
                  <li>
                    Zap does not automatically access conversation data; it only retrieves data when a command such as /zap-ask is invoked.
                  </li>
                </ul>
                <div className="bg-[#fef800]/5 border border-[#fef800]/20 rounded-lg p-4 mb-4 mt-6">
                  <h4 className="font-medium text-[#fef800] mb-2">
                    Important Note:
                  </h4>
                  <p className="text-white/90">
                    We only collect and temporarily store data from the specific
                    Slack channels where you’ve explicitly added Zap. All data
                    is held securely for a maximum of 20 days—after that period
                    it’s automatically purged. At any time, individual users and
                    workspace administrators have full control to delete their
                    data immediately.
                  </p>
                </div>
              </div>
            </div>

            <div id="data-usage" className="mb-12">
              <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2">
                <Server className="w-6 h-6 text-[#fef800]" />
                Data Usage
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                <p className="text-white/80 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/80 mb-6">
                  <li>Provide, maintain, and improve Zap's functionality</li>
                  <li>
                    Process and respond to your queries and requests in
                    real-time
                  </li>
                  <li>
                    Analyze conversation history to provide relevant answers
                  </li>
                  <li>Generate summaries of conversations when requested</li>
                  <li>
                    Analyze documents to extract information when requested
                  </li>
                </ul>

                <div className="bg-[#fef800]/5 border border-[#fef800]/20 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-[#fef800] mb-2">
                    Important Note:
                  </h4>
                  <p className="text-white/90">
                    We do NOT use your conversations, messages, or document
                    content to train any AI models. All processing is performed
                    solely to deliver the features you request, and no data is
                    incorporated into any model-training pipelines.
                  </p>
                </div>
              </div>
            </div>

            <div id="data-sharing" className="mb-12">
              <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#fef800]" />
                Data Sharing
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                <p className="text-white/80 mb-4">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/80 mb-6">
                  <li>
                    Send contextual data to our LLM provider for real-time
                    answer generation (contextual inference only; we do not
                    train on your data) but only when user invoke a command (e.g.
                    “/zap-ask”)
                  </li>
                </ul>

                <p className="text-white/80 mb-4">
                  We never sell or disclose your data to any other third parties
                  for any purpose.
                </p>
              </div>
            </div>

            <div id="security" className="mb-12">
              <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-[#fef800]" />
                Security
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                <p className="text-white/80 mb-4">
                  We implement appropriate security measures to protect your
                  information:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/80 mb-6">
                  <li>
                    We enforce strict, role-based access controls. Only
                    authorized personnel and systems can access your data
                  </li>
                  <li>
                    User and workspace administrators have full control to
                    delete data at any time via commands.
                  </li>
                  <li>
                    Secure infrastructure with industry-standard protections
                  </li>
                </ul>
              </div>
            </div>

            <div id="user-rights" className="mb-12">
              <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-[#fef800]" />
                User Rights
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                <p className="text-white/80 mb-4">
                  User have the following rights regarding their data:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/80 mb-6">
                  <li>Delete your personal information</li>
                  <li>Object to or restrict processing of your data</li>
                </ul>
              </div>
            </div>

            <div id="retention" className="mb-12">
              <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-[#fef800]" />
                Data Retention
              </h2>
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                <p className="text-white/80 mb-4">
                  We retain your information for as long as necessary to provide
                  our services and fulfill the purposes outlined in this Privacy
                  Policy.
                </p>
                <p className="text-white/80 mb-4">By default, we retain:</p>
                <ul className="list-disc pl-5 space-y-2 text-white/80 mb-6">
                  <li>
                    Workspace information: For as long as Zap is installed
                  </li>
                  <li>Message content: For 20 days after processing</li>
                  <li>Document content: For 20 days after processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
