"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon, TrendingUp, Eye, MousePointerClick, Coins, Plus, Trash2, Edit } from "lucide-react";
import Modal from "./Modal";

interface Campaign {
  id: string;
  name: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  rewardsGiven: number;
  status: "active" | "paused" | "ended";
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  { id: "1", name: "Summer Sale Promo", budget: 50000, spent: 32500, impressions: 125000, clicks: 8500, rewardsGiven: 42500, status: "active", createdAt: "2024-04-01" },
  { id: "2", name: "New User Bonus", budget: 25000, spent: 15000, impressions: 45000, clicks: 3200, rewardsGiven: 16000, status: "active", createdAt: "2024-04-10" },
  { id: "3", name: "Weekend Special", budget: 10000, spent: 10000, impressions: 30000, clicks: 1800, rewardsGiven: 9000, status: "ended", createdAt: "2024-03-20" },
  { id: "4", name: "Flash Sale", budget: 15000, spent: 5000, impressions: 15000, clicks: 800, rewardsGiven: 4000, status: "paused", createdAt: "2024-04-15" },
];

export default function AdManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit" | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    budget: "",
  });

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: formData.name,
      budget: parseInt(formData.budget),
      spent: 0,
      impressions: 0,
      clicks: 0,
      rewardsGiven: 0,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setCampaigns([newCampaign, ...campaigns]);
    setModalOpen(false);
    setFormData({ name: "", budget: "" });
  };

  const handleToggleStatus = (campaignId: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId 
        ? { ...c, status: c.status === "active" ? "paused" : "active" as "active" | "paused" | "ended" }
        : c
    ));
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campaignId));
  };

  const openModal = (type: "create" | "edit", campaign?: Campaign) => {
    setModalType(type);
    if (campaign) {
      setSelectedCampaign(campaign);
      setFormData({ name: campaign.name, budget: campaign.budget.toString() });
    } else {
      setSelectedCampaign(null);
      setFormData({ name: "", budget: "" });
    }
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Ad Management</h1>
          <p className="text-gray-500 mt-1">Manage advertising campaigns and rewards</p>
        </div>
        <button
          onClick={() => openModal("create")}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <ImageIcon className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Campaigns</p>
          <p className="text-2xl font-black text-white">{campaigns.filter(c => c.status === "active").length}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Impressions</p>
          <p className="text-2xl font-black text-white">{campaigns.reduce((acc, c) => acc + c.impressions, 0).toLocaleString()}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
            <MousePointerClick className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Clicks</p>
          <p className="text-2xl font-black text-white">{campaigns.reduce((acc, c) => acc + c.clicks, 0).toLocaleString()}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Rewards Given</p>
          <p className="text-2xl font-black text-white">{campaigns.reduce((acc, c) => acc + c.rewardsGiven, 0).toLocaleString()}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{campaign.name}</h3>
                <p className="text-xs text-gray-500">Created {new Date(campaign.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Budget</p>
                <p className="font-bold text-white">{campaign.budget.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Spent</p>
                <p className="font-bold text-white">{campaign.spent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Impressions</p>
                <p className="font-bold text-white">{campaign.impressions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Clicks</p>
                <p className="font-bold text-white">{campaign.clicks.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Budget Used</span>
                <span className="text-white font-bold">{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {campaign.status !== "ended" && (
                <button
                  onClick={() => handleToggleStatus(campaign.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    campaign.status === "active"
                      ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"
                      : "bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20"
                  }`}
                >
                  {campaign.status === "active" ? "Pause" : "Resume"}
                </button>
              )}
              <button
                onClick={() => openModal("edit", campaign)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCampaign(campaign.id)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-500 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "create" ? "Create Campaign" : "Edit Campaign"}
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter campaign name..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
              Budget (coins)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="Enter budget..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
            />
          </div>
          <button
            onClick={handleCreateCampaign}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
          >
            {modalType === "create" ? "Create Campaign" : "Save Changes"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
