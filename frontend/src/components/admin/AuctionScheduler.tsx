"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Plus, Trash2, Play, X, Gavel } from "lucide-react";
import Modal from "./Modal";

interface ScheduledAuction {
  id: string;
  product: string;
  image: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  startingBid: number;
  status: "scheduled" | "running" | "completed" | "cancelled";
}

const mockScheduledAuctions: ScheduledAuction[] = [
  { id: "1", product: "PS5 Console", image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=200", scheduledDate: "2024-04-24", scheduledTime: "14:00", duration: 60, startingBid: 5000, status: "scheduled" },
  { id: "2", product: "Nintendo Switch", image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=200", scheduledDate: "2024-04-24", scheduledTime: "16:00", duration: 30, startingBid: 3000, status: "scheduled" },
  { id: "3", product: "Xbox Series X", image: "https://images.unsplash.com/photo-1626804475297-411dbe86e4c4?w=200", scheduledDate: "2024-04-25", scheduledTime: "10:00", duration: 120, startingBid: 8000, status: "scheduled" },
];

export default function AuctionScheduler() {
  const [scheduledAuctions, setScheduledAuctions] = useState<ScheduledAuction[]>(mockScheduledAuctions);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    image: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    startingBid: "",
  });

  const handleScheduleAuction = () => {
    const newAuction: ScheduledAuction = {
      id: Date.now().toString(),
      product: formData.product,
      image: formData.image,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      duration: formData.duration,
      startingBid: parseInt(formData.startingBid),
      status: "scheduled",
    };
    setScheduledAuctions([...scheduledAuctions, newAuction]);
    setModalOpen(false);
    setFormData({
      product: "",
      image: "",
      scheduledDate: "",
      scheduledTime: "",
      duration: 60,
      startingBid: "",
    });
  };

  const handleCancelSchedule = (auctionId: string) => {
    setScheduledAuctions(scheduledAuctions.map(a => 
      a.id === auctionId ? { ...a, status: "cancelled" as const } : a
    ));
  };

  const handleDeleteSchedule = (auctionId: string) => {
    setScheduledAuctions(scheduledAuctions.filter(a => a.id !== auctionId));
  };

  const handleStartNow = (auctionId: string) => {
    setScheduledAuctions(scheduledAuctions.map(a => 
      a.id === auctionId ? { ...a, status: "running" as const } : a
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "running": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Auction Scheduler</h1>
          <p className="text-gray-500 mt-1">Schedule and manage automated auctions</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          Schedule Auction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Scheduled</p>
          <p className="text-2xl font-black text-white">{scheduledAuctions.filter(a => a.status === "scheduled").length}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
            <Play className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Running</p>
          <p className="text-2xl font-black text-white">{scheduledAuctions.filter(a => a.status === "running").length}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Completed</p>
          <p className="text-2xl font-black text-white">{scheduledAuctions.filter(a => a.status === "completed").length}</p>
        </motion.div>
      </div>

      <div className="space-y-4">
        {scheduledAuctions.map((auction, index) => (
          <motion.div
            key={auction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden">
                <img src={auction.image} alt={auction.product} className="w-full h-full object-cover" />
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusColor(auction.status)}`}>
                  {auction.status}
                </span>
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold text-white">{auction.product}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(auction.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{auction.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gavel className="w-4 h-4" />
                    <span>{auction.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-500">★</span>
                    <span>Starting: {auction.startingBid.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {auction.status === "scheduled" && (
                  <button
                    onClick={() => handleStartNow(auction.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Now
                  </button>
                )}
                {auction.status === "scheduled" && (
                  <button
                    onClick={() => handleCancelSchedule(auction.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => handleDeleteSchedule(auction.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule New Auction"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
              Product Name
            </label>
            <input
              type="text"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              placeholder="e.g. PS5 Console"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Date
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Time
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Duration (mins)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Starting Bid
              </label>
              <input
                type="number"
                value={formData.startingBid}
                onChange={(e) => setFormData({ ...formData, startingBid: e.target.value })}
                placeholder="1000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>
          </div>

          <button
            onClick={handleScheduleAuction}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
          >
            Schedule Auction
          </button>
        </div>
      </Modal>
    </div>
  );
}
