"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { DOCS_URL } from "@/app/constants"
import { redirectToInstallation } from "@/lib/redirectToInstall"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#121212]/90 backdrop-blur-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10">
            <img src="/logo.png" alt="Logo" className="h-10 w-10" />
          </div>
          <span className="font-['Russo_One'] text-3xl text-white"></span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="./#features" className="text-white/80 hover:text-[#fef800] transition-colors">
            Features
          </Link>
          <Link href="./privacy-policy" className="text-white/80 hover:text-[#fef800] transition-colors">
            Privacy Policy
          </Link>
          <Link href={DOCS_URL} target="_blank" className="text-white/80 hover:text-[#fef800] transition-colors">
            Docs
          </Link>
          <Button onClick={() => redirectToInstallation()} className="bg-[#fef800] text-[#121212] hover:bg-[#fef800]/90 font-medium">Add to Slack</Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#121212]/95 backdrop-blur-md absolute top-full left-0 right-0 p-4 flex flex-col gap-4 border-t border-white/10">
          <Link
            href="./#features"
            className="text-white/80 hover:text-[#fef800] transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="./privacy-policy"
            className="text-white/80 hover:text-[#fef800] transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Privacy Policy
          </Link>
          <Link
            href={DOCS_URL}
            className="text-white/80 hover:text-[#fef800] transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Docs
          </Link>
          <Button
            className="bg-[#fef800] text-[#121212] hover:bg-[#fef800]/90 font-medium w-full"
            onClick={() => {setIsMenuOpen(false); redirectToInstallation()}}
          >
            Add to Slack
          </Button>
        </div>
      )}
    </nav>
  )
}
