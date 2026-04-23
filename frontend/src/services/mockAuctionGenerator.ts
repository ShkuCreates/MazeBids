// Frontend-only mock data generator - NO DATABASE INTERACTION
export interface MockAuction {
  id: string;
  username: string;
  bid: number;
  timestamp: Date;
  isNew?: boolean;
}

export interface MockActivity {
  id: string;
  username: string;
  action: string;
  item?: string;
  timestamp: Date;
}

const MOCK_USERNAMES = [
  "Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP",
  "VivekBid", "Ananya_Pro", "KaranWins", "PriyaBids", "AjayAuction"
];

const MOCK_ITEMS = [
  "iPhone 13", "AirPods Pro", "MacBook Air", "PS5", 
  "Nintendo Switch", "iPad Pro", "Apple Watch", "DJI Drone"
];

const MOCK_ACTIONS = ["placed a bid on", "won", "joined auction for"];

export function generateMockAuctionBid(): MockAuction {
  return {
    id: `mock-${Date.now()}-${Math.random()}`,
    username: MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)],
    bid: Math.floor(Math.random() * 5000) + 500,
    timestamp: new Date(),
    isNew: true
  };
}

export function generateMockActivity(): MockActivity {
  const action = MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)];
  return {
    id: `activity-${Date.now()}-${Math.random()}`,
    username: MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)],
    action,
    item: action !== "joined auction for" ? MOCK_ITEMS[Math.floor(Math.random() * MOCK_ITEMS.length)] : undefined,
    timestamp: new Date()
  };
}

export function generateBidCount(): number {
  return Math.floor(Math.random() * 3) + 1;
}

export function generateWatcherCount(): number {
  return Math.floor(Math.random() * 450) + 50;
}

export function getTimeAgo(timestamp: Date): string {
  const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 120) return "1 min ago";
  return `${Math.floor(seconds / 60)} min ago`;
}

// Use local storage to track mock bids (per session only)
export function getMockBidHistory(auctionId: string): MockAuction[] {
  if (typeof window === "undefined") return [];
  const key = `mock-bids-${auctionId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

export function addMockBid(auctionId: string, bid: MockAuction): void {
  if (typeof window === "undefined") return;
  const key = `mock-bids-${auctionId}`;
  const history = getMockBidHistory(auctionId);
  localStorage.setItem(key, JSON.stringify([bid, ...history.slice(0, 9)]));
}

export function clearMockBidHistory(auctionId: string): void {
  if (typeof window === "undefined") return;
  const key = `mock-bids-${auctionId}`;
  localStorage.removeItem(key);
}
