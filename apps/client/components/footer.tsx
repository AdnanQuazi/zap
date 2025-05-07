import { DOCS_URL, EMAIL } from "@/app/constants";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-20 h-20 rounded-medium bg-[#000] flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="Zap Logo"
                  className="w-20 h-20 rounded-sm"
                />
              </div>
            </div>
            <p className="text-white/60 text-sm">
              AI-powered assistant that supercharges your Slack workspace with
              knowledge and insights.
            </p>
          </div>

          <div>
            <h3 className="font-['Russo_One'] text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  Features
                </a>
              </li>
              {/* <li>
                  <a href="#" className="text-white/60 hover:text-[#fef800] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-[#fef800] transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-[#fef800] transition-colors">
                    Changelog
                  </a>
                </li> */}
            </ul>
          </div>

          <div>
            <h3 className="font-['Russo_One'] text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  API
                </a>
              </li>
              <li>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  Guides
                </a>
              </li>
              <li>
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`}
                  target="_blank"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-['Russo_One'] text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                {/* <a
                  href="#"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  Contact
                </a> */}
              </li>
              <li>
                <a
                  href="./privacy-policy"
                  className="text-white/60 hover:text-[#fef800] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/60 text-sm">
            © {new Date().getFullYear()} Zap. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
