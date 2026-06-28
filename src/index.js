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
const { Client, GatewayIntentBits, Routes, REST, PermissionFlagsBits, EmbedBuilder, Partials, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
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
const searchCommand = require('./search.js');
const profileCommand = require('./profile.js');
const vouchModule = require('./vouch.js');
const scamModule = require('./scam.js');
const taxModule = require('./tax.js');
const monitorModule = require('./monitor.js');
const mmStatusModule = require('./mmstatus.js');
const ticketSystemModule = require('./ticketsystem.js');
const ticketLegacy = require('./ticket.js');

// --- ABSOLUTE DISCORD GLOBAL SLASH REGISTRY LOADER ---
const rawCommands = [
  new SlashCommandBuilder().setName('vouch').setDescription('Vouch for a trusted user after a transaction')
    .addUserOption(opt => opt.setName('user').setDescription('The user you want to vouch for').setRequired(true))
    .addAttachmentOption(opt => opt.setName('proof').setDescription('Provide screenshot transaction proof').setRequired(true)),
  new SlashCommandBuilder().setName('scam').setDescription('Log a verified scam event entry metric')
    .addUserOption(opt => opt.setName('user').setDescription('The target offender user').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reasoning behind entry').setRequired(true)),
  new SlashCommandBuilder().setName('tax').setDescription('Calculate intermediary transaction service tax fee percentages')
    .addNumberOption(opt => opt.setName('amount').setDescription('The exact deal size metric value').setRequired(true)),
  new SlashCommandBuilder().setName('mmstatus').setDescription('Toggle availability setting parameters for your duty status'),
  new SlashCommandBuilder().setName('ticketsystem').setDescription('Deploy the main Imperial Middleman Service Hub panel channel'),
  profileCommand?.data,
  searchCommand?.data
];

// Clean map filtering out any undefined module components dynamically
const commands = rawCommands.filter(cmd => cmd !== undefined && cmd !== null).map(cmd => cmd.toJSON());

client.once('ready', async () => {
  console.log(`🚀 logged in safely as: ${client.user.tag}`);
  
  // Load Leaderboard Module Engine
  try {
    const leaderboardEngine = require('./leaderboard.js');
    leaderboardEngine(client);
  } catch(err) {
    console.error("Leaderboard engine loading error: ", err);
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Synchronized global slash routing nodes completely.');
  } catch (error) {
    console.error('❌ Failed slash command population:', error);
  }
});

// --- GLOBAL EVENT ROUTER INTERACTION ROUTING MATRIX ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    try {
      if (commandName === 'vouch') await vouchModule.executeVouch(interaction);
      if (commandName === 'scam') await scamModule.executeScam(interaction);
      if (commandName === 'tax') await taxModule.executeTax(interaction);
      if (commandName === 'mmstatus') await mmStatusModule.executeStatus(interaction);
      if (commandName === 'ticketsystem') await ticketSystemModule.executeCommand(interaction);
      if (commandName === 'profile') await profileCommand.executeProfile(interaction);
      if (commandName === 'search') await searchCommand.executeSearch(interaction);
    } catch (err) {
      console.error(`Error processing command /${commandName}:`, err);
    }
    return;
  }

  if (interaction.isButton()) {
    const { customId } = interaction;

    // CENTRAL ROUTE COUPLING: Safely forward all ticket interactions to ticketsystem.js
    if (
      customId === 'open_paid_ticket' || 
      customId === 'open_free_ticket' || 
      customId === 'claim_mm_ticket' || 
      customId === 'close_mm_ticket' || 
      customId.startsWith('complete_mm_') || 
      customId.startsWith('vouch_btn_')
    ) {
      try {
        await ticketSystemModule.handleInteraction(interaction);
      } catch (err) {
        console.error('Error within Ticket System Interaction module forwarding:', err);
      }
      return;
    }

    // Handle separate system administration buttons
    if (customId.startsWith('unmute_')) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) { 
        return await interaction.reply({ content: '❌ You do not have permission to unmute users.', ephemeral: true }); 
      }
      const targetUserId = customId.split('_')[1];
      try {
        const targetMember = await interaction.guild.members.fetch(targetUserId);
        await targetMember.timeout(null, `Manually unmuted via log dashboard button by ${interaction.user.tag}`);
        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor('#a04be0').addFields({ name: '🔊 Action Status Updates', value: `✅ User manually unmuted by ${interaction.user}` });
        await interaction.update({ embeds: [updatedEmbed], components: [] });
      } catch (error) { 
        console.error('❌ Failed to execute button unmute operation:', error); 
      }
      return;
    }
  }

  if (interaction.isModalSubmit()) {
    const { customId } = interaction;
    
    // Pass modal setup window interactions straight into ticketsystem.js
    if (customId === 'modal_paid_ticket' || customId === 'modal_free_ticket' || customId === 'mm_form_paid' || customId === 'mm_form_donate') {
      try {
        await ticketSystemModule.handleInteraction(interaction);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (customId === 'scam_report_modal') { 
      try { 
        await scamModule.handleScamModal(interaction); 
      } catch (e) { 
        console.error(e); 
      } 
      return; 
    }
  }
});

