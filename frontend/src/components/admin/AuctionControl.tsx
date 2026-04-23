"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gavel, Pause, Play, X, Edit, Clock, TrendingUp, Eye, MoreVertical } from "lucide-react";
import Modal from "./Modal";
import EmptyState from "./EmptyState";

interface Auction {
  id: string;
  product: string;
  currentBid: number;
  totalBids: number;
  timeLeft: string;
  status: "active" | "paused" | "ended";
  image: string;
  startTime: string;
  endTime: string;
}

const mockAuctions: Auction[] = [
  { id: "1", product: "iPhone 15 Pro Max", currentBid: 45000, totalBids: 23, timeLeft: "2h 15m", status: "active", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200", startTime: "2024-04-23T10:00:00", endTime: "2024-04-23T14:00:00" },
  { id: "2", product: "MacBook Air M3", currentBid: 68000, totalBids: 31, timeLeft: "45m", status: "active", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200", startTime: "2024-04-23T11:00:00", endTime: "2024-04-23T13:00:00" },
  { id: "3", product: "AirPods Pro 2", currentBid: 12000, totalBids: 15, timeLeft: "3h 30m", status: "paused", image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200", startTime: "2024-04-23T09:00:00", endTime: "2024-04-23T15:00:00" },
  { id: "4", product: "iPad Pro 12.9", currentBid: 52000, totalBids: 18, timeLeft: "0m", status: "ended", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200", startTime: "2024-04-22T10:00:00", endTime: "2024-04-23T10:00:00" },
  { id: "5", product: "Apple Watch Ultra", currentBid: 35000, totalBids: 12, timeLeft: "1h 45m", status: "active", image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200", startTime: "2024-04-23T11:30:00", endTime: "2024-04-23T14:30:00" },
];

export default function AuctionControl() {
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"edit" | "history" | null>(null);

  const handlePauseResume = (auctionId: string) => {
    setAuctions(auctions.map(a => 
      a.id === auctionId 
        ? { ...a, status: a.status === "active" ? "paused" : "active" as "active" | "paused" | "ended" }
        : a
    ));
  };

  const handleEndAuction = (auctionId: string) => {
    setAuctions(auctions.map(a => 
      a.id === auctionId ? { ...a, status: "ended" as const, timeLeft: "0m" } : a
    ));
  };

  const handleCancelAuction = (auctionId: string) => {
    setAuctions(auctions.filter(a => a.id !== auctionId));
  };

  const openModal = (auction: Auction, type: "edit" | "history") => {
    setSelectedAuction(auction);
    setModalType(type);
    setModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "paused": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "ended": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Auction Control</h1>
          <p className="text-gray-500 mt-1">Manage all platform auctions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
            {auctions.filter(a => a.status === "active").length} Active
          </span>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
            {auctions.filter(a => a.status === "paused").length} Paused
          </span>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
            {auctions.filter(a => a.status === "ended").length} Ended
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction, index) => (
          <motion.div
            key={auction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-[#0f0f18] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
          >
            <div className="relative h-40">
              <img src={auction.image} alt={auction.product} className="w-full h-full object-cover" />
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(auction.status)}`}>
                {auction.status}
              </div>
              <div className="absolute top-3 right-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                {auction.timeLeft}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-white text-lg">{auction.product}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-sm font-bold text-white">{auction.currentBid.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-sm font-bold text-white">{auction.totalBids} bids</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                {auction.status === "active" && (
                  <button
                    onClick={() => handlePauseResume(auction.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl text-xs font-bold transition-all border border-yellow-500/20"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </button>
                )}
                {auction.status === "paused" && (
                  <button
                    onClick={() => handlePauseResume(auction.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl text-xs font-bold transition-all border border-green-500/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>
                )}
                {auction.status === "active" && (
                  <button
                    onClick={() => handleEndAuction(auction.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-all border border-red-500/20"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    End
                  </button>
                )}
                <button
                  onClick={() => openModal(auction, "edit")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openModal(auction, "history")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCancelAuction(auction.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {auctions.length === 0 && (
        <EmptyState
          icon="auctions"
          title="No auctions found"
          description="Create your first auction to get started"
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "edit" ? "Edit Auction" : "Bid History"}
        size="lg"
      >
        {selectedAuction && modalType === "edit" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img src={selectedAuction.image} alt={selectedAuction.product} className="w-20 h-20 rounded-xl object-cover" />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedAuction.product}</h3>
                <p className="text-gray-500">Current bid: {selectedAuction.currentBid.toLocaleString()} coins</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Product Name</label>
                <input
                  type="text"
                  defaultValue={selectedAuction.product}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Current Bid</label>
                <input
                  type="number"
                  defaultValue={selectedAuction.currentBid}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
                />
              </div>
            </div>
            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all">
              Save Changes
            </button>
          </div>
        )}

        {selectedAuction && modalType === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center font-bold text-purple-400">U</div>
                <div>
                  <p className="font-bold text-white">User123</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <p className="font-bold text-white">{selectedAuction.currentBid.toLocaleString()} coins</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center font-bold text-pink-400">B</div>
                <div>
                  <p className="font-bold text-white">BidMaster</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <p className="font-bold text-white">{(selectedAuction.currentBid - 500).toLocaleString()} coins</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center font-bold text-blue-400">A</div>
                <div>
                  <p className="font-bold text-white">AuctionPro</p>
                  <p className="text-xs text-gray-500">8 minutes ago</p>
                </div>
              </div>
              <p className="font-bold text-white">{(selectedAuction.currentBid - 1000).toLocaleString()} coins</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
