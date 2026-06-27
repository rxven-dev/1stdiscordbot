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
const { Client, GatewayIntentBits, Routes, REST, PermissionFlagsBits, EmbedBuilder, Partials, SlashCommandBuilder } = require('discord.js');

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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message, 
    Partials.Channel, 
    Partials.Reaction
  ]
});

// --- SAFE MODULE CACHING MATRIX ---
const activeModules = [];

const runModule = (path, name) => {
  try {
    const mod = require(path);
    if (typeof mod === 'function') {
      activeModules.push({ execute: mod, name: name });
    } else {
      console.warn(`⚠️ Warning: ${name} does not export a direct functional initializer loop.`);
    }
  } catch (err) {
    console.error(`❌ Failed to load module ${name}:`, err.message);
  }
};

// ⚡ BACKGROUND LISTENERS ONLY
runModule('./anti.js', 'Anti-System');
runModule('./welcome.js', 'Welcome-System');
runModule('./manifest.js', 'Manifest-System');
runModule('./spam.js', 'Anti-Spam');
runModule('./important.js', 'Shop-Announcement');
runModule('./rules.js', 'Server-Rules');
runModule('./cleaner.js', 'Cleaner-System');
runModule('./leaderboard.js', 'Leaderboard-System');
runModule('./react.js', 'Reaction-System');
runModule('./reaction-ping.js', 'Reaction-Ping-System');
runModule('./seed.js', 'Seed-Notification-System');
runModule('./reaction-roles.js', 'Unified-Reaction-Roles');

