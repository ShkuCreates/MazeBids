const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetCoinSystem() {
  console.log('Starting coin system reset...');

  try {
    // Reset all user coins to 0
    const usersResult = await prisma.user.updateMany({
      data: {
        coins: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    });
    console.log(`Reset ${usersResult.count} users to 0 coins`);

    // Delete all transactions
    const transactionsResult = await prisma.transaction.deleteMany({});
    console.log(`Deleted ${transactionsResult.count} transactions`);

    // Reset auction bids (set currentBid back to startingBid, clear highestBidder)
    const auctions = await prisma.auction.findMany();
    for (const auction of auctions) {
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          currentBid: auction.startingBid,
          highestBidderId: null,
        },
      });
    }
    console.log(`Reset ${auctions.length} auctions`);

    // Delete all bids
    const bidsResult = await prisma.bid.deleteMany({});
    console.log(`Deleted ${bidsResult.count} bids`);

    console.log('Coin system reset completed successfully!');
  } catch (error) {
    console.error('Error during reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetCoinSystem();
