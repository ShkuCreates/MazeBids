import React, { memo } from "react";
import { motion } from "framer-motion";
import { Clock, Coins, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

interface RealAuctionCardProps {
  id: string;
  title: string;
  description: string;
  product: string;
  image: string;
  currentBid: number;
  timeLeft: string;
  highestBidder: { username: string } | null;
  status: string;
  isRecent: boolean;
}

const RealAuctionCard = memo<RealAuctionCardProps>(({
  id,
  title,
  description,
  product,
  image,
  currentBid,
  timeLeft,
  highestBidder,
  status,
  isRecent
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-[#0f0f18] border border-white/5 rounded-[3.5rem] overflow-hidden hover:border-purple-500/40 transition-all duration-700 hover:shadow-[0_0_80px_-20px_rgba(139,92,246,0.4)] flex flex-col"
    >
      <div className="flex flex-col md:flex-row min-h-[300px] sm:min-h-[400px]">
        <div className="md:w-[45%] relative overflow-hidden bg-[#0a0a0f]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-transparent to-transparent opacity-60" />
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            <div className={`px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 shadow-2xl backdrop-blur-md ${
              status === 'ACTIVE' ? 'bg-red-600/90 text-white animate-pulse' : 'bg-blue-600/90 text-white'
            }`}>
              <div className={`w-2 h-2 rounded-full bg-white ${status === 'ACTIVE' ? 'animate-ping' : ''}`} />
              {status}
            </div>
            <div className="bg-black/60 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-[10px] font-black border border-white/10 flex items-center gap-2">
              💎 {product}
            </div>
          </div>
        </div>
        <div className="md:w-[55%] p-4 sm:p-10 flex flex-col justify-between space-y-4 sm:space-y-8 relative">
          <div className="space-y-2 sm:space-y-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-xl sm:text-3xl font-black text-white group-hover:text-purple-400 transition-colors leading-tight">
                {title}
              </h3>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all">
                <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 bg-white/[0.03] rounded-2xl sm:rounded-[2rem] border border-white/5 relative overflow-hidden">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Bid</p>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <p className="text-xl sm:text-3xl font-black text-white">{currentBid.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Time Left</p>
              <div className="flex items-center gap-2 text-purple-400">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <p className="text-2xl font-black tracking-tighter">{timeLeft}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pt-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center shadow-inner">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Highest Bidder</p>
                <p className="text-white font-bold text-sm sm:text-base">{highestBidder?.username || "No bids yet"}</p>
              </div>
            </div>
            <Link
              href={`/auctions/${id}`}
              className="group/btn relative px-6 sm:px-8 py-3 sm:py-5 rounded-2xl font-black text-sm tracking-widest transition-all shadow-2xl active:scale-95 bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/30 w-full sm:w-auto text-center"
            >
              <span className="relative z-10 flex items-center gap-2 uppercase justify-center">
                {status === 'ACTIVE' ? 'Bid Now' : 'View Details'}
                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity blur-lg" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.currentBid === next.currentBid &&
    prev.timeLeft === next.timeLeft &&
    prev.highestBidder?.username === next.highestBidder?.username &&
    prev.status === next.status
  );
});

RealAuctionCard.displayName = 'RealAuctionCard';

export default RealAuctionCard;
