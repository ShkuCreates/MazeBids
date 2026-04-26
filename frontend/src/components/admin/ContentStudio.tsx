"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Copy, Download, RefreshCw, Calendar, Hash,
  Play, Mic, Image, FileText, Trophy, Gift, TrendingUp,
  Gamepad2, HelpCircle, Zap, CheckCircle, ChevronRight,
  Volume2, Loader2, Star, Users, Clock
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContentType {
  id: string;
  label: string;
  icon: any;
  color: string;
  description: string;
  prompt: string;
}

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  reelScript: string;
  hook: string;
  cta: string;
  postIdea: string;
  tips: string[];
}

interface Auction {
  id: string;
  title: string;
  currentBid: number;
  endTime: string;
  image?: string;
}

// ─── Content Types ────────────────────────────────────────────────────────────

const CONTENT_TYPES: ContentType[] = [
  {
    id: "how_it_works",
    label: "How Website Works",
    icon: HelpCircle,
    color: "from-blue-500 to-cyan-500",
    description: "Explainer content about MazeBids",
    prompt: "Create Instagram content explaining how MazeBids works: users earn coins by playing games, watching ads, daily check-ins, and referrals, then use coins to bid in auctions and win real products.",
  },
  {
    id: "new_games",
    label: "New Games",
    icon: Gamepad2,
    color: "from-purple-500 to-indigo-500",
    description: "Announce games on the platform",
    prompt: "Create hype Instagram content announcing the games available on MazeBids: Speed Clicker, Memory Match, and Emoji Hit. Make it exciting and viral.",
  },
  {
    id: "how_to_play",
    label: "How To Play Games",
    icon: Play,
    color: "from-pink-500 to-rose-500",
    description: "Tutorial content for games",
    prompt: "Create a step-by-step Instagram reel script teaching viewers how to play games on MazeBids to earn coins. Focus on Speed Clicker, Memory Match, Emoji Hit.",
  },
  {
    id: "earn_more",
    label: "How To Earn More",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    description: "Tips to maximize coin earnings",
    prompt: "Create Instagram content with power tips on how to earn maximum coins on MazeBids: daily streaks, referral codes, bonus codes, watching ads, playing games daily.",
  },
  {
    id: "auction_tips",
    label: "Auction Tips",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    description: "Smart bidding strategies",
    prompt: "Create Instagram content with pro auction tips for MazeBids: when to bid, how to save coins, bidding in the last seconds, which auctions to target.",
  },
  {
    id: "winner_showcase",
    label: "Winner Showcase",
    icon: Trophy,
    color: "from-amber-500 to-yellow-500",
    description: "Celebrate auction winners",
    prompt: "Create a winner celebration Instagram post for MazeBids. Someone just won a product in an auction using coins they earned for FREE. Make it viral and exciting.",
  },
  {
    id: "bonus_code",
    label: "Bonus Code Drop",
    icon: Gift,
    color: "from-red-500 to-pink-500",
    description: "Hype posts for code releases",
    prompt: "Create a hype Instagram post teasing a bonus code drop on MazeBids. Make followers feel FOMO and excited to follow for the code.",
  },
  {
    id: "leaderboard",
    label: "Leaderboard Flex",
    icon: Star,
    color: "from-violet-500 to-purple-500",
    description: "Weekly top earners highlight",
    prompt: "Create an Instagram post showcasing the weekly leaderboard on MazeBids. Make top coin earners feel celebrated and make others want to compete.",
  },
  {
    id: "daily_challenge",
    label: "Daily Challenge",
    icon: Calendar,
    color: "from-teal-500 to-cyan-500",
    description: "Daily engagement posts",
    prompt: "Create an Instagram daily challenge post for MazeBids. Challenge followers to earn 500 coins today using the platform's games and tasks.",
  },
  {
    id: "referral",
    label: "Referral Program",
    icon: Users,
    color: "from-indigo-500 to-blue-500",
    description: "Promote the referral system",
    prompt: "Create Instagram content promoting MazeBids referral program: invite 5 friends, get 500 bonus coins. Make it sound like free money.",
  },
];

// ─── Calendar Schedule ────────────────────────────────────────────────────────

