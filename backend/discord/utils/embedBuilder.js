const { EmbedBuilder } = require('discord.js');

function buildEmbed({ title, description, color, fields, thumbnail, image, footer, timestamp = true }) {
  const embed = new EmbedBuilder();
  
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (color) embed.setColor(color);
  if (fields && fields.length) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (footer) embed.setFooter({ text: footer });
  if (timestamp) embed.setTimestamp();
  
  return embed;
}

function successEmbed(title, description) {
  return buildEmbed({ title, description, color: '#10b981' });
}

function errorEmbed(title, description) {
  return buildEmbed({ title, description, color: '#ef4444' });
}

function infoEmbed(title, description) {
  return buildEmbed({ title, description, color: '#3b82f6' });
}

function warningEmbed(title, description) {
  return buildEmbed({ title, description, color: '#f59e0b' });
}

module.exports = { buildEmbed, successEmbed, errorEmbed, infoEmbed, warningEmbed };
