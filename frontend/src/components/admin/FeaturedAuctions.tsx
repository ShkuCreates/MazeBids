"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Flame, TrendingUp, Zap, Eye, X } from "lucide-react";

interface Auction {
  id: string;
  product: string;
  currentBid: number;
  image: string;
  isFeatured: boolean;
  isHot: boolean;
  isTrending: boolean;
  boostedUntil?: string;
}

const mockAuctions: Auction[] = [
  { id: "1", product: "iPhone 15 Pro Max", currentBid: 45000, image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200", isFeatured: true, isHot: true, isTrending: false },
  { id: "2", product: "MacBook Air M3", currentBid: 68000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200", isFeatured: true, isHot: false, isTrending: true },
  { id: "3", product: "AirPods Pro 2", currentBid: 12000, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200", isFeatured: false, isHot: true, isTrending: false },
  { id: "4", product: "iPad Pro 12.9", currentBid: 52000, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200", isFeatured: false, isHot: false, isTrending: true },
  { id: "5", product: "Apple Watch Ultra", currentBid: 35000, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200", isFeatured: true, isHot: false, isTrending: false, boostedUntil: "2024-04-24T12:00:00" },
];

export default function FeaturedAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);

  const toggleFeatured = (auctionId: string) => {
    setAuctions(auctions.map(a => 
      a.id === auctionId ? { ...a, isFeatured: !a.isFeatured } : a
    ));
  };

  const toggleHot = (auctionId: string) => {
    setAuctions(auctions.map(a => 
      a.id === auctionId ? { ...a, isHot: !a.isHot } : a
    ));
  };

  const toggleTrending = (auctionId: string) => {
    setAuctions(auctions.map(a => 
      a.id === auctionId ? { ...a, isTrending: !a.isTrending } : a
    ));
  };

  const setBoost = (auctionId: string, hours: number) => {
    const boostUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setAuctions(auctions.map(a => 
      a.id === auctionId ? { ...a, boostedUntil: boostUntil } : a
    ));
  };

  const removeBoost = (auctionId: string) => {
    setAuctions(auctions.map(a => 
      a.id === auctionId ? { ...a, boostedUntil: undefined } : a
    ));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Featured & Boosted Auctions</h1>
        <p className="text-gray-500 mt-1">Manage featured status and visibility boosts</p>
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
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                {auction.isFeatured && (
                  <span className="px-2 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-white flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </span>
                )}
                {auction.isHot && (
                  <span className="px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-white flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Hot
                  </span>
                )}
                {auction.isTrending && (
                  <span className="px-2 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-white flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </span>
                )}
                {auction.boostedUntil && (
                  <span className="px-2 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase text-white flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Boosted
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-white text-lg">{auction.product}</h3>
                <p className="text-sm text-gray-500">Current bid: {auction.currentBid.toLocaleString()} coins</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${auction.isFeatured ? "text-yellow-500" : "text-gray-600"}`} />
                    <span className="text-sm text-white">Featured</span>
                  </div>
                  <button
                    onClick={() => toggleFeatured(auction.id)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      auction.isFeatured ? "bg-yellow-500" : "bg-gray-700"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      auction.isFeatured ? "right-1" : "left-1"
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${auction.isHot ? "text-red-500" : "text-gray-600"}`} />
                    <span className="text-sm text-white">Hot</span>
                  </div>
                  <button
                    onClick={() => toggleHot(auction.id)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      auction.isHot ? "bg-red-500" : "bg-gray-700"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      auction.isHot ? "right-1" : "left-1"
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${auction.isTrending ? "text-purple-500" : "text-gray-600"}`} />
                    <span className="text-sm text-white">Trending</span>
                  </div>
                  <button
                    onClick={() => toggleTrending(auction.id)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      auction.isTrending ? "bg-purple-500" : "bg-gray-700"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      auction.isTrending ? "right-1" : "left-1"
                    }`} />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                {auction.boostedUntil ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <Zap className="w-4 h-4" />
                      <span>Boosted until {new Date(auction.boostedUntil).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => removeBoost(auction.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBoost(auction.id, 24)}
                      className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                    >
                      Boost 24h
                    </button>
                    <button
                      onClick={() => setBoost(auction.id, 72)}
                      className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                    >
                      Boost 72h
                    </button>
                    <button
                      onClick={() => setBoost(auction.id, 168)}
                      className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                    >
                      Boost 7d
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
