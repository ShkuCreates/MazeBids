"use client";
import { Play, Camera, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(2024);
  const [showYouTubePopup, setShowYouTubePopup] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-purple-900/50 bg-black/40 backdrop-blur-md mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src="/icons/icon-192.png"
                alt="MazeBids Logo"
                className="w-8 h-8 opacity-80"
              />
              <span className="text-lg font-black text-white">MAZEBIDS</span>
            </div>
            <p className="text-gray-400 text-sm">
              The ultimate gamified auction platform where you earn coins and win real rewards.
            </p>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/content-policy" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Content Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auctions" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Browse Auctions
                </Link>
              </li>
              <li>
                <Link href="/earn" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Earn Coins
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Follow Us</h3>
            <div className="flex gap-4">

              {/* YouTube — Coming Soon popup */}
              <button
                onClick={() => setShowYouTubePopup(true)}
                title="YouTube"
                className="text-gray-400 transition-all duration-300 hover:scale-110 hover:text-red-500"
              >
                <Play className="w-5 h-5" />
              </button>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/mazebids.online"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="text-gray-400 transition-all duration-300 hover:scale-110 hover:text-pink-500"
              >
                <Camera className="w-5 h-5" />
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg/cw5K2uP3nP"
                target="_blank"
                rel="noopener noreferrer"
                title="Discord"
                className="text-gray-400 transition-all duration-300 hover:scale-110 hover:text-blue-400"
              >
                <MessageCircle className="w-5 h-5" />
              </a>

            </div>
            <p className="text-gray-500 text-xs mt-4">
              Join our community and stay updated with the latest auctions and rewards.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs text-center md:text-left">
              © {currentYear} MazeBids. All rights reserved. Fair & Secure Gaming Platform.
            </p>
            <p className="text-gray-500 text-xs">
              Made with <span className="text-red-500">❤️</span> by the MazeBids Team
            </p>
          </div>
        </div>
      </div>

      {/* YouTube Coming Soon Popup */}
      <AnimatePresence>
        {showYouTubePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowYouTubePopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a24] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 relative shadow-2xl shadow-red-500/10"
            >
              <button
                onClick={() => setShowYouTubePopup(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-red-500 fill-red-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-black text-xl">Coming Soon!</h3>
                <p className="text-gray-400 text-sm">
                  Our YouTube channel is on its way. Subscribe to our Discord to get notified when we go live!
                </p>
              </div>

              <a
                href="https://discord.gg/cw5K2uP3nP"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl font-black text-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Join Discord Instead
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default Footer;
