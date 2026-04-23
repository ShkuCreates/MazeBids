"use client";

import { motion } from "framer-motion";
import { Inbox, Search, Users, Gavel, Coins } from "lucide-react";

interface EmptyStateProps {
  icon?: "inbox" | "search" | "users" | "auctions" | "coins";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  inbox: Inbox,
  search: Search,
  users: Users,
  auctions: Gavel,
  coins: Coins,
};

export default function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
