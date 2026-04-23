"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Ban, Shield, Coins, Eye, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Modal from "./Modal";
import EmptyState from "./EmptyState";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  id: string;
  username: string;
  discordId: string;
  coins: number;
  totalEarned: number;
  totalSpent: number;
  status: "active" | "banned";
  role: string;
  notifications: boolean;
  joinDate: string;
  lastActive: string;
  totalBids: number;
  auctionsWon: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"view" | "ban" | "coins" | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery
        },
        withCredentials: true
      });
      
      setUsers(res.data.users);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error("[Admin] Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/ban`, {
        banned: !currentlyBanned,
        reason: currentlyBanned ? "Unbanned by admin" : "Banned by admin"
      }, {
        withCredentials: true
      });
      
      await fetchUsers();
      setModalOpen(false);
    } catch (err) {
      console.error("[Admin] Failed to ban/unban user:", err);
      alert("Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCoins = async (userId: string) => {
    const amount = parseInt(coinAmount);
    if (isNaN(amount) || amount === 0) {
      alert("Please enter a valid amount");
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/coins`, {
        amount,
        reason: amount > 0 ? "Admin coin addition" : "Admin coin removal"
      }, {
        withCredentials: true
      });
      
      await fetchUsers();
      setModalOpen(false);
      setCoinAmount("");
    } catch (err) {
      console.error("[Admin] Failed to update coins:", err);
      alert("Failed to update coins");
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (user: User, type: "view" | "ban" | "coins") => {
    setSelectedUser(user);
    setModalType(type);
    setModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">User Management</h1>
          <p className="text-gray-500 mt-1">Manage platform users and accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 w-64 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-sm text-white"
            />
          </form>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.map((user, index) => (
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

        {users.length === 0 && !loading && (
          <EmptyState
            icon="users"
            title="No users found"
            description="Try adjusting your search or filters"
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
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
              onClick={() => handleBanUser(selectedUser.id, selectedUser.status === 'banned')}
              disabled={actionLoading}
              className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                selectedUser.status === "active"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : selectedUser.status === "active" ? (
                "Ban User"
              ) : (
                "Unban User"
              )}
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
              disabled={actionLoading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Update Coins"
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
