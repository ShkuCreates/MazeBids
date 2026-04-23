"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Trash2, Clock, CheckCircle, AlertCircle, Info, Gavel, Coins } from "lucide-react";

interface Notification {
  id: string;
  type: "auction" | "reward" | "system";
  message: string;
  sentAt: string;
  status: "sent" | "pending" | "failed";
}

const mockNotifications: Notification[] = [
  { id: "1", type: "auction", message: "New iPhone 15 auction starting in 10 minutes!", sentAt: "2024-04-23T10:00:00", status: "sent" },
  { id: "2", type: "reward", message: "Daily bonus coins have been credited to your account", sentAt: "2024-04-23T09:00:00", status: "sent" },
  { id: "3", type: "system", message: "Scheduled maintenance tonight at 2 AM UTC", sentAt: "2024-04-22T18:00:00", status: "sent" },
];

export default function GlobalNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"auction" | "reward" | "system">("auction");
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: notificationType,
      message,
      sentAt: new Date().toISOString(),
      status: "sent",
    };
    
    setTimeout(() => {
      setNotifications([newNotification, ...notifications]);
      setMessage("");
      setIsSending(false);
    }, 1000);
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "auction": return <Gavel className="w-4 h-4" />;
      case "reward": return <Coins className="w-4 h-4" />;
      case "system": return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "auction": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "reward": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "system": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "text-green-400";
      case "pending": return "text-yellow-400";
      case "failed": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Global Notifications</h1>
        <p className="text-gray-500 mt-1">Send announcements and alerts to all users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Send Notification</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Notification Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["auction", "reward", "system"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNotificationType(type)}
                    className={`p-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      notificationType === type
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white resize-none"
              />
            </div>

            <button
              onClick={handleSendNotification}
              disabled={isSending || !message.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to All Users
                </>
              )}
            </button>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-400 mb-1">Quick Templates</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setMessage("🎉 New auction starting now! Don't miss out!")}
                      className="w-full text-left text-xs text-gray-400 hover:text-white p-2 bg-white/5 rounded-lg transition-colors"
                    >
                      New Auction Alert
                    </button>
                    <button
                      onClick={() => setMessage("🎁 You've received bonus coins! Check your wallet.")}
                      className="w-full text-left text-xs text-gray-400 hover:text-white p-2 bg-white/5 rounded-lg transition-colors"
                    >
                      Reward Notification
                    </button>
                    <button
                      onClick={() => setMessage("⚠️ System maintenance scheduled. Please save your progress.")}
                      className="w-full text-left text-xs text-gray-400 hover:text-white p-2 bg-white/5 rounded-lg transition-colors"
                    >
                      Maintenance Alert
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Notification History</h3>
          </div>

          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div>
                      <p className="font-bold text-white capitalize">{notification.type} Notification</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-bold ${getStatusColor(notification.status)}`}>
                      {notification.status === "sent" && <CheckCircle className="w-3 h-3" />}
                      {notification.status}
                    </span>
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-xl">{notification.message}</p>
              </motion.div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-500">No notifications sent yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
