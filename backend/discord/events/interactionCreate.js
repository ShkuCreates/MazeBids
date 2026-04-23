const commands = require('../commands');

async function execute(interaction) {
  if (!interaction.isChatInputCommand()) return;
  
  const command = commands.find(cmd => cmd.data.name === interaction.commandName);
  
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorResponse = {
      content: '❌ There was an error executing this command!',
      ephemeral: true
    };
    
    if (interaction.deferred) {
      await interaction.editReply(errorResponse);
    } else {
      await interaction.reply(errorResponse);
    }
  }
}

module.exports = { name: 'interactionCreate', execute };
