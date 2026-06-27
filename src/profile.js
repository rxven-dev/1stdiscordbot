const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Safe dynamic relative links to your main root database files
const scamFilePath = path.join(__dirname, '../scam_records.json');
const vouchFilePath = path.join(__dirname, '../vouches.json');

module.exports = {
  // 📜 THIS IS THE CHUNKY DATA BLOCK INDEX.JS WAS MISSING:
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View an Imperial Registry user profile background summary card')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Select a member to view their credentials')
        .setRequired(false)),

  async executeProfile(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    // --- 1. DYNAMIC DATA ACQUISITION METRICS ---
    let verifiedScams = 0;
    if (fs.existsSync(scamFilePath)) {
      try {
        const scamData = JSON.parse(fs.readFileSync(scamFilePath, 'utf8'));
        if (scamData[targetUser.id] && scamData[targetUser.id].convictions !== undefined) {
          verifiedScams = Number(scamData[targetUser.id].convictions) || 0;
        }
      } catch (err) {
        console.error('❌ Error reading scam metrics path:', err.message);
      }
    }

    let totalVouches = 0;
    if (fs.existsSync(vouchFilePath)) {
      try {
        const vouchData = JSON.parse(fs.readFileSync(vouchFilePath, 'utf8'));
        if (vouchData[targetUser.id] && vouchData[targetUser.id].count !== undefined) {
          totalVouches = Number(vouchData[targetUser.id].count) || 0;
        }
      } catch (err) {
        console.error('❌ Error reading vouch metrics path:', err.message);
      }
    }

    // --- 2. SOCIAL SYSTEM LEVEL MATRIX CALCULATOR ---
    let rank = '🪵 Commoner';
    let nextMilestone = '🔷 Vanguard Squire (10)';
    let progressString = '`[ 0 / 10 ]`';

    if (totalVouches >= 10 && totalVouches < 25) {
      rank = '🔷 Vanguard Squire';
      nextMilestone = '⚔️ Knight Imperial (25)';
      progressString = `\`[ ${totalVouches} / 25 ]\``;
    } else if (totalVouches >= 25 && totalVouches < 50) {
      rank = '⚔️ Knight Imperial';
      nextMilestone = '🛡️ High Paladin (50)';
      progressString = `\`[ ${totalVouches} / 50 ]\``;
    } else if (totalVouches >= 50) {
      rank = '🛡️ High Paladin';
      nextMilestone = '👑 Max Level Attained';
      progressString = `\`[ ${totalVouches} / 50+ ]\``;
    } else {
      progressString = `\`[ ${totalVouches} / 10 ]\``;
    }

    const mmStatus = totalVouches >= 100 
      ? '✅ Verified Authorized Imperial Middleman' 
      : '❌ Unauthorized (Requires 100 Vouches)';

    // --- 3. RICH VISUAL GRAPH EMBED COMPILATION ---
    const profileEmbed = new EmbedBuilder()
      .setColor('#1a1a1a')
      .setTitle(`📜 Imperial Registry: ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '✨ Current Rank', value: rank, inline: true },
        { name: '🏆 Total Vouches', value: `\`${totalVouches}\` vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 \`${verifiedScams}\` Verified Scams`, inline: true },
        { name: '🎯 Next Milestone', value: nextMilestone, inline: false },
        { name: '📊 Progress Bar', value: progressString, inline: false },
        { name: '💼 Middleman Status', value: mmStatus, inline: false }
      )
      .setTimestamp();

    // --- 4. SECURE NETWORK PIPELINE ROUTING WRAPPER ---
    try {
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ embeds: [profileEmbed] });
      } else {
        return await interaction.editReply({ embeds: [profileEmbed] });
      }
    } catch (networkError) {
      try {
        return await interaction.followUp({ embeds: [profileEmbed] });
      } catch (fError) {
        console.log('🛡️ Prevented a race condition on interaction profile callback token.');
      }
    }
  },

  // Fallback map so the old .execute() calls inside index.js don't cause breakage
  async execute(interaction) {
    return await this.executeProfile(interaction);
  }
};