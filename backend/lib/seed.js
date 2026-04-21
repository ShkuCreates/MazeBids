const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.userTask.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared database');

  // Create tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Speed Clicker',
        description: 'Click as many times as you can in 30 seconds!',
        reward: 50,
        type: 'GAME',
        cooldown: 5
      },
      {
        title: 'Memory Match',
        description: 'Find all pairs in the shortest time.',
        reward: 75,
        type: 'GAME',
        cooldown: 10
      },
      {
        title: 'Rewarded Video',
        description: 'Watch a short video to support us.',
        reward: 25,
        type: 'AD',
        cooldown: 2
      }
    ]
  });

  console.log('Created tasks');

  // Create a sample auction
  const now = new Date();
  const auction = await prisma.auction.create({
    data: {
      title: 'Discord Nitro (1 Month)',
      description: 'Get Discord Nitro for free with your coins!',
      image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=800',
      startTime: now,
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'ACTIVE',
      startingBid: 1000,
      currentBid: 1000
    }
  });

  console.log('Created sample auction');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
