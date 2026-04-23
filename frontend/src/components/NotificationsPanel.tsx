"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  Trophy,
  Coins,
  CheckCheck,
  Gavel,
  Gift,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type NotificationType =
  | "BID_PLACED"
  | "OUTBID"
  | "WIN"
  | "COINS_EARNED"
  | "COINS_SPENT"
  | "REWARD"
  | "REFUND"
  | "SYSTEM";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  amount: number | null;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "BID_PLACED":
      return <Gavel className="w-4 h-4 text-purple-400" />;
    case "OUTBID":
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case "WIN":
      return <Trophy className="w-4 h-4 text-yellow-400" />;
    case "COINS_EARNED":
      return <Coins className="w-4 h-4 text-green-400" />;
    case "COINS_SPENT":
      return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
    case "REWARD":
      return <Gift className="w-4 h-4 text-yellow-400" />;
    case "REFUND":
      return <Coins className="w-4 h-4 text-blue-400" />;
    case "SYSTEM":
      return <Bell className="w-4 h-4 text-blue-400" />;
  }
};

const getNotificationBg = (type: NotificationType) => {
  switch (type) {
    case "BID_PLACED":
      return "bg-purple-500/10 border-purple-500/20";
    case "OUTBID":
      return "bg-red-500/10 border-red-500/20";
    case "WIN":
      return "bg-yellow-500/10 border-yellow-500/20";
    case "COINS_EARNED":
      return "bg-green-500/10 border-green-500/20";
    case "COINS_SPENT":
      return "bg-orange-500/10 border-orange-500/20";
    case "REWARD":
      return "bg-yellow-500/10 border-yellow-500/20";
    case "REFUND":
      return "bg-blue-500/10 border-blue-500/20";
    case "SYSTEM":
      return "bg-blue-500/10 border-blue-500/20";
  }
};

const getNotificationHref = (type: NotificationType, relatedId: string | null) => {
  if (!relatedId) return "/profile";
  switch (type) {
    case "BID_PLACED":
    case "OUTBID":
    case "WIN":
      return `/auctions/${relatedId}`;
    case "COINS_EARNED":
    case "COINS_SPENT":
    case "REWARD":
    case "REFUND":
      return "/profile";
    default:
      return "/profile";
  }
};

const formatTimeAgo = (dateStr: string, mounted: boolean): string => {
  if (!mounted) return "Loading...";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

type FilterTab = "all" | "bids" | "wins" | "system";

const filterMap: Record<FilterTab, NotificationType[] | null> = {
  all: null,
  bids: ["BID_PLACED", "OUTBID", "COINS_SPENT"],
  wins: ["WIN", "REWARD"],
  system: ["COINS_EARNED", "REFUND", "SYSTEM"],
};

export default function NotificationsPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/api/notifications?limit=20`, {
        withCredentials: true,
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Socket.io for real-time notifications
  useEffect(() => {
    if (!user) return;

    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("authenticate", user.id);
    });

    socket.on("notification", (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!mounted) return;
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
  }, [isOpen, mounted]);

  const markAllRead = async () => {
    try {
      await axios.patch(`${API_URL}/api/notifications/read-all`, {}, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, {
        withCredentials: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const filtered = filterMap[filter]
    ? notifications.filter((n) =>
        (filterMap[filter] as NotificationType[]).includes(n.type)
      )
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
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg shadow-red-500/40"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
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
                        href={getNotificationHref(notif.type, notif.relatedId)}
                        onClick={() => {
                          if (!notif.isRead) markRead(notif.id);
                          setIsOpen(false);
                        }}
                        className={`block p-4 border-b border-white/5 transition-all duration-200 group relative ${
                          notif.isRead
                            ? "hover:bg-white/[0.03]"
                            : "bg-purple-500/[0.04] hover:bg-purple-500/[0.08]"
                        }`}
                      >
                        {!notif.isRead && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
                        )}

                        <div className="flex items-start gap-3 pl-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getNotificationBg(notif.type)}`}
                          >
                            {getNotificationIcon(notif.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-black ${
                                  notif.isRead ? "text-gray-400" : "text-white"
                                }`}
                              >
                                {notif.type.replace(/_/g, " ")}
                              </span>
                              <span className="text-[10px] text-gray-500 shrink-0">
                                {formatTimeAgo(notif.createdAt, mounted)}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 leading-relaxed ${
                                notif.isRead ? "text-gray-500" : "text-gray-300"
                              }`}
                            >
                              {notif.message}
                            </p>
                            {notif.amount != null && (
                              <span
                                className={`text-[10px] font-black mt-1 inline-block ${
                                  ["COINS_EARNED", "REWARD", "REFUND", "WIN"].includes(notif.type)
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {["COINS_EARNED", "REWARD", "REFUND", "WIN"].includes(notif.type)
                                  ? "+"
                                  : "-"}
                                {notif.amount} coins
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500 font-medium">
                      No notifications yet
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      Start bidding to see updates
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
