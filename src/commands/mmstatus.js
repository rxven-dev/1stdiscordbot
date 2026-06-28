const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();
const STATUS_FILE = path.join(dataDir, 'mm_duty_status.json');

module.exports = {
  name: 'mmstatus',
  async execute(interaction) {
    // 🏛️ AUTHORIZED REPUTATION & MANAGEMENT ROLES SELECTION MATRIX
    const ALLOWED_ROLES = [
      '1520310648582443089', // Vanguard Lord 「 🔱 」
      '1520310652021899415', // Immortal Legend 「 👑 」
      '1414079432741617724', // Lord Commander 「 🛡️ 」(Moderator)
      '1414079646256857128'  // High Chancellor 「 🏦 」(Admin)
    ];

    const CHANNEL_ID = '1520312877343445114';

    if (interaction.channelId !== CHANNEL_ID) {
      return interaction.reply({ content: `❌ Please use this command in <#${CHANNEL_ID}>.`, ephemeral: true });
    }

    // Check if the user has at least one of the approved middleman/staff roles
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
    
    if (!hasPermission) {
      return interaction.reply({ 
        content: '❌ You must be a verified Middleman or Staff Member (**Vanguard Lord+, Immortal Legend, Lord Commander, or High Chancellor**) to toggle duty status.', 
        ephemeral: true 
      });
    }

    const statusChoice = interaction.options.getString('status');
    let data = fs.existsSync(STATUS_FILE) ? JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')) : { active: [], away: [] };

    // Initialize layout arrays safely if they are blank
    if (!data.active) data.active = [];
    if (!data.away) data.away = [];

    // Filter out historical entries to avoid duplicate name listings across screens
    data.active = data.active.filter(id => id !== interaction.user.id);
    data.away = data.away.filter(id => id !== interaction.user.id);

    data[statusChoice].push(interaction.user.id);
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));

    const statusEmbed = new EmbedBuilder()
      .setTitle('⚔️ Imperial Duty Roster Update')
      .setColor('#a04be0')
      .setDescription('Current live availability matrix for verified middlemen operations:')
      .addFields(
        { name: '🟢 Available', value: data.active.length > 0 ? data.active.map(id => `<@${id}>`).join('\n') : '*None on duty right now*', inline: true },
        { name: '🔴 Unavailable', value: data.away.length > 0 ? data.away.map(id => `<@${id}>`).join('\n') : '*None loaded*', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [statusEmbed] });

    // 🪙 FEATURE 1: FORCE SYNC WITH CHANNEL INTERFACE PINNED EMBED
    try {
      const indexModule = require('./index.js');
      if (indexModule && typeof indexModule.updateLiveRosterPanel === 'function') {
        await indexModule.updateLiveRosterPanel(interaction.client);
      }
    } catch (err) {
      console.error('❌ Dynamic status hook fail:', err.message);
    }
  }
};