const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const VOUCH_FILE = path.join(__dirname, '../vouches.json');

module.exports = {
  name: 'checkvouches',
  // 🟢 CHANGED: Rename this method so index.js can target it uniquely!
  async executeMonitor(interaction) { 
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ Access Denied. This monitoring terminal is reserved for Imperial Staff only.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('target');
    const db = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};

    const embed = new EmbedBuilder()
      .setColor('#a04be0')
      .setTimestamp();

    if (targetUser) {
      const vouches = db[targetUser.id] || 0;
      
      embed
        .setTitle(`🔍 Imperial Audit: ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(`Detailed background check on member: ${targetUser}`)
        .addFields(
          { name: '🆔 User Snowflake ID', value: `\`${targetUser.id}\``, inline: false },
          { name: '🏆 Total Logged Vouches', value: `**${vouches}** valid entries`, inline: false }, // 🟢 Changed inline to false for perfect layout stacking!
          { name: '📜 Current Ledger Standing', value: vouches >= 100 ? '🔱 **Official Middleman**' : '🪵 Common Trader', inline: false } // 🟢 Changed inline to false!
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const sorted = Object.entries(db).sort(([, a], [, b]) => b - a).slice(0, 10);
    let auditList = '';

    if (sorted.length === 0) {
      auditList = '*No vouches registered on the network ledger yet.*';
    } else {
      auditList = sorted.map(([id, count], index) => {
        let medal = '🔹';
        if (index === 0) medal = '🥇';
        if (index === 1) medal = '🥈';
        if (index === 2) medal = '🥉';
        return `${medal} **#${index + 1}** <@${id}> — \`${count}\` vouches (ID: \`${id}\`)`;
      }).join('\n');
    }

    embed
      .setTitle('🔱 Imperial Vouch Network High-Score Standings')
      .setDescription(`Top transaction verification leaders configured across database rosters:\n\n${auditList}`);

    return interaction.reply({ embeds: [embed] });
  }
};