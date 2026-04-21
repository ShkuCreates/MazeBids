# MazeBids - Gamified Auction Platform

A production-ready gamified web platform where users earn virtual coins and participate in real-time auctions.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide React, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, Passport.js (Discord OAuth2)
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSockets for live bidding

## 📁 Project Structure

```
mazebids/
├── frontend/         # Next.js App Router, Tailwind UI
├── backend/          # Express API, Socket.io logic
└── prisma/           # Shared database schema
```

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Discord Developer Account (for OAuth)

### 2. Backend Setup
1. Navigate to `backend/`
2. Install dependencies: `npm install`
3. Configure `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mazebids"
   DISCORD_CLIENT_ID="your_id"
   DISCORD_CLIENT_SECRET="your_secret"
   DISCORD_CALLBACK_URL="http://localhost:5000/api/auth/discord/callback"
   SESSION_SECRET="random_secret"
   FRONTEND_URL="http://localhost:3000"
   ```
4. Push database schema: `npx prisma db push`
5. Seed initial data: `npm run seed`
6. Start dev server: `npm run dev`

### 3. Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Configure `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   ```
4. Start dev server: `npm run dev`

## 🛡️ Key Features

- **Discord Auth**: Secure login via Discord.
- **Coin System**: Earn coins through mini-games and tasks.
- **Real-time Auctions**: Live bidding with anti-sniping protection (time extends by 60s if bid in last 30s).
- **Anti-Cheat**: Server-side validation for all coin earnings and bids.
- **Responsive Design**: Dark theme with modern purple accents.

## 🔨 Admin Panel (WIP)
Access `/admin` on the frontend (requires `ADMIN` role in database) to manage auctions and users.
