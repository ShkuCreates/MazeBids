"use client";

import { motion } from "framer-motion";

export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 space-y-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/5 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-24 animate-pulse" />
          <div className="h-3 bg-white/5 rounded w-16 animate-pulse" />
        </div>
      </div>
      <div className="h-8 bg-white/5 rounded w-32 animate-pulse" />
    </motion.div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-[#0f0f18] border border-white/5 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded w-48 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-32 animate-pulse" />
          </div>
          <div className="h-8 bg-white/5 rounded w-20 animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 h-80"
    >
      <div className="h-6 bg-white/5 rounded w-32 animate-pulse mb-6" />
      <div className="h-56 bg-white/5 rounded-xl animate-pulse" />
    </motion.div>
  );
}
