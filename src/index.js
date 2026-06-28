// 1. LOAD ENVIRONMENT VARIABLES FIRST
require('dotenv').config();

// 2. INITIALIZE RENDER PORT KEEPER 
const http = require('http');
const RENDER_PORT = process.env.PORT || 10000; 

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("Bot is running 24/7!");
  res.end();
}).listen(RENDER_PORT, '0.0.0.0', () => {
  console.log(`🌐 Web server successfully listening on port ${RENDER_PORT}`);
});

// 3. YOUR DISCORD BOT ENGINE CODE
const { Client, GatewayIntentBits, Routes, REST, PermissionFlagsBits, EmbedBuilder, Partials, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// --- CENTRAL HOOK MODULAR OBJECT IMPORTS ---
const searchCommand      = require('./commands/search.js');
const profileCommand     = require('./commands/profile.js');
const vouchCommand       = require('./commands/vouch.js');
const unvouchCommand     = require('./commands/unvouch.js');
const scamCommand        = require('./commands/scam.js');
const unscamCommand      = require('./commands/unscam.js');
const dutyCommand        = require('./commands/duty.js');
const ticketsystemCommand = require('./commands/ticketsystem.js'); // 🟢 Fixed lowercase matching configuration

// --- AUTOMATED DISCORD SLASH REGISTRATION SCHEDULER ---
const commands = [
  searchCommand.data.toJSON(),
  profileCommand.data.toJSON(),
  vouchCommand.data.toJSON(),
  unvouchCommand.data.toJSON(),
  scamCommand.data.toJSON(),
  unscamCommand.data.toJSON(),
  dutyCommand.data.toJSON(),
  new SlashCommandBuilder().setName('ticketsystem').setDescription('Deploy the Imperial Middleman Session creation matrix hub panel')
].map(cmd => cmd);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Syncing core applications command tree...');
    await rest.put(
      Routes.applicationCommands('1341272099301298248'),
      { body: commands }
    );
    console.log('✅ Imperial application layers successfully remapped globally.');
  } catch (error) {
    console.error('❌ Tree map syncing failed:', error);
  }
})();

// --- GLOBAL EVENT ROUTER HANDLING INTERFACES ---
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      if (commandName === 'search') return await searchCommand.executeSearch(interaction);
      if (commandName === 'profile') return await profileCommand.executeProfile(interaction);
      if (commandName === 'vouch') return await vouchCommand.executeVouch(interaction);
      if (commandName === 'unvouch') return await unvouchCommand.executeUnvouch(interaction);
      if (commandName === 'scam') return await scamCommand.executeScam(interaction);
      if (commandName === 'unscam') return await unscamCommand.executeUnscam(interaction);
      if (commandName === 'duty') return await dutyCommand.executeDuty(interaction);
      if (commandName === 'ticketsystem') return await ticketsystemCommand.executeCommand(interaction);
    }

    // Handle Buttons, Modals, and Interactive Components
    if (interaction.isButton() || interaction.isModalSubmit()) {
      const customId = interaction.customId;
      
      if (
        customId === 'open_paid_ticket' || 
        customId === 'open_free_ticket' || 
        customId === 'claim_mm_ticket' || 
        customId === 'close_mm_ticket' || 
        customId.startsWith('complete_mm_') || 
        customId.startsWith('vouch_btn_') ||
        customId === 'modal_paid_ticket' ||
        customId === 'modal_free_ticket'
      ) {
        // 🟢 FIXED: Variable updated here to match the exact import string setup on line 41
        return await ticketsystemCommand.handleInteraction(interaction);
      }
    }
  } catch (err) {
    console.error('❌ Error processing structural connection interaction node:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Structural runtime execution failure detected inside the application engine core.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

// --- CORE SECURITY SYSTEM LAYER ---
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const matchInvite = message.content.match(/(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9\-]+/i);
  if (matchInvite) {
    if (message.member && message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    try {
      await message.delete();
      const alert = await message.channel.send(`⚠️ Security Alert: External invitation structures cannot be established inside general parameters, ${message.author}.`);
      setTimeout(() => alert.delete().catch(() => {}), 5000);

      const logChannelId = '1520312781486821427';
      const securityLogs = await message.guild.channels.fetch(logChannelId).catch(() => null);
      if (securityLogs) {
        const defenseEmbed = new EmbedBuilder()
          .setTitle('🛡️ Automated Perimeter Defense Intercept')
          .setColor('#ff0000')
          .setThumbnail(message.author.displayAvatarURL())
          .addFields(
            { name: '👤 Malicious Actor', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
            { name: '📍 Source Sector', value: `${message.channel}`, inline: true },
            { name: '📝 Content Extract', value: `\`\`\`${message.content}\`\`\`` }
          );
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`unmute_${message.author.id}`).setLabel('Pardon Account Security Lockout').setStyle(ButtonStyle.Success)
        );
        await securityLogs.send({ embeds: [defenseEmbed], components: [actionRow] });
      }
    } catch (err) {
      console.error('Malicious structural interceptor fault:', err);
    }
    return;
  }
});

client.on('ready', () => {
  console.log(`🤖 Logged in securely as ${client.user.tag}! Matrix operational.`);
});

// --- AUTOMATED ENGINE BOOT INITIALIZER ---
if (!process.env.TOKEN) {
  console.error("❌ CRITICAL ERROR: process.env.TOKEN is empty inside structural configurations.");
  process.exit(1);
}

client.login(process.env.TOKEN);