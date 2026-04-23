const ready = require('./ready');
const interactionCreate = require('./interactionCreate');
const messageCreate = require('./messageCreate');
const guildCreate = require('./guildCreate');
const guildMemberAdd = require('./guildMemberAdd');

module.exports = [
  ready,
  interactionCreate,
  messageCreate,
  guildCreate,
  guildMemberAdd
];
