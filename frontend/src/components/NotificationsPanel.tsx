"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  Trophy,
  Clock,
  Coins,
  CheckCheck,
  X,
} from "lucide-react";
import Link from "next/link";

type NotificationType = "outbid" | "won" | "ending" | "coins" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "outbid":
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case "won":
      return <Trophy className="w-4 h-4 text-yellow-400" />;
    case "ending":
      return <Clock className="w-4 h-4 text-orange-400" />;
    case "coins":
      return <Coins className="w-4 h-4 text-green-400" />;
    case "system":
      return <Bell className="w-4 h-4 text-blue-400" />;
  }
};

const getNotificationBg = (type: NotificationType) => {
  switch (type) {
    case "outbid":
      return "bg-red-500/10 border-red-500/20";
    case "won":
      return "bg-yellow-500/10 border-yellow-500/20";
    case "ending":
      return "bg-orange-500/10 border-orange-500/20";
    case "coins":
      return "bg-green-500/10 border-green-500/20";
    case "system":
      return "bg-blue-500/10 border-blue-500/20";
  }
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const generateMockNotifications = (): Notification[] => [
  {
    id: "n1",
    type: "outbid",
    title: "Outbid!",
    message: "You were outbid on iPhone 13! Current bid: ₹5,200",
    timestamp: new Date(Date.now() - 15000),
    read: false,
    href: "/auctions/iphone-13",
  },
  {
    id: "n2",
    type: "won",
    title: "Auction Won!",
    message: "You won the PS5 auction 🎉",
    timestamp: new Date(Date.now() - 120000),
    read: false,
    href: "/auctions/ps5",
  },
  {
    id: "n3",
    type: "ending",
    title: "Ending Soon",
    message: "Auction ending in 2 minutes — MacBook Air",
    timestamp: new Date(Date.now() - 300000),
    read: false,
    href: "/auctions/macbook-air",
  },
  {
    id: "n4",
    type: "coins",
    title: "Coins Added",
    message: "50 coins successfully added to your wallet",
    timestamp: new Date(Date.now() - 900000),
    read: true,
    href: "/profile",
  },
  {
    id: "n5",
    type: "system",
    title: "New Feature",
    message: "Referral program is now live! Earn 100 coins per referral.",
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    href: "/earn",
  },
  {
    id: "n6",
    type: "outbid",
    title: "Outbid!",
    message: "Someone outbid you on Nike Dunks — ₹1,800",
    timestamp: new Date(Date.now() - 7200000),
    read: true,
    href: "/auctions/nike-dunks",
  },
];

type FilterTab = "all" | "bids" | "wins" | "system";

const filterMap: Record<FilterTab, NotificationType[] | null> = {
  all: null,
  bids: ["outbid", "ending"],
  wins: ["won"],
  system: ["coins", "system"],
};

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setNotifications(generateMockNotifications());
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Simulate new notification arriving
  useEffect(() => {
    const addRandom = () => {
      const templates: Omit<Notification, "id" | "timestamp" | "read">[] = [
        {
          type: "outbid",
          title: "Outbid!",
          message: "You were outbid on RTX 4090! Bid is now ₹8,500",
          href: "/auctions/rtx-4090",
        },
        {
          type: "ending",
          title: "Ending Soon",
          message: "AirPods Pro auction ends in 1 minute!",
          href: "/auctions/airpods-pro",
        },
        {
          type: "coins",
          title: "Coins Earned",
          message: "+30 coins earned from daily reward",
          href: "/earn",
        },
      ];
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      const newNotif: Notification = {
        ...tmpl,
        id: `n-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
    };

    const interval = setInterval(addRandom, 20000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = filterMap[filter]
    ? notifications.filter((n) => (filterMap[filter] as NotificationType[]).includes(n.type))
    : notifications;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "bids", label: "Bids" },
    { key: "wins", label: "Wins" },
    { key: "system", label: "System" },
  ];

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
      >
        <Bell className="w-5 h-5" />
        {/* Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg shadow-red-500/40"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
        {/* Pulse ring for critical unread */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/20 pointer-events-none" />
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-[380px] bg-[#0f0f18] border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden z-[60]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                <h3 className="font-black text-white text-sm tracking-wider uppercase">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-white/5 px-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                    filter === tab.key
                      ? "text-purple-400 border-purple-400"
                      : "text-gray-500 border-transparent hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
              <AnimatePresence mode="popLayout">
                {filtered.length > 0 ? (
                  filtered.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href={notif.href}
                        onClick={() => {
                          markRead(notif.id);
                          setIsOpen(false);
                        }}
                        className={`block p-4 border-b border-white/5 transition-all duration-200 group relative ${
                          notif.read
                            ? "hover:bg-white/[0.03]"
                            : "bg-purple-500/[0.04] hover:bg-purple-500/[0.08]"
                        }`}
                      >
                        {/* Unread indicator */}
                        {!notif.read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
                        )}

                        <div className="flex items-start gap-3 pl-2">
                          {/* Icon */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getNotificationBg(notif.type)}`}
                          >
                            {getNotificationIcon(notif.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-black ${
                                  notif.read ? "text-gray-400" : "text-white"
                                }`}
                              >
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-gray-500 shrink-0">
                                {formatTimeAgo(notif.timestamp)}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 leading-relaxed ${
                                notif.read
                                  ? "text-gray-500"
                                  : "text-gray-300"
                              }`}
                            >
                              {notif.message}
                            </p>
                          </div>

                          {/* Dismiss button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dismissNotification(notif.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500 font-medium">
                      No notifications
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="block text-center text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider transition-colors py-1"
              >
                View All Notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
