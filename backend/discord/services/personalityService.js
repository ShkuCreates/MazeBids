const config = require('../config');

function getRandomResponse(type) {
  const responses = config.PERSONALITY[type];
  if (!responses || responses.length === 0) return null;
  return responses[Math.floor(Math.random() * responses.length)];
}

function getWinningResponse() {
  return getRandomResponse('winning');
}

function getLosingResponse() {
  return getRandomResponse('losing');
}

function getDailyResponse() {
  return getRandomResponse('daily');
}

function getStreakResponse() {
  return getRandomResponse('streak');
}

function getOutbidResponse() {
  return getRandomResponse('outbid');
}

function getRecommendResponse() {
  return getRandomResponse('recommend');
}

module.exports = {
  getRandomResponse,
  getWinningResponse,
  getLosingResponse,
  getDailyResponse,
  getStreakResponse,
  getOutbidResponse,
  getRecommendResponse
};
