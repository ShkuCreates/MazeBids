"use client";
import { Mail, Code, X, MessageCircle } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Discord",
      icon: MessageCircle,
      href: "https://discord.gg/mazebids",
      color: "hover:text-blue-400"
    },
    {
      name: "Twitter",
      icon: X,
      href: "https://twitter.com/mazebids",
      color: "hover:text-blue-300"
    },
    {
      name: "GitHub",
      icon: Code,
      href: "https://github.com/mazebids",
      color: "hover:text-gray-300"
    },
    {
      name: "Email",
      icon: Mail,
      href: "mailto:support@mazebids.com",
      color: "hover:text-purple-400"
    }
  ];

  return (
    <footer className="border-t border-purple-900/50 bg-black/40 backdrop-blur-md mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="https://media.discordapp.net/attachments/1495155538886135889/1496103125944111104/MazeBids.png?ex=69e8aa1d&is=69e7589d&hm=b7a98d13f49a2d46c9167bcc58f850507494c85ac82e93cec62993473526ba3c&=&format=webp&quality=lossless&width=561&height=561" 
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
                <Link 
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/content-policy"
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                >
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
                <Link 
                  href="/auctions"
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                >
                  Browse Auctions
                </Link>
              </li>
              <li>
                <Link 
                  href="/earn"
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                >
                  Earn Coins
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard"
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Follow Us</h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                    className={`text-gray-400 transition-colors ${social.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
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
    </footer>
  );
};

export default Footer;
