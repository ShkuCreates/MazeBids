-- Create tables for Mazebids database

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "discordId" TEXT UNIQUE NOT NULL,
  "username" TEXT NOT NULL,
  "avatar" TEXT,
  "coins" INTEGER DEFAULT 0,
  "totalEarned" INTEGER DEFAULT 0,
  "totalSpent" INTEGER DEFAULT 0,
  "role" TEXT DEFAULT 'USER',
  "notifications" BOOLEAN DEFAULT false,
  "referralCode" TEXT UNIQUE,
  "referredById" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "BonusCode" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code" TEXT UNIQUE NOT NULL,
  "reward" INTEGER NOT NULL,
  "maxUses" INTEGER DEFAULT 1,
  "usedCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Redemption" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "bonusCodeId" TEXT NOT NULL,
  "redeemedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "bonusCodeId")
);

CREATE TABLE "Auction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "product" TEXT DEFAULT 'Digital Product',
  "image" TEXT,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP NOT NULL,
  "status" TEXT DEFAULT 'UPCOMING',
  "startingBid" INTEGER DEFAULT 0,
  "currentBid" INTEGER DEFAULT 0,
  "minBidIncrement" INTEGER DEFAULT 100,
  "highestBidderId" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Bid" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "amount" INTEGER NOT NULL,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  "auctionId" TEXT NOT NULL
);

CREATE TABLE "Transaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "amount" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL
);

CREATE TABLE "Task" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "reward" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "cooldown" INTEGER NOT NULL
);

CREATE TABLE "UserTask" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "completedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Ad" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "contentUrl" TEXT NOT NULL,
  "targetUrl" TEXT,
  "placement" TEXT NOT NULL,
  "duration" INTEGER,
  "reward" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_bonusCodeId_fkey" FOREIGN KEY ("bonusCodeId") REFERENCES "BonusCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Auction" ADD CONSTRAINT "Auction_highestBidderId_fkey" FOREIGN KEY ("highestBidderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;