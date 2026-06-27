const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const STATUS_FILE = path.join(__dirname, '../mm_duty_status.json');

module.exports = {
  name: 'mmstatus',
  async execute(interaction) {
    const OFFICIAL_MM_ROLE_ID = '1520310648582443089';
    const CHANNEL_ID = '1520312877343445114';

    if (interaction.channelId !== CHANNEL_ID) {
      return interaction.reply({ content: `❌ Please use this command in <#${CHANNEL_ID}>.`, ephemeral: true });
    }

    if (!interaction.member.roles.cache.has(OFFICIAL_MM_ROLE_ID)) {
      return interaction.reply({ content: '❌ You must be an official **Vanguard Lord (100+ Vouches)** to toggle duty status.', ephemeral: true });
    }

    const statusChoice = interaction.options.getString('status');
    let data = fs.existsSync(STATUS_FILE) ? JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')) : { active: [], away: [] };

    data.active = data.active.filter(id => id !== interaction.user.id);
    data.away = data.away.filter(id => id !== interaction.user.id);

    data[statusChoice].push(interaction.user.id);
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));

    const statusEmbed = new EmbedBuilder()
      .setTitle('⚔️ Imperial Duty Roster Update')
      .setColor('#a04be0')
      .setDescription('Current live availability matrix for verified middlemen operations:')
      .addFields(
        { name: '🟢 Active & Ready', value: data.active.length > 0 ? data.active.map(id => `<@${id}>`).join('\n') : '*None on duty right now*', inline: true },
        { name: '🔴 Unavailable', value: data.away.length > 0 ? data.away.map(id => `<@${id}>`).join('\n') : '*None loaded*', inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [statusEmbed] });
  }
};