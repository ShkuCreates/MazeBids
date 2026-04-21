import Link from "next/link";
import { Gavel, PlayCircle, ShieldCheck, Trophy } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Play & Earn",
      desc: "Complete mini-games and tasks to earn virtual coins for free.",
      icon: PlayCircle,
      color: "text-purple-400",
    },
    {
      title: "Live Auctions",
      desc: "Use your coins to bid on real rewards in real-time.",
      icon: Gavel,
      color: "text-blue-400",
    },
    {
      title: "Fair & Secure",
      desc: "Anti-cheat and server-side validation ensure a fair experience.",
      icon: ShieldCheck,
      color: "text-green-400",
    },
    {
      title: "Win Rewards",
      desc: "Top bidders win physical and digital prizes provided by us.",
      icon: Trophy,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-20 py-12">
      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-b from-white via-purple-300 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl">
          MAZEBIDS
        </h1>
        <p className="text-xl md:text-2xl text-purple-200/80 font-medium max-w-2xl mx-auto">
          The ultimate gamified auction platform. Earn coins for free and win real rewards.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <a
            href="http://localhost:5000/api/auth/discord"
            className="group relative px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(139,92,246,0.6)] flex items-center space-x-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span>Start Earning Now</span>
          </a>
          <Link
            href="/auctions"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-purple-500/50 rounded-2xl font-bold text-lg transition-all"
          >
            View Live Auctions
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all hover:bg-white/[0.07] group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <feature.icon size={80} className={feature.color} />
            </div>
            <feature.icon className={`w-12 h-12 ${feature.color} mb-6`} />
            <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="p-1 rounded-[2.5rem] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 shadow-2xl">
          <div className="bg-[#0c0c14] rounded-[2.2rem] p-12 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
            <h2 className="text-4xl font-bold">Ready to join the maze?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect your Discord account to get started. No credit card required.
            </p>
            <a 
              href="http://localhost:5000/api/auth/discord"
              className="px-10 py-5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl font-bold text-xl transition-all shadow-xl shadow-[#5865F2]/20 flex items-center space-x-3 mx-auto"
            >
              <img src="https://assets-global.website-files.com/6257adef93867e3d84058941/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-8 h-8" alt="Discord" />
              <span>Login with Discord</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
