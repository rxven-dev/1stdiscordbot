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
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences // 🟢 REQUIRED INTENT TO GAIN ACCESS TO USER PRESENCE SWAP PACKETS
  ],
  partials: [
    Partials.Message, 
    Partials.Channel, 
    Partials.Reaction
  ]
});

// --- LIVE ROSTER COUPLING ENGINE HOOK ---
async function updateLiveRosterPanel(discordClient) {
  const ROSTER_CHANNEL_ID = '1520312877343445114';
  const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();
  const STATUS_FILE = path.join(dataDir, 'mm_duty_status.json');
  const vouchFilePath = path.join(dataDir, 'vouches.json');
  const trackFilePath = path.join(dataDir, 'vouch_claims_tracks.json');
  
  try {
    const channel = await discordClient.channels.fetch(ROSTER_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    let data = fs.existsSync(STATUS_FILE) ? JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')) : { active: [], away: [] };
    if (!data.active) data.active = [];
    if (!data.away) data.away = [];

    const liveEmbed = new EmbedBuilder()
      .setTitle('🏛️ Imperial Services - Live Duty Roster Matrix')
      .setColor('#a04be0')
      .setDescription('Real-time operational availability metrics for verified middleman systems.')
      .addFields(
        { name: '🟢 Active & Ready', value: data.active.length > 0 ? data.active.map(id => `⚔️ <@${id}>`).join('\n') : '*No Middlemen currently on active duty*', inline: false },
        { name: '🔴 Away / Unavailable', value: data.away.length > 0 ? data.away.map(id => `💤 <@${id}>`).join('\n') : '*No staff listed away*', inline: false }
      )
      .addFields({
        name: '📊 Global Status Telemetry',
        value: `✨ **Active Vanguard Units:** \`${data.active.length}\` online\n🏰 Use \`/mmstatus\` in your status updates room to switch states.`
      })
      .setTimestamp();

    const messages = await channel.messages.fetch({ limit: 10 }).catch(() => []);
    const existingBotMessage = messages.find(msg => msg.author.id === discordClient.user.id);

    if (existingBotMessage) {
      await existingBotMessage.edit({ embeds: [liveEmbed] });
    } else {
      await channel.send({ embeds: [liveEmbed] });
    }
  } catch (err) {
    console.error('❌ Failed to synchronize live network roster telemetry:', err.message);
  }
}

// --- SAFE MODULE CACHING MATRIX ---
const activeModules = [];

const runModule = (pathStr, name) => {
  try {
    const mod = require(pathStr);
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

  // Auto deploy live panel upon initial launch
  await updateLiveRosterPanel(client);

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

// 🔄 AUTOMATIC OFFLINE MONITOR DETECTOR ENGINE HOOK
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence || !newPresence.userId) return;

  if (newPresence.status === 'offline') {
    const STATUS_FILE = path.join(__dirname, '../mm_duty_status.json');
    
    if (fs.existsSync(STATUS_FILE)) {
      try {
        let data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
        let recordChanged = false;

        if (!data.active) data.active = [];
        if (!data.away) data.away = [];

        if (data.active.includes(newPresence.userId)) {
          data.active = data.active.filter(id => id !== newPresence.userId);
          if (!data.away.includes(newPresence.userId)) {
            data.away.push(newPresence.userId);
          }
          recordChanged = true;
        }

        if (recordChanged) {
          fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
          console.log(`[Roster Sync] 🏃‍♂️ Staff member <@${newPresence.userId}> logged off or went invisible. Shifted automatically to away status.`);
          await updateLiveRosterPanel(client);
        }
      } catch (err) {
        console.error('❌ Roster system failed auto sync parsing:', err.message);
      }
    }
  }
});

