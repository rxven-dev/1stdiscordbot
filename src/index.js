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
const taxModule          = require('./commands/tax.js');
const mmStatusModule     = require('./commands/mmstatus.js');
const ticketsystemCommand = require('./commands/ticketsystem.js'); // ✅ Fixed lowercase case-sensitivity reference

const vouchModule        = require('./modules/Vouch.js');
const scamModule         = require('./modules/Scam.js');
const monitorModule      = require('./modules/Monitor.js');

// Initialize cleaner/moderation system hooks
const cleanerSystem      = require('./modules/cleaner.js');
cleanerSystem(client);

// --- ABSOLUTE DISCORD GLOBAL SLASH REGISTRY LOADER ---
const rawCommands = [
  new SlashCommandBuilder().setName('vouch').setDescription('Vouch for a trusted user after a transaction')
    .addUserOption(opt => opt.setName('user').setDescription('The user you want to vouch for').setRequired(true))
    .addAttachmentOption(opt => opt.setName('proof').setDescription('Provide screenshot transaction proof').setRequired(true)),
  new SlashCommandBuilder().setName('scam').setDescription('Log a verified scam event entry metric')
    .addUserOption(opt => opt.setName('user').setDescription('The target offender user').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reasoning behind entry').setRequired(true)),
  
  // Dynamic application command configurations loaded directly from module setups
  taxModule?.data,
    
  // --- MMSTATUS WITH CHOICE DROPDOWNS INTEGRATED HERE ---
  new SlashCommandBuilder().setName('mmstatus').setDescription('Toggle availability setting parameters for your duty status')
    .addStringOption(opt => opt.setName('status').setDescription('Select your live availability status').setRequired(true)
      .addChoices(
        { name: '🟢 Available / Active', value: 'active' },
        { name: '🔴 Unavailable / Away', value: 'away' }
      )),
  new SlashCommandBuilder().setName('ticketpanel').setDescription('Deploy the main Imperial Middleman Service Hub panel channel'),
  
  // Registers /checkvouches directly onto your live global server list
  new SlashCommandBuilder().setName('checkvouches').setDescription('Imperial Staff audit terminal to check reputation profiles')
    .addUserOption(opt => opt.setName('target').setDescription('The target member to audit background ledger items').setRequired(false)),

  profileCommand?.data,
  searchCommand?.data
];

// --- BACKEND REST SLASH REGISTRATION COMPILER FLOW ---
async function synchronizeSlashCommands() {
  try {
    console.log('🔄 Initiating global application slash routing nodes deployment...');
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    // Compiles valid clean JSON properties only
    const cleanJSONData = rawCommands.map(cmd => {
      if (cmd && typeof cmd.toJSON === 'function') return cmd.toJSON();
      return cmd; 
    });

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: cleanJSONData }
    );
    console.log('✅ Synchronized global slash routing nodes completely.');
  } catch (err) {
    console.error('❌ Critical deployment registry failure:', err);
  }
}

client.once('ready', async () => {
  console.log(`✅ Connection secure. Signed in globally as: ${client.user.tag}`);
  await synchronizeSlashCommands();
});

// --- CENTRALIZED ENGINE INTERACTION INTERCEPTOR ---
client.on('interactionCreate', async (interaction) => {
  try {
    // 1. ROUTE SLASH COMMAND INTERACTIONS
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'tax') await taxModule.executeTax(interaction);
      if (commandName === 'mmstatus') await mmStatusModule.execute(interaction);
      if (commandName === 'checkvouches') await monitorModule.executeMonitor(interaction);
      if (commandName === 'ticketpanel') await ticketsystemCommand.executeCommand(interaction);
      if (commandName === 'profile') await profileCommand.executeProfile(interaction);
      if (commandName === 'search') await searchCommand.executeSearch(interaction);
      return;
    }

    // 2. ROUTE BUTTON & MODAL COMPONENT INTERACTIONS (Fixes your ticket system!)
    if (interaction.isButton() || interaction.isModalSubmit()) {
      if (ticketsystemCommand && typeof ticketsystemCommand.handleInteraction === 'function') {
        // ✅ Fixed Variable Hook Execution Target Match:
        await ticketsystemCommand.handleInteraction(interaction);
      }
      return;
    }

  } catch (error) {
    console.error('❌ Error processing structural connection interaction node:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      // ✅ Upgraded deprecated property setup to modern flags standard
      await interaction.reply({ content: '❌ An internal framework routing failure occurred processing this operation.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

// --- IMPERIAL RADAR AUTOMATED DEFENSE CHAT INTERCEPTOR ---
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Basic security filtering rules
  const forbiddenLinks = ['discord.gg/', 'discord.com/invite/'];
  const hasInviteLink = forbiddenLinks.some(link => message.content.toLowerCase().includes(link));

  if (hasInviteLink && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    try {
      await message.delete();
      const warningMessage = await message.channel.send(`⚠️ ${message.author}, advertisement links are blocked by order of the Imperial Security Network.`);
      setTimeout(() => warningMessage.delete().catch(() => {}), 6000);

      const securityLogs = await client.channels.fetch('1520312658828202026').catch(() => null);
      if (securityLogs) {
        const defenseEmbed = new EmbedBuilder()
          .setTitle('🛡️ Anti-Ad Radar Tripped')
          .setColor('#ff3333')
          .setDescription(`**Offender:** ${message.author} (\`${message.author.id}\`)\n**Location:** ${message.channel}\n\n**Interception Payload:**\n\`\`\`${message.content}\`\`\``)
          .setTimestamp();

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

client.on('ready', () => {
  runModules();
});

// --- DIAGNOSTIC TEST MODE ---
console.log("🔍 DIAGNOSTIC: process.env.TOKEN exists?", !!process.env.TOKEN);
if (process.env.TOKEN) {
  console.log("🔍 DIAGNOSTIC: Token starts with:", process.env.TOKEN.substring(0, 5));
  console.log("🔍 DIAGNOSTIC: Token length is:", process.env.TOKEN.length);
}

// --- AUTOMATED ENGINE BOOT INITIALIZER ---
if (!process.env.TOKEN) {
  console.error("❌ CRITICAL ERROR: process.env.TOKEN is completely missing from configuration files.");
} else {
  client.login(process.env.TOKEN).catch(err => {
    console.error("❌ Failed logging bot gateway node into Discord APIs:", err);
  });
}