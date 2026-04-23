"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Gavel, LayoutDashboard, User as UserIcon, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const pathname = usePathname();
  const { user, loading, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Auctions", href: "/auctions", icon: Gavel },
    { name: "Earn Coins", href: "/earn", icon: Coins },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ name: "Admin", href: "/admin", icon: ShieldCheck });
  }

  return (
    <nav className="border-b border-purple-900/50 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-600/10 blur-2xl rounded-full group-hover:bg-purple-600/30 transition-all" />
              <img 
                src="https://media.discordapp.net/attachments/1495155538886135889/1496103125944111104/MazeBids.png?ex=69e8aa1d&is=69e7589d&hm=b7a98d13f49a2d46c9167bcc58f850507494c85ac82e93cec62993473526ba3c&=&format=webp&quality=lossless&width=561&height=561" 
                alt="MazeBids Logo" 
                className="w-12 h-12 relative z-10 opacity-80 group-hover:opacity-100 transition-all drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] object-contain" 
              />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              MAZEBIDS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isProtected = item.name === "Profile" || item.name === "Dashboard" || item.name === "Earn Coins";
              
              const handleClick = (e: React.MouseEvent) => {
                if (loading) {
                  e.preventDefault();
                  return;
                }

                if (isProtected && !user) {
                  e.preventDefault();
                  if (confirm(`You must be logged in to access the ${item.name}. Would you like to login now with Discord?`)) {
                    login();
                  }
                }
              };

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleClick}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-purple-400 ${
                    pathname === item.href ? "text-purple-400" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-gray-400">Checking session...</div>
            ) : user ? (
              <>
                <div className="flex items-center space-x-2 bg-purple-900/30 px-3 py-1.5 rounded-full border border-purple-500/30">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-sm">{user.coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/5 pl-1 pr-3 py-1 rounded-full border border-white/10">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  <button 
                    onClick={() => logout()}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => login()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
              >
                Login with Discord
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-purple-900/50 bg-black/40 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isProtected = item.name === "Profile" || item.name === "Dashboard" || item.name === "Earn Coins";
                
                const handleClick = (e: React.MouseEvent) => {
                  if (loading) {
                    e.preventDefault();
                    return;
                  }

                  if (isProtected && !user) {
                    e.preventDefault();
                    if (confirm(`You must be logged in to access the ${item.name}. Would you like to login now with Discord?`)) {
                      login();
                    }
                  }
                  setMobileMenuOpen(false);
                };

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleClick}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.href 
                        ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile User Section */}
              <div className="border-t border-purple-900/50 pt-4 space-y-3">
                {loading ? (
                  <div className="text-sm text-gray-400 px-4">Checking session...</div>
                ) : user ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{user.username}</p>
                          <div className="flex items-center space-x-1">
                            <Coins className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm text-gray-400">{user.coins.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      login();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
                  >
                    Login with Discord
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