const CALENDAR = [
  { day: "Monday", type: "How To Earn More", time: "6:00 PM IST", emoji: "💰" },
  { day: "Tuesday", type: "How To Play Games", time: "7:00 PM IST", emoji: "🎮" },
  { day: "Wednesday", type: "Auction Tips", time: "6:30 PM IST", emoji: "⚡" },
  { day: "Thursday", type: "Winner Showcase", time: "8:00 PM IST", emoji: "🏆" },
  { day: "Friday", type: "Bonus Code Drop", time: "6:00 PM IST", emoji: "🎁" },
  { day: "Saturday", type: "Leaderboard Flex", time: "5:00 PM IST", emoji: "⭐" },
  { day: "Sunday", type: "How Website Works", time: "7:00 PM IST", emoji: "🌐" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContentStudio() {
  const [selectedType, setSelectedType] = useState<ContentType>(CONTENT_TYPES[0]);
  const [activeTab, setActiveTab] = useState<"generate" | "calendar" | "scripts">("generate");
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auctions`, { withCredentials: true });
        setAuctions(res.data?.slice(0, 5) || []);
      } catch {
        setAuctions([]);
      }
    };
    fetchAuctions();
  }, []);

  const generateContent = async () => {
    setGenerating(true);
    setContent(null);
    try {
      const auctionContext = selectedAuction
        ? `Current featured auction: "${selectedAuction.title}" with current bid of ${selectedAuction.currentBid} coins.`
        : "";
      const customContext = customNote ? `Additional context: ${customNote}` : "";

      const fullPrompt = `You are a viral social media content creator for MazeBids, a gamified auction platform where users earn coins by playing games and win real products through auctions. Everything is FREE to start.

${selectedType.prompt}

${auctionContext}
${customContext}

Respond ONLY with a valid JSON object (no markdown, no backticks) in this exact format:
{
  "caption": "Full Instagram caption (2-3 paragraphs, engaging, 2026 style, use emojis naturally)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10", "hashtag11", "hashtag12", "hashtag13", "hashtag14", "hashtag15", "hashtag16", "hashtag17", "hashtag18", "hashtag19", "hashtag20", "hashtag21", "hashtag22", "hashtag23", "hashtag24", "hashtag25", "hashtag26", "hashtag27", "hashtag28", "hashtag29", "hashtag30"],
  "hook": "First 3 seconds reel hook sentence (must stop the scroll)",
  "reelScript": "Full 30-60 second reel voiceover script with [PAUSE] markers and [SHOW: visual cue] markers",
  "cta": "Call to action for end of post/reel",
  "postIdea": "Visual description of what the post image or reel should look like",
  "tips": ["tip1", "tip2", "tip3"]
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: fullPrompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed: GeneratedContent = JSON.parse(clean);
      setContent(parsed);
    } catch (err) {
      console.error("Content generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const speakScript = (text: string) => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, ""));
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") && v.lang === "en-US")
      || voices.find(v => v.lang === "en-US")
      || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const downloadCaption = () => {
    if (!content) return;
    const text = `CAPTION:\n${content.caption}\n\nHASHTAGS:\n${content.hashtags.map(h => `#${h}`).join(" ")}\n\nCTA:\n${content.cta}\n\nREEL SCRIPT:\n${content.reelScript}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mazebids-${selectedType.id}-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Content Studio</h1>
            <p className="text-gray-400 text-sm">AI-powered Instagram content for MazeBids</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: "generate", label: "Generate", icon: Sparkles },
            { id: "calendar", label: "Content Calendar", icon: Calendar },
            { id: "scripts", label: "Script Library", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── GENERATE TAB ── */}
        {activeTab === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left — Content Type Picker */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Content Type</p>
                <div className="space-y-2">
                  {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType.id === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => { setSelectedType(type); setContent(null); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          isSelected
                            ? "bg-white/10 border border-white/20"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-gray-300"}`}>{type.label}</p>
                          <p className="text-[10px] text-gray-500 truncate">{type.description}</p>
                        </div>
                        {isSelected && <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auction Selector */}
              {auctions.length > 0 && (
                <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Feature an Auction</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedAuction(null)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all ${!selectedAuction ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:bg-white/5"}`}
                    >
                      None (general content)
                    </button>
                    {auctions.map((auction) => (
                      <button
                        key={auction.id}
                        onClick={() => setSelectedAuction(auction)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all ${selectedAuction?.id === auction.id ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:bg-white/5"}`}
                      >
                        <p className="font-bold truncate">{auction.title}</p>
                        <p className="text-gray-500">{auction.currentBid} coins</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Note */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Custom Note (optional)</p>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. mention PS5, focus on beginners, make it funny..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 resize-none h-20"
                />
              </div>

              <button
                onClick={generateContent}
                disabled={generating}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-sm tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> GENERATE CONTENT</>
                )}
              </button>
            </div>

            {/* Right — Output */}
            <div className="lg:col-span-2 space-y-4">
              {!content && !generating && (
                <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedType.color} flex items-center justify-center mb-4`}>
                    <selectedType.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-black text-lg mb-2">{selectedType.label}</h3>
                  <p className="text-gray-500 text-sm max-w-xs">{selectedType.description}</p>
                  <p className="text-gray-600 text-xs mt-4">Select a content type and click Generate</p>
                </div>
              )}

              {generating && (
                <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
                  <p className="text-white font-bold">Claude is writing your content...</p>
                  <p className="text-gray-500 text-sm mt-1">Crafting viral captions, hashtags & reel script</p>
                </div>
              )}

              {content && !generating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Actions bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Generated for: {selectedType.label}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={generateContent}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                      <button
                        onClick={downloadCaption}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-xs font-bold text-purple-300 transition-all border border-purple-500/30"
                      >
                        <Download className="w-3 h-3" /> Download All
                      </button>
                    </div>
                  </div>

                  {/* Hook */}
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1"><Zap className="w-3 h-3" /> Scroll-Stop Hook (First 3s)</p>
                      <button onClick={() => copyToClipboard(content.hook, "hook")} className="text-yellow-400/60 hover:text-yellow-400 transition-colors">
                        {copied === "hook" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-white font-black text-lg">{content.hook}</p>
                  </div>

                  {/* Caption */}
                  <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Image className="w-3 h-3" /> Instagram Caption</p>
                      <button onClick={() => copyToClipboard(content.caption, "caption")} className="text-gray-400 hover:text-white transition-colors">
                        {copied === "caption" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">{content.caption}</p>
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-purple-400 font-bold text-xs">{content.cta}</p>
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Hash className="w-3 h-3" /> 30 Hashtags</p>
                      <button
                        onClick={() => copyToClipboard(content.hashtags.map(h => `#${h}`).join(" "), "hashtags")}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copied === "hashtags" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {content.hashtags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[11px] text-purple-300 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reel Script */}
                  <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Mic className="w-3 h-3" /> Reel Script + Voiceover</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => speakScript(content.reelScript)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${speaking ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"}`}
                        >
                          <Volume2 className="w-3 h-3" />
                          {speaking ? "Stop" : "Play"}
                        </button>
                        <button onClick={() => copyToClipboard(content.reelScript, "script")} className="text-gray-400 hover:text-white transition-colors">
                          {copied === "script" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3 font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                      {content.reelScript}
                    </div>
                  </div>

                  {/* Post Idea + Tips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Image className="w-3 h-3" /> Visual Idea</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{content.postIdea}</p>
                    </div>
                    <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Star className="w-3 h-3" /> Pro Tips</p>
                      <ul className="space-y-2">
                        {content.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── CALENDAR TAB ── */}
        {activeTab === "calendar" && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="font-black text-white">Weekly Content Calendar</h2>
                  <p className="text-gray-400 text-xs">Best posting times for Indian audience (IST)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {CALENDAR.map((day, i) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{day.emoji}</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                        <Clock className="w-3 h-3" />{day.time}
                      </span>
                    </div>
                    <p className="font-black text-white text-sm">{day.day}</p>
                    <p className="text-purple-300 text-xs mt-1">{day.type}</p>
                    <button
                      onClick={() => {
                        const type = CONTENT_TYPES.find(t => t.label === day.type);
                        if (type) { setSelectedType(type); setActiveTab("generate"); }
                      }}
                      className="mt-3 w-full py-1.5 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-xs font-bold text-purple-300 transition-all border border-purple-500/20"
                    >
                      Generate →
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6">
              <h3 className="font-black text-white mb-4">2026 Instagram Best Practices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { tip: "Post Reels 3-4x per week for maximum reach", icon: "🎬" },
                  { tip: "Use 4:5 ratio (1080x1350px) for feed posts", icon: "📐" },
                  { tip: "First 3 seconds of reel must hook viewers", icon: "⚡" },
                  { tip: "Add subtitles — 85% watch without sound", icon: "💬" },
                  { tip: "Post at 6-9 PM IST for Indian audience peak", icon: "🕕" },
                  { tip: "Use 20-30 hashtags, mix big and niche ones", icon: "#️⃣" },
                  { tip: "Reply to every comment in first 30 minutes", icon: "💬" },
                  { tip: "Add a clear CTA in every post", icon: "👆" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-gray-300 text-sm">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCRIPTS TAB ── */}
        {activeTab === "scripts" && (
          <motion.div
            key="scripts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6">
              <h2 className="font-black text-white mb-2">Reel Script Templates</h2>
              <p className="text-gray-400 text-sm mb-6">Pre-written scripts you can use directly. Edit the [BRACKETS] with your details.</p>
              <div className="space-y-4">
                {[
                  {
                    title: "How It Works — 30s Script",
                    emoji: "🌐",
                    script: `[SHOW: Phone with MazeBids homepage]
"Wait... you can win a PS5 for FREE?" [PAUSE]

[SHOW: Coin earning screen]
"Here's how. On MazeBids, you earn coins just by playing games, watching videos, and checking in daily."

[SHOW: Auction page]
"Then you use those coins to bid in live auctions for real products — iPhones, AirPods, PS5s."

[SHOW: Winner notification]
"Real people are winning every single day. And it costs nothing to start."

[SHOW: Sign up button]
"Link in bio. Join free. Start earning today." [PAUSE]
"Don't sleep on this." 🔥`,
                  },
                  {
                    title: "Auction Tips — 45s Script",
                    emoji: "⚡",
                    script: `[SHOW: Auction countdown timer]
"If you're losing every auction on MazeBids, you need these tips." [PAUSE]

[SHOW: Save coins visual]
"Tip one. Don't bid early. Save your coins."

[SHOW: Last 30 seconds]
"Tip two. Strike in the last 30 seconds. That's when everyone panics."

[SHOW: Low competition auctions]
"Tip three. Find auctions ending at odd hours — less competition."

[SHOW: Referral coins]
"Tip four. Earn bonus coins from referrals so you always have backup."

[SHOW: Winner screen]
"Use these and you'll be the one celebrating." ✅
"Link in bio — start bidding smart."`,
                  },
                  {
                    title: "Daily Earning Tips — 30s Script",
                    emoji: "💰",
                    script: `[SHOW: Coins being added]
"I earned [AMOUNT] coins on MazeBids today without spending a single rupee. Here's how." [PAUSE]

[SHOW: Daily check-in]
"One. Daily check-in. Takes 2 seconds. Free coins."

[SHOW: Speed Clicker game]
"Two. Speed Clicker game. 10 seconds. 50 coins."

[SHOW: Referral screen]
"Three. Refer one friend. 100 coins instantly."

[SHOW: Bonus code being entered]
"Four. Follow us for bonus code drops. Free coins daily."

[SHOW: Coin total]
"Stack coins. Win auctions. It's literally free." 🚀`,
                  },
                ].map((script, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{script.emoji}</span>
                        <h3 className="font-black text-white text-sm">{script.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => speakScript(script.script)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-all"
                        >
                          <Volume2 className="w-3 h-3" /> Preview Voice
                        </button>
                        <button
                          onClick={() => copyToClipboard(script.script, `script-${i}`)}
                          className="flex items-center gap-1 px-2 py-1 bg-white/5 text-gray-300 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
                        >
                          {copied === `script-${i}` ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                    </div>
                    <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-black/30 rounded-xl p-4">
                      {script.script}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}