import type { Metadata } from "next";
import { Geist, Geist_Mono , Russo_One , Poppins} from "next/font/google";
import "./globals.css";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ['latin'],            // only load Latin characters :contentReference[oaicite:0]{index=0}
  weight: ['400', '500', '600'],  // specify the weights you need :contentReference[oaicite:1]{index=1}
  display: 'swap',                // use swap to prevent invisible text :contentReference[oaicite:2]{index=2}
  variable: '--font-poppins'      // generate a CSS var for use in Tailwind :contentReference[oaicite:3]{index=3}
});

const russo = Russo_One({
  subsets: ['latin'],      // required for preloading :contentReference[oaicite:6]{index=6}
  weight: '400',           // specify the static weight you need :contentReference[oaicite:7]{index=7}
  display: 'swap',         // optional, but recommended :contentReference[oaicite:8]{index=8}
  variable: '--font-russo' // optional CSS variable name :contentReference[oaicite:9]{index=9}
});



export const metadata: Metadata = {
  title: "Zap - AI-Powered Slack Assistant",
  description: "Answer questions, summarize conversations, and analyze documents without leaving your workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${geistSans.variable} ${geistMono.variable} ${russo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
