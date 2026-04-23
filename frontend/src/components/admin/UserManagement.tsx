"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MoreVertical, Ban, Shield, Coins, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "./Modal";
import EmptyState from "./EmptyState";

interface User {
  id: string;
  username: string;
  discordId: string;
  coins: number;
  status: "active" | "banned";
  joinDate: string;
  totalBids: number;
  auctionsWon: number;
}

const mockUsers: User[] = [
  { id: "1", username: "CryptoKing", discordId: "123456789", coins: 5420, status: "active", joinDate: "2024-01-15", totalBids: 45, auctionsWon: 8 },
  { id: "2", username: "BidMaster", discordId: "987654321", coins: 3210, status: "active", joinDate: "2024-02-20", totalBids: 32, auctionsWon: 5 },
  { id: "3", username: "AuctionPro", discordId: "456789123", coins: 8900, status: "active", joinDate: "2024-01-10", totalBids: 67, auctionsWon: 12 },
  { id: "4", username: "Spammer123", discordId: "789123456", coins: 150, status: "banned", joinDate: "2024-03-05", totalBids: 5, auctionsWon: 0 },
  { id: "5", username: "LuckyWinner", discordId: "321654987", coins: 12000, status: "active", joinDate: "2023-12-01", totalBids: 89, auctionsWon: 15 },
  { id: "6", username: "NewBidder", discordId: "654987321", coins: 500, status: "active", joinDate: "2024-04-10", totalBids: 3, auctionsWon: 0 },
  { id: "7", username: "CoinCollector", discordId: "147258369", coins: 25000, status: "active", joinDate: "2023-11-20", totalBids: 120, auctionsWon: 22 },
  { id: "8", username: "QuickFingers", discordId: "369258147", coins: 1800, status: "active", joinDate: "2024-02-28", totalBids: 28, auctionsWon: 4 },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"view" | "ban" | "coins" | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.discordId.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleBanUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === "active" ? "banned" : "active" } : u));
    setModalOpen(false);
  };

  const handleAddCoins = (userId: string) => {
    const amount = parseInt(coinAmount);
    if (isNaN(amount)) return;
    setUsers(users.map(u => u.id === userId ? { ...u, coins: u.coins + amount } : u));
    setModalOpen(false);
    setCoinAmount("");
  };

  const openModal = (user: User, type: "view" | "ban" | "coins") => {
    setSelectedUser(user);
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">User Management</h1>
          <p className="text-gray-500 mt-1">Manage platform users and accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 w-64 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-sm text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-[#0f0f18] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">User</th>
                <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Coins</th>
                <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined</th>
                <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Bids</th>
                <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Won</th>
                <th className="text-right p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold text-white">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.discordId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-white">{user.coins.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      user.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{new Date(user.joinDate).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-white">{user.totalBids}</td>
                  <td className="p-4 font-bold text-white">{user.auctionsWon}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(user, "view")}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(user, "coins")}
                        className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors text-gray-500 hover:text-yellow-500"
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(user, "ban")}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === "active" 
                            ? "hover:bg-red-500/20 text-gray-500 hover:text-red-500" 
                            : "hover:bg-green-500/20 text-gray-500 hover:text-green-500"
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedUsers.length === 0 && (
          <EmptyState
            icon="users"
            title="No users found"
            description="Try adjusting your search or filters"
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg transition-colors ${
                    currentPage === i + 1 ? "bg-purple-600 text-white" : "hover:bg-white/10 text-gray-500"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "view" ? "User Profile" : modalType === "ban" ? "Manage User Status" : "Add Coins"}
        size="md"
      >
        {selectedUser && modalType === "view" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-black text-white text-2xl">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedUser.username}</h3>
                <p className="text-gray-500">{selectedUser.discordId}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Coins</p>
                <p className="text-xl font-bold text-white">{selectedUser.coins.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                <p className={`font-bold ${selectedUser.status === "active" ? "text-green-400" : "text-red-400"}`}>
                  {selectedUser.status}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Bids</p>
                <p className="text-xl font-bold text-white">{selectedUser.totalBids}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Auctions Won</p>
                <p className="text-xl font-bold text-white">{selectedUser.auctionsWon}</p>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Joined Date</p>
              <p className="text-white">{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {selectedUser && modalType === "ban" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold text-white">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{selectedUser.username}</p>
                <p className="text-sm text-gray-500">Current status: {selectedUser.status}</p>
              </div>
            </div>
            <p className="text-gray-400">
              {selectedUser.status === "active" 
                ? "Are you sure you want to ban this user? They will not be able to participate in auctions."
                : "Are you sure you want to unban this user? They will regain full access to the platform."
              }
            </p>
            <button
              onClick={() => handleBanUser(selectedUser.id)}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                selectedUser.status === "active"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {selectedUser.status === "active" ? "Ban User" : "Unban User"}
            </button>
          </div>
        )}

        {selectedUser && modalType === "coins" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold text-white">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{selectedUser.username}</p>
                <p className="text-sm text-gray-500">Current balance: {selectedUser.coins.toLocaleString()} coins</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Coin Amount (use negative to remove)
              </label>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>
            <button
              onClick={() => handleAddCoins(selectedUser.id)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
            >
              Update Coins
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
