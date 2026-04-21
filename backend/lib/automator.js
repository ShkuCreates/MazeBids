const prisma = require('./prisma');
const { announceWinner } = require('./discordBot');

const startLifecycleAutomator = () => {
  console.log('Starting Auction Lifecycle Automator...');

  // Run every 30 seconds
  setInterval(async () => {
    const now = new Date();

    try {
      // 1. Start UPCOMING auctions that should be ACTIVE
      const toStart = await prisma.auction.findMany({
        where: {
          status: 'UPCOMING',
          startTime: { lte: now }
        }
      });

      for (const auction of toStart) {
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: 'ACTIVE' }
        });
        console.log(`Auction started: ${auction.title}`);
      }

      // 2. End ACTIVE auctions that should be ENDED
      const toEnd = await prisma.auction.findMany({
        where: {
          status: 'ACTIVE',
          endTime: { lte: now }
        },
        include: {
          highestBidder: true
        }
      });

      for (const auction of toEnd) {
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: 'ENDED' }
        });
        console.log(`Auction ended: ${auction.title}`);

        if (auction.highestBidder) {
          // Update winner stats
          await prisma.user.update({
            where: { id: auction.highestBidderId },
            data: { totalSpent: { increment: auction.currentBid } }
          });

          await announceWinner(auction, auction.highestBidder);
          console.log(`Winner announced for ${auction.title}: ${auction.highestBidder.username}`);
        } else {
          console.log(`Auction ${auction.title} ended with no bids.`);
        }
      }
    } catch (error) {
      console.error('Error in Auction Automator:', error.message);
    }
  }, 30000); // 30 seconds
};

module.exports = { startLifecycleAutomator };
