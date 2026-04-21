"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { ExternalLink, Play, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Ad {
  id: string;
  title: string;
  type: 'IMAGE' | 'VIDEO' | 'LINK';
  contentUrl: string;
  targetUrl?: string;
  placement: string;
  duration?: number;
  reward: number;
}

export default function AdBanner({ placement }: { placement: string }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ads/placement/${placement}`);
        setAds(res.data);
      } catch (err) {
        console.error(`Failed to fetch ads for ${placement}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [placement]);

  const handleClaimReward = async (adId: string) => {
    setClaiming(adId);
    try {
      const res = await axios.post(`${API_URL}/api/ads/${adId}/claim`, {}, { withCredentials: true });
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to claim reward");
    } finally {
      setClaiming(null);
    }
  };

  if (loading || ads.length === 0) return null;

  return (
    <div className="space-y-4">
      {ads.map((ad) => (
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group overflow-hidden rounded-[2rem] bg-[#0f0f18] border border-purple-500/10 hover:border-purple-500/30 transition-all shadow-xl"
        >
          {ad.type === 'IMAGE' && (
            <div className="relative">
              <a 
                href={ad.targetUrl || "#"} 
                target={ad.targetUrl ? "_blank" : "_self"}
                className="block relative aspect-[21/9] md:aspect-[32/9] overflow-hidden"
              >
                <img src={ad.contentUrl} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <p className="text-white font-black text-lg tracking-tight">{ad.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[8px] font-black text-white/60 uppercase tracking-widest border border-white/10">Sponsor</span>
                    {ad.targetUrl && <ExternalLink className="w-3 h-3 text-purple-400" />}
                  </div>
                </div>
              </a>
              {ad.reward > 0 && (
                <button
                  onClick={() => handleClaimReward(ad.id)}
                  disabled={claiming === ad.id}
                  className="absolute top-4 right-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] rounded-full transition-all shadow-lg flex items-center gap-2"
                >
                  <Coins className="w-3 h-3" /> CLAIM {ad.reward} COINS
                </button>
              )}
            </div>
          )}

          {ad.type === 'VIDEO' && (
            <div className="relative">
              <div className="relative aspect-video overflow-hidden">
                <iframe 
                  src={ad.contentUrl} 
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
                <div className="absolute top-4 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white/80 border border-white/10 uppercase tracking-widest flex items-center gap-2">
                  <Play className="w-3 h-3 text-purple-400" /> {ad.title}
                </div>
              </div>
              {ad.reward > 0 && (
                <button
                  onClick={() => handleClaimReward(ad.id)}
                  disabled={claiming === ad.id}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Coins className="w-4 h-4" /> Claim Reward ({ad.reward} Coins)
                </button>
              )}
            </div>
          )}

          {ad.type === 'LINK' && (
            <div className="relative">
              <a 
                href={ad.contentUrl} 
                target="_blank"
                className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 hover:from-purple-600/20 hover:to-indigo-600/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                    <ExternalLink className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-black uppercase tracking-widest text-sm">{ad.title}</p>
                    <p className="text-gray-500 text-xs font-bold">Official Partner Link</p>
                  </div>
                </div>
                <div className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-xs tracking-widest hover:bg-purple-500 transition-all">
                  VISIT NOW
                </div>
              </a>
              {ad.reward > 0 && (
                <button
                  onClick={() => handleClaimReward(ad.id)}
                  disabled={claiming === ad.id}
                  className="w-full py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-t border-yellow-500/20"
                >
                  <Coins className="w-3 h-3" /> CLAIM {ad.reward} COINS AFTER VISITING
                </button>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}