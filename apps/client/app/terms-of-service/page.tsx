"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      content: (
        <p>
          Welcome to Zap (“we,” “us,” or “our”). Zap is an agentic RAG‑based
          Slack app that transforms your Slack channels and uploaded documents
          into an AI‑driven knowledge base. By installing or using Zap, you
          agree to these{" "}
          <Link
            href="/terms-of-service"
            className="text-[#fef800] hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="text-[#fef800] hover:underline"
          >
            Privacy Policy
          </Link>
          . If you do not agree, please do not install or use Zap.
        </p>
      ),
    },
    {
      id: "eligibility",
      title: "Eligibility",
      content: (
        <div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              You must be authorized by your Slack workspace to install and use
              Zap.
            </li>
            <li>
              No additional age restriction is imposed by Zap; however, you must
              meet Slack’s age requirements (typically 13+).
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "service-description",
      title: "Service Description",
      content: (
        <div className="space-y-3">
          <p>
            Zap is a privacy-first communication intelligence assistant, built
            to help teams access knowledge instantly. By understanding channel
            conversations and uploaded documents (PDF, TXT, DOCX), Zap delivers
            fast, contextual answers without compromising data control. Designed
            for modern teams, Zap turns everyday communication into a powerful
            source of insights — making collaboration sharper, faster, and more
            secure.
          </p>
          <p>
            Built natively for Slack, Zap integrates seamlessly into your
            workspace without disrupting your existing workflows. It listens,
            learns, and responds within your channels — empowering your team to
            find the answers they need without ever leaving the conversation.
            With Zap, your knowledge stays protected, your communication stays
            productive, and your team stays ahead.**
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Question answering based on workspace knowledge</li>
            <li>Document analysis and information extraction</li>
            <li>Conversation summarization</li>
            <li>Enforce privacy & retention rules</li>
          </ul>
          <p>
            We may update, modify, or enhance the Service at any time, and may
            add or remove functionalities or features.
          </p>
        </div>
      ),
    },
    {
      id: "account-installation",
      title: "Account & Installation",
      content: (
        <div className="space-y-3">
          <p>
            To use Zap, you must install it in your Slack workspace and grant
            the necessary permissions. You are responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Installation happens via Slack’s OAuth flow. You’ll grant Zap only
              the scopes it needs.
            </li>
            <li>
              AZap only operates in channels or direct messages where you’ve
              explicitly invited it.
            </li>
            <li>
              Ensuring that your use of Zap complies with your organization's
              policies
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "information-we-collect",
      title: "Information We Collect",
      content: (
        <div className="space-y-3">
          <p>
            When you use Zap, we collect certain information as described in our
            Privacy Policy. This may include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Slack workspace information</li>
            <li>User information</li>
            <li>Message content when you interact with Zap</li>
            <li>Document content when you upload documents in channel</li>
            <li>Usage data</li>
          </ul>
          <p>
            For more details on how we collect, use, and protect your
            information, please refer to our{" "}
            <a
              href="/privacy-policy"
              className="text-[#fef800] hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      ),
    },
    {
      id: "data-retention-deletion",
      title: "Data Retention & Deletion",
      content: (
        <div className="space-y-3">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              All data from your channels is stored securely in Supabase for a
              maximum of 20 days.
            </li>
            <li>After 20 days, data is automatically purged.</li>
            <li>
              At any time, users or workspace admins can delete stored data
              immediately via Zap’s commands or by uninstalling the app.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "third-party-services",
      title: "Third‑Party Services",
      content: (
        <div className="space-y-3">
          <p>Zap relies on the Slack API and Gemini for AI inference.</p>
          <p>We run Gemini in a controlled, stateless environment to guard against unwanted or explicit outputs. No AI model is exposed directly to users—every request passes through our secure processing pipeline before a response is delivered.</p>
          <p>
            We are not responsible for the content, privacy practices, or
            availability of any third-party services. You acknowledge that your
            use of such services is at your own risk.
          </p>
        </div>
      ),
    },
    {
      id: "uptime-support",
      title: "Uptime & Support",
      content: (
        <div className="space-y-3">
          <p>
            We strive to maintain high availability of the Service, but we do
            not guarantee uninterrupted access. The Service may be temporarily
            unavailable due to maintenance, updates, or factors beyond our
            control.
          </p>
          <p>
            Support is provided according to your subscription plan. For details
            on support options, please visit our{" "}
            <Link href="/support" className="text-[#fef800] hover:underline">
              Support page
            </Link>
            .
          </p>
        </div>
      ),
    },
    {
      id: "modifications",
      title: "Modifications",
      content: (
        <div className="space-y-3">
          <p>
            We reserve the right to modify these Terms at any time. If we make
            material changes, we will notify you through the Service or by
            email. Your continued use of Zap after such modifications
            constitutes your acceptance of the updated Terms. We may also
            modify, suspend, or discontinue the Service or any part thereof at
            any time, with or without notice.
          </p>
        </div>
      ),
    },
    {
      id: "termination",
      title: "Termination",
      content: (
        <div className="space-y-3">
          <p>
            You may uninstall Zap at any time, your data will be removed
            according to the retention policy above.
          </p>
          <p>
            We may terminate or suspend your access to the Service immediately,
            without prior notice or liability, for any reason, including if you
            breach these Terms. Upon termination, your right to use the Service
            will cease immediately.
          </p>
        </div>
      ),
    },
    {
      id: "limitation-of-liability",
      title: "Limitation of Liability",
      content: (
        <div className="space-y-3">
          <p>
            To the fullest extent permitted by applicable law, Zap (and its
            owner) provides the service free of charge and therefore will not be
            liable for any direct, indirect, incidental, consequential, or
            punitive damages arising out of your use of the service.
          </p>
        </div>
      ),
    },
    {
      id: "indemnification",
      title: "Indemnification",
      content: (
        <p>
          You agree to indemnify and hold harmless Zap and its owner from any
          claims, liabilities, damages, and expenses (including legal fees)
          arising from your misuse of the service or violation of these Terms of
          Service.
        </p>
      ),
    },
    {
      id: "governing-law",
      title: "Governing Law",
      content: (
        <p>
          These Terms of Service are governed by the laws of the Republic of India, without
          regard to its conflict‑of‑law provisions. Any dispute arising under
          these Terms of Service will be subject to the exclusive jurisdiction of the courts
          located in your city of residence in India.
        </p>
      ),
    },
    {
      id: "contact-us",
      title: "Contact Us",
      content: (
        <div className="space-y-3">
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            Email:{" "}
            <a
              href="mailto:legal@zapai.com"
              className="text-[#fef800] hover:underline"
            >
              askzap.ai@gmail.com
            </a>
          </p>
        </div>
      ),
    },
  ];

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
            Terms of Service
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/70 max-w-2xl mx-auto text-center text-lg"
          >
            Last updated: May 13, 2025
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
                    <a
                      href={`#${section.id}`}
                      className="flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="mb-12"
              >
                <h2 className="font-['Russo_One'] text-2xl mb-4 flex items-center gap-2 text-[#fef800]">
                  {section.title}
                </h2>
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 text-white/80">
                  {section.content}
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sections.length * 0.05 }}
              className="mt-16 text-center"
            >
              <p className="text-white/60 text-sm">
                By using Zap, you acknowledge that you have read, understood,
                and agree to be bound by these Terms of Service.
              </p>
              <div className="mt-6 flex justify-center gap-6">
                <Link
                  href="/privacy-policy"
                  className="text-[#fef800] hover:underline flex items-center gap-1"
                >
                  Privacy Policy
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link
                  href="/support"
                  className="text-[#fef800] hover:underline flex items-center gap-1"
                >
                  Contact Support
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
