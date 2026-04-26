const daily = require('./daily');
const streak = require('./streak');
const recommend = require('./recommend');
const economy = require('./economy');
const history = require('./history');
const leaderboard = require('./leaderboard');
const add = require('./add');
const remove = require('./remove');
const bonuscode = require('./bonuscode');
const auth = require('./auth');
const authinfo = require('./authinfo');

module.exports = [
  daily,
  streak,
  recommend,
  economy,
  history,
  leaderboard,
  add,
  remove,
  bonuscode,
  auth,
  authinfo
];
