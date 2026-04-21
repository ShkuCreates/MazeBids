const prisma = require('./prisma');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinAuction', (auctionId) => {
      socket.join(`auction:${auctionId}`);
      console.log(`User joined auction: ${auctionId}`);
    });

    socket.on('leaveAuction', (auctionId) => {
      socket.leave(`auction:${auctionId}`);
      console.log(`User left auction: ${auctionId}`);
    });

    socket.on('placeBid', async ({ auctionId, userId, amount }) => {
      try {
        const auction = await prisma.auction.findUnique({
          where: { id: auctionId }
        });

        if (!auction || auction.status !== 'ACTIVE') {
          return socket.emit('error', { message: 'Auction is not active' });
        }

        // Validate bid amount based on increment
        const minRequired = auction.currentBid + auction.minBidIncrement;
        if (amount < minRequired) {
          return socket.emit('error', { message: `Minimum bid is ${minRequired} coins` });
        }

        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user || user.coins < amount) {
          return socket.emit('error', { message: 'Insufficient coins' });
        }

        // Use transaction to update bid and user coins
        const updatedAuction = await prisma.$transaction(async (tx) => {
          // Refund previous bidder if any
          if (auction.highestBidderId) {
            await tx.user.update({
              where: { id: auction.highestBidderId },
              data: { coins: { increment: auction.currentBid } }
            });
            
            await tx.transaction.create({
              data: {
                userId: auction.highestBidderId,
                amount: auction.currentBid,
                type: 'EARN',
                description: `Refund for outbid on auction ${auction.title}`
              }
            });
          }

          // Deduct from new bidder
          await tx.user.update({
            where: { id: userId },
            data: { coins: { decrement: amount } }
          });

          await tx.transaction.create({
            data: {
              userId: userId,
              amount: amount,
              type: 'SPEND',
              description: `Bid on auction ${auction.title}`
            }
          });

          // Create bid record
          await tx.bid.create({
            data: {
              amount,
              userId,
              auctionId
            }
          });

          // Update auction
          // Anti-sniping: extend by 1 minute if bid is in last 30 seconds
          const now = new Date();
          let newEndTime = auction.endTime;
          if (auction.endTime - now < 30000) {
            newEndTime = new Date(auction.endTime.getTime() + 60000);
          }

          return tx.auction.update({
            where: { id: auctionId },
            data: {
              currentBid: amount,
              highestBidderId: userId,
              endTime: newEndTime
            },
            include: { 
              highestBidder: {
                select: { id: true, username: true, avatar: true }
              },
              bids: {
                include: { user: { select: { username: true, avatar: true } } },
                orderBy: { timestamp: 'desc' },
                take: 10
              }
            }
          });
        });

        io.emit('bidUpdated', updatedAuction);
      } catch (err) {
        console.error('Bid error:', err);
        socket.emit('error', { message: 'Failed to place bid' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};
