"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Users } from "lucide-react";
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LiveInterestIndicator({ auctionId }: { auctionId: string }) {
  const [viewers, setViewers] = useState(0);
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    // Simulate initial values
    setViewers(Math.floor(Math.random() * 50) + 10);
    setWaiting(Math.floor(Math.random() * 30) + 5);

    // Simulate real-time updates (replace with socket.io when backend ready)
    const interval = setInterval(() => {
      setViewers((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, prev + change);
      });
      setWaiting((prev) => {
        const change = Math.floor(Math.random() * 3) - 1;
        return Math.max(3, prev + change);
      });
    }, 3000);

    // Socket.io integration for real-time updates (when backend ready)
    const socket = io(API_URL, { withCredentials: true });
    socket.emit("joinAuction", auctionId);

    socket.on("viewersUpdate", (data: { viewers: number; waiting: number }) => {
      setViewers(data.viewers);
      setWaiting(data.waiting);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [auctionId]);

  return (
    <div className="flex items-center gap-4 text-xs">
      {/* Viewers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
      >
        <motion.span
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Eye className="w-3.5 h-3.5 text-green-400" />
        </motion.span>
        <span className="font-bold text-green-400">{viewers}</span>
        <span className="text-gray-400">viewing</span>
      </motion.div>

      {/* Waiting */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20"
      >
        <motion.span
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Users className="w-3.5 h-3.5 text-blue-400" />
        </motion.span>
        <span className="font-bold text-blue-400">{waiting}</span>
        <span className="text-gray-400">waiting</span>
      </motion.div>

      {/* Live pulse */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-red-500"
      />
    </div>
  );
}