// --- CENTRAL GATEWAY HUB ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    if (commandName === 'profile') { try { if (profileCommand) await profileCommand.executeProfile(interaction); } catch (e) { console.error(e); } return; }
    if (commandName === 'vouch') { try { if (vouchModule.executeVouch) { await vouchModule.executeVouch(interaction); } else if (typeof vouchModule === 'function') { await vouchModule(interaction); } } catch (e) { console.error(e); } return; }
    if (commandName === 'rep') { try { if (vouchModule.executeRep) await vouchModule.executeRep(interaction); } catch (e) { console.error(e); } return; }
    if (commandName === 'scam') { try { await scamModule.executeScam(interaction); } catch (e) { console.error(e); } return; }
    if (commandName === 'tax') { try { if (taxModule && taxModule.execute) { await taxModule.execute(interaction); } } catch (e) { console.error('❌ Tax Command Error:', e); } return; }
    if (commandName === 'checkvouches') { try { if (monitorModule.execute) { await monitorModule.execute(interaction); } else if (typeof monitorModule === 'function') { await monitorModule(interaction); } } catch (e) { console.error(e); } return; }
    if (commandName === 'mmstatus') { try { if (mmStatusModule.execute) { await mmStatusModule.execute(interaction); } else if (typeof mmStatusModule === 'function') { await mmStatusModule(interaction); } } catch (e) { console.error(e); } return; }
    if (commandName === 'ticketpanel') { try { if (ticketSystemModule.executeCommand) { await ticketSystemModule.executeCommand(interaction); } else if (typeof ticketSystemModule === 'function') { await ticketSystemModule(interaction); } } catch (e) { console.error(e); } return; }
  }

  if (interaction.isButton()) {
    const { customId } = interaction;
    
    // Pass general ticket actions directly to modular structure
    if (customId === 'open_mm_ticket' || customId === 'open_mm_paid' || customId === 'open_mm_donate' || customId === 'close_mm_ticket' || customId === 'claim_mm_ticket' || customId.startsWith('mm_trade_') || customId.startsWith('force_purge_')) {
      try { if (ticketSystemModule.handleButton) await ticketSystemModule.handleButton(interaction); } catch (e) { console.error(e); }
      return;
    }

    // 🎟️ FEATURE 2: AUTOMATED ONE-CLICK VOUCH TRANSACTION INJECTION
    if (customId.startsWith('submit_auto_vouch_')) {
      const middlemanId = customId.split('_')[3];
      const vouchFilePath = path.join(__dirname, '../vouches.json');
      const trackFilePath = path.join(__dirname, '../vouch_claims_tracks.json');

      if (interaction.user.id === middlemanId) {
        return interaction.reply({ content: '❌ You cannot vouch for yourself!', ephemeral: true });
      }

      let tracking = fs.existsSync(trackFilePath) ? JSON.parse(fs.readFileSync(trackFilePath, 'utf8')) : [];
      const trackingSignature = `${interaction.user.id}_${interaction.channel.id}`;

      if (tracking.includes(trackingSignature)) {
        return interaction.reply({ content: '❌ You have already submitted your vouch for this specific ticket operation.', ephemeral: true });
      }

      let db = fs.existsSync(vouchFilePath) ? JSON.parse(fs.readFileSync(vouchFilePath, 'utf8')) : {};
      db[middlemanId] = (db[middlemanId] || 0) + 1;
      fs.writeFileSync(vouchFilePath, JSON.stringify(db, null, 2));

      tracking.push(trackingSignature);
      fs.writeFileSync(trackFilePath, JSON.stringify(tracking, null, 2));

      return interaction.reply({ 
        content: `✅ **Vouch Recorded!** Added 1 vouch point to <@${middlemanId}>'s standing records matrix. (Total: \`${db[middlemanId]}\`)`,
        ephemeral: false 
      });
    }

    if (customId.startsWith('scam_')) { try { await scamModule.handleScamButton(interaction); } catch (e) { console.error(e); } return; }
    if (customId.startsWith('claim_')) { try { if (ticketLegacy && ticketLegacy.handleInteraction) await ticketLegacy.handleInteraction(interaction); } catch (e) { console.error(e); } return; }
    
    if (customId.startsWith('unmute_')) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) { return await interaction.reply({ content: '❌ You do not have permission to unmute users.', ephemeral: true }); }
      const targetUserId = customId.split('_')[1];
      try {
        const targetMember = await interaction.guild.members.fetch(targetUserId);
        await targetMember.timeout(null, `Manually unmuted via log dashboard button by ${interaction.user.tag}`);
        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor('#a04be0').addFields({ name: '🔊 Action Status Updates', value: `✅ User manually unmuted by ${interaction.user}` });
        await interaction.update({ embeds: [updatedEmbed], components: [] });
      } catch (error) { console.error('❌ Failed to execute button unmute operation:', error); }
      return;
    }
  }

  if (interaction.isModalSubmit()) {
    const { customId } = interaction;
    if (customId === 'mm_form_paid' || customId === 'mm_form_donate') { try { if (ticketSystemModule.handleModal) await ticketSystemModule.handleModal(interaction); } catch (e) { console.error(e); } return; }
    if (customId === 'scam_report_modal') { try { await scamModule.handleScamModal(interaction); } catch (e) { console.error(e); } return; }
  }
});

// Export helper loop globally if required by modular architecture files
module.exports = { client, updateLiveRosterPanel };

client.login(process.env.TOKEN);