import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "MazeBids - Gamified Auctions",
  description: "Experience the ultimate gamified auction platform. Bid, win, and earn rewards in real-time.",
  icons: {
    icon: "https://media.discordapp.net/attachments/1495155538886135889/1496103125944111104/MazeBids.png?ex=69e8aa1d&is=69e7589d&hm=b7a98d13f49a2d46c9167bcc58f850507494c85ac82e93cec62993473526ba3c&=&format=webp&quality=lossless&width=561&height=561",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-purple-gradient min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
