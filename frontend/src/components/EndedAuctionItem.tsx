import React, { memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Coins } from "lucide-react";

interface EndedAuctionItemProps {
  id: string;
  title: string;
  image: string;
  currentBid: number;
  winnerUsername: string | null;
  index: number;
}

const EndedAuctionItem = memo<EndedAuctionItemProps>(({
  id,
  title,
  image,
  currentBid,
  winnerUsername,
  index
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-2xl overflow-hidden border border-purple-500/20 bg-[#0f0f18] hover:border-purple-500/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-[#0f0f18]/40 to-transparent" />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-yellow-500/30 flex items-center gap-1">
          <Trophy className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] font-black text-yellow-300 uppercase">Ended</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-sm font-black text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
          {title}
        </h3>

        <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-500 uppercase">Winning Bid</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-sm font-black text-white">{currentBid.toLocaleString()}</span>
            </div>
          </div>

          {winnerUsername && (
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-[10px] font-black text-gray-500 uppercase">Winner</span>
              <span className="text-sm font-bold text-purple-400">{winnerUsername}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.currentBid === next.currentBid &&
    prev.winnerUsername === next.winnerUsername
  );
});

EndedAuctionItem.displayName = 'EndedAuctionItem';

export default EndedAuctionItem;