// --- CLIENT READY HANDLER ---
client.once('ready', async () => {
  console.log(`✅ Logged in successfully as ${client.user.tag}`);
  
  console.log('⚡ Initializing background text/reaction structures...');
  activeModules.forEach(mod => {
    try {
      mod.execute(client);
    } catch (err) {
      console.error(`❌ Failed to execute module ${mod.name}:`, err.message);
    }
  });

  try {
    if (typeof ticketLegacy === 'function') {
      ticketLegacy(client);
    }
  } catch (err) {
    console.error('❌ Legacy Ticket boot setup failed:', err.message);
  }

  try {
    console.log('🔄 Syncing fresh slash commands payload list with Discord...');
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    const commandsData = [
      searchCommand && searchCommand.data ? searchCommand.data.toJSON() : null,
      profileCommand && profileCommand.data ? profileCommand.data.toJSON() : null,
      {
        name: 'checkvouches',
        description: 'Imperial Staff monitor terminal to audit vouch records',
        options: [{ name: 'target', type: 6, description: 'User to run a background profile check on', required: false }]
      },
      { 
        name: 'vouch', 
        description: 'Formalize a trade reputation', 
        options: [
          { name: 'user', type: 6, description: 'The user you are vouching for', required: true },
          { name: 'proof', type: 11, description: 'Upload a screenshot showing transaction completion proof', required: true }
        ] 
      },
      {
        name: 'scam',
        description: 'Report a fraudulent transaction or user directly to staff logs',
        options: [
          { name: 'user', type: 6, description: 'The user you are reporting', required: true },
          { name: 'reason', type: 3, description: 'Briefly explain what happened', required: true },
          { name: 'proof', type: 11, description: 'Upload transaction/chat screens showing the scam', required: true }
        ]
      },
      { 
        name: 'rep', 
        description: 'Check reputation count', 
        options: [{ name: 'user', type: 6, description: 'User to check', required: false }] 
      },
      new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Spawns the Imperial Middleman Ticket request interface')
        .toJSON(),
      new SlashCommandBuilder()
        .setName('mmstatus')
        .setDescription('Change your active duty availability status')
        .addStringOption(option =>
          option.setName('status')
            .setDescription('Choose your live availability status')
            .setRequired(true)
            .addChoices(
              { name: '🟢 Active Duty (Available Now)', value: 'active' },
              { name: '🔴 Away / Offline', value: 'away' }
            ))
        .toJSON(),
        
      // 🎯 Dynamic routing cleanly pulls currency option selections from tax.js data schema
      taxModule && taxModule.data ? taxModule.data.toJSON() : null
    ].filter(cmd => cmd !== null);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsData }
    );
    console.log('🚀 Successfully updated commands global registry layout.');

  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

// --- CENTRAL GATEWAY HUB ---
client.on('interactionCreate', async (interaction) => {
  
  // 📥 ROUTE 1: CHAT SLASH COMMAND TRAFFIC (HARD PRIORITIZED)
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'profile') {
      try {
        if (profileCommand) await profileCommand.execute(interaction);
      } catch (e) {
        console.error('❌ Profile Command Error:', e);
      }
      return; // 🎯 CUTOFF IMMEDIATELY
    }

    if (commandName === 'vouch') {
      try {
        if (vouchModule.executeVouch) { await vouchModule.executeVouch(interaction); } 
        else if (typeof vouchModule === 'function') { await vouchModule(interaction); }
      } catch (e) { console.error('❌ Vouch Command Error:', e); }
      return;
    }

    if (commandName === 'rep') {
      try { if (vouchModule.executeRep) await vouchModule.executeRep(interaction); } 
      catch (e) { console.error('❌ Rep Command Error:', e); }
      return;
    }

    if (commandName === 'scam') {
      try { await scamModule.executeScam(interaction); } 
      catch (e) { console.error('❌ Scam Command Error:', e); }
      return;
    }

    if (commandName === 'tax') {
      try {
        if (taxModule.execute) { await taxModule.execute(interaction); } 
        else if (typeof taxModule === 'function') { await taxModule(interaction); }
      } catch (e) { console.error('❌ Tax Command Error:', e); }
      return;
    }

    if (commandName === 'checkvouches') {
      try {
        if (monitorModule.execute) { await monitorModule.execute(interaction); } 
        else if (typeof monitorModule === 'function') { await monitorModule(interaction); }
      } catch (e) { console.error('❌ Checkvouches Command Error:', e); }
      return;
    }

    if (commandName === 'mmstatus') {
      try {
        if (mmStatusModule.execute) { await mmStatusModule.execute(interaction); } 
        else if (typeof mmStatusModule === 'function') { await mmStatusModule(interaction); }
      } catch (e) { console.error('❌ Mmstatus Command Error:', e); }
      return;
    }

    if (commandName === 'ticketpanel') {
      try {
        if (ticketSystemModule.executeCommand) { await ticketSystemModule.executeCommand(interaction); } 
        else if (typeof ticketSystemModule === 'function') { await ticketSystemModule(interaction); }
      } catch (e) { console.error('❌ Ticketpanel Command Error:', e); }
      return;
    }
  }

  // 🔘 ROUTE 2: BUTTON CLICKS MATRIX
  if (interaction.isButton()) {
    const { customId } = interaction;

    if (customId === 'open_mm_ticket' || customId === 'close_mm_ticket') {
      try { if (ticketSystemModule.handleButton) await ticketSystemModule.handleButton(interaction); } catch (e) { console.error(e); }
      return;
    }

    if (customId.startsWith('scam_')) {
      try { await scamModule.handleScamButton(interaction); } catch (e) { console.error(e); }
      return;
    }

    if (customId.startsWith('claim_')) {
      try { if (ticketLegacy && ticketLegacy.handleInteraction) await ticketLegacy.handleInteraction(interaction); } catch (e) { console.error(e); }
      return;
    }

    if (customId.startsWith('unmute_')) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.reply({ content: '❌ You do not have permission to unmute users.', ephemeral: true });
      }

      const targetUserId = customId.split('_')[1];
      try {
        const targetMember = await interaction.guild.members.fetch(targetUserId);
        await targetMember.timeout(null, `Manually unmuted via log dashboard button by ${interaction.user.tag}`);

        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor('#a04be0')
          .addFields({ name: '🔊 Action Status Updates', value: `✅ User manually unmuted by ${interaction.user}` });

        await interaction.update({ embeds: [updatedEmbed], components: [] });
      } catch (error) {
        console.error('❌ Failed to execute button unmute operation:', error);
      }
      return;
    }
  }

  // 📝 ROUTE 3: HANDLE MODAL SUBMISSIONS
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'scam_report_modal') {
      try { await scamModule.handleScamModal(interaction); } catch (e) { console.error(e); }
      return;
    }
  }
});

client.login(process.env.TOKEN);