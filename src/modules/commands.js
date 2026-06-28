const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to store the configured channel ID so it persists if the bot restarts
const configPath = path.join(__dirname, 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-honeypot')
    .setDescription('Sets the honeypot/trap channel for anti-spam.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Admin only
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to turn into a trap')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    // Save the channel ID to a local JSON file
    const config = { honeypotChannelId: channel.id };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    await interaction.reply({
      content: `✅ **Honeypot active!** Any user who sends a message in ${channel} will now be automatically softbanned.`,
      ephemeral: true // Only the admin who ran the command can see this reply
    });
  }
};