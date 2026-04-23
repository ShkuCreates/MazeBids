const prisma = require('../../lib/prisma');

async function checkCooldown(userId, command, cooldownMs) {
  const cooldown = await prisma.cooldown.findUnique({
    where: { userId_command: { userId, command } }
  });
  
  if (!cooldown) return { canUse: true };
  
  if (cooldown.expiresAt > new Date()) {
    const remaining = Math.ceil((cooldown.expiresAt - new Date()) / 1000);
    return { canUse: false, remaining };
  }
  
  await prisma.cooldown.delete({ where: { id: cooldown.id } });
  return { canUse: true };
}

async function setCooldown(userId, command, cooldownMs) {
  const expiresAt = new Date(Date.now() + cooldownMs);
  
  await prisma.cooldown.upsert({
    where: { userId_command: { userId, command } },
    update: { expiresAt },
    create: { userId, command, expiresAt }
  });
}

async function clearCooldown(userId, command) {
  await prisma.cooldown.deleteMany({ where: { userId, command } });
}

class AntiSpamFilter {
  constructor() {
    this.messageHistory = new Map();
    this.patterns = [
      /(.)\1{4,}/,
      /^(.+)\1{2,}$/m,
      /^[a-zA-Z0-9]{50,}$/
    ];
  }
  
  isSpam(userId, content) {
    const history = this.messageHistory.get(userId) || [];
    const now = Date.now();
    
    const recent = history.filter(t => now - t < 10000);
    
    if (recent.length >= 5) return true;
    
    for (const pattern of this.patterns) {
      if (pattern.test(content)) return true;
    }
    
    if (recent.length > 0) {
      const lastMessage = history[history.length - 1];
      if (content === lastMessage.content && now - lastMessage.time < 3000) {
        return true;
      }
    }
    
    recent.push({ time: now, content });
    this.messageHistory.set(userId, recent);
    
    return false;
  }
  
  cleanup(userId) {
    const history = this.messageHistory.get(userId);
    if (history) {
      const now = Date.now();
      const filtered = history.filter(t => now - t < 60000);
      this.messageHistory.set(userId, filtered);
    }
  }
}

const antiSpam = new AntiSpamFilter();

module.exports = { checkCooldown, setCooldown, clearCooldown, antiSpam };