// --- AUTOMATIC COMPREHENSIVE TEXT ANALYSIS SECURITY RADAR ENGINE ---
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const LOG_CHANNEL_ID = '1326444654924206121';
  const inputLower = message.content.toLowerCase();

  // 1. DESTRUCTIVE LINK FILTER (DISCORD INVITATIONS SCANNER)
  if (inputLower.includes('discord.gg/') || inputLower.includes('discord.com/invite/')) {
    if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    try {
      await message.delete();
      await message.member.timeout(600000, 'Posting unauthorized background discord invitations links.');
      
      const alertPrivate = new EmbedBuilder()
        .setTitle('⚠️ Security Infraction Notice')
        .setColor('#e74c3c')
        .setDescription('Your profile account has been muted for **10 minutes** for streaming promotional invitations anchors.');
      await message.author.send({ embeds: [alertPrivate] }).catch(() => null);

      const logChan = await message.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
      if (logChan) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🛡️ Automated Firewall Block')
          .setColor('#e74c3c')
          .addFields(
            { name: '👤 Offender User', value: `${message.author} (${message.author.id})`, inline: true },
            { name: '⚖️ Action Enforced', value: 'Content Purge & 10m Mute', inline: true },
            { name: '📝 Intercepted Value', value: `\`\`\`${message.content}\`\`\`` }
          );
        const unmuteRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`unmute_${message.author.id}`).setLabel('Revoke Mute Punishment').setStyle(ButtonStyle.Danger)
        );
        await logChan.send({ embeds: [logEmbed], components: [unmuteRow] });
      }
    } catch (e) {
      console.error('Firewall engine exception:', e);
    }
    return;
  }

  // 2. SCAM PHISHING DOMAINS & RESTRICTED PHRASE MATRICES
  const prohibitedPhrases = [
    'free nitro', 'nitro gift', 'steam-nitro', 'discorcl', 'dlscord', 
    'gift-nitro', 'promonitro', 'cliscord', 'boost-nitro'
  ];

  const triggerFound = prohibitedPhrases.some(phrase => inputLower.includes(phrase));
  if (triggerFound) {
    if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    try {
      await message.delete();
      await message.member.timeout(3600000, 'Phishing scam link / compromise signature detection.');

      const userNotice = new EmbedBuilder()
        .setTitle('🛑 Critical Security Alert')
        .setColor('#ef4444')
        .setDescription('Your profile has been locked under a **1-hour quarantine** due to malicious link structural patterns matching blacklisted servers.');
      await message.author.send({ embeds: [userNotice] }).catch(() => null);

      const securityLogs = await message.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
      if (securityLogs) {
        const defenseEmbed = new EmbedBuilder()
          .setTitle('🚨 Malicious Phishing Signature Isolated')
          .setColor('#ef4444')
          .addFields(
            { name: '👤 Suspect Account', value: `${message.author} (${message.author.id})`, inline: true },
            { name: '🛡️ Quarantine Timeline', value: '1 Hour System Suspension', inline: true },
            { name: '☣️ Raw Output Log', value: `\`\`\`${message.content}\`\`\`` }
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

// --- AUTOMATED MODULE RUNNER ENGINE LINK ---
function runModules() {
  try {
    if (monitorModule && typeof monitorModule.init === 'function') {
      monitorModule.init(client);
      console.log('📡 System Monitor module tasks initialized successfully.');
    }
  } catch (err) {
    console.error('❌ Failed initializing runModules tracking loop:', err);
  }
}

// Fire automated internal background task sequences upon active client sync
client.on('ready', () => {
  runModules();
});

// --- AUTOMATED ENGINE BOOT INITIALIZER ---
if (!process.env.TOKEN) {
  console.error("❌ CRITICAL ERROR: TOKEN is missing from your configuration parameters!");
} else {
  client.login(process.env.TOKEN).catch(err => {
    console.error("❌ Failed logging client configuration session node entry:", err);
  });
}

module.exports = { client };