"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItemProps {
  question: string
  answer: React.ReactNode
  isOpen: boolean
  toggleOpen: () => void
  index: number
}

const FAQItem = ({ question, answer, isOpen, toggleOpen, index }: FAQItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "border rounded-xl overflow-hidden mb-4 transition-all duration-300",
        isOpen ? "border-[#fef800]/30 bg-[#1a1a1a]" : "border-white/10 bg-[#1a1a1a]/50",
      )}
    >
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fef800]/50"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <h3 className="font-['Russo_One'] text-lg md:text-xl">{question}</h3>
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300",
            isOpen ? "bg-[#fef800] text-[#121212]" : "bg-[#222] text-white/70",
          )}
        >
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`answer-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            id={`faq-answer-${index}`}
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-5 pt-0 text-white/80"
            >
              {answer}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface AnimatedFAQProps {
  title?: string
  description?: string
  faqs: {
    question: string
    answer: React.ReactNode
  }[]
  className?: string
}

export default function AnimatedFAQ({ title, description, faqs, className }: AnimatedFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-['Russo_One'] text-3xl md:text-4xl mb-4 text-center"
        >
          {title}
        </motion.h2>
      )}

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/70 max-w-2xl mx-auto text-lg text-center mb-10"
        >
          {description}
        </motion.p>
      )}

      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            toggleOpen={() => toggleFAQ(index)}
            index={index}
          />
        ))}
      </div>

      {/* Glowing effect at the bottom */}
      <div className="relative h-20 mt-8 overflow-hidden">
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-64 h-32 rounded-full bg-[#fef800]/10 blur-3xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  )
}
