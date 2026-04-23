import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface RealAuction {
  id: string;
  title: string;
  description: string;
  product: string;
  image: string;
  startTime: string;
  endTime: string;
  currentBid: number;
  minBidIncrement: number;
  highestBidderId: string | null;
  highestBidder: { username: string } | null;
  status: string;
}

export interface EndedAuction {
  id: string;
  title: string;
  image: string;
  currentBid: number;
  endTime: string;
  highestBidder: { username: string; avatar: string } | null;
}

export class AuctionService {
  static async getActiveAuctions(): Promise<RealAuction[]> {
    try {
      const response = await axios.get(`${API_URL}/api/auctions`, {
        withCredentials: true
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch active auctions:', error);
      return [];
    }
  }

  static async getEndedAuctions(): Promise<EndedAuction[]> {
    try {
      const response = await axios.get(`${API_URL}/api/auctions/ended`, {
        withCredentials: true
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch ended auctions:', error);
      return [];
    }
  }

  static async getAuctionById(id: string): Promise<RealAuction | null> {
    try {
      const response = await axios.get(`${API_URL}/api/auctions/${id}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch auction:', error);
      return null;
    }
  }

  static async createBid(auctionId: string, amount: number): Promise<boolean> {
    try {
      await axios.post(`${API_URL}/api/auctions/${auctionId}/bid`, { amount }, {
        withCredentials: true
      });
      return true;
    } catch (error) {
      console.error('Failed to place bid:', error);
      return false;
    }
  }

  static async toggleNotifications(): Promise<boolean> {
    try {
      await axios.post(`${API_URL}/api/users/toggle-notifications`, {}, {
        withCredentials: true
      });
      return true;
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      return false;
    }
  }
}

export default AuctionService;
