const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const VOUCH_FILE = path.join(__dirname, '../../vouches.json'); // 🟢 CORRECT: Steps back out to root directory!

module.exports = {
  name: 'checkvouches',
  async executeMonitor(interaction) {
    // 1. Imperial Security Check
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ Access Denied. This monitoring terminal is reserved for Imperial Staff only.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('target');
    const db = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};
    const embed = new EmbedBuilder().setColor('#a04be0').setTimestamp();

    // ─── AUDIT SUB-ROUTE: SPECIFIC MEMBER BACKGROUND CHECK ───
    if (targetUser) {
      const totalVouches = db[targetUser.id] || 0; // 🟢 Cleanly extracts the numeric value matching the ID
      
      // Fetch GuildMember structure so we have native access to their role collections
      let targetMember = null;
      try {
        targetMember = await interaction.guild.members.fetch(targetUser.id);
      } catch (e) {
        // Fallback if user left the server but remains indexed in vouches database
      }

      // Extract lowercased role names array cleanly
      const userRoleNames = targetMember 
        ? targetMember.roles.cache.map(role => role.name.toLowerCase()) 
        : [];

      // Establish initial system fallback baselines
      let rank = '🪵 Common Trader';
      let nextMilestone = 'Sworn Citizen (0 Vouches)';
      let requiredForNext = 0;
      let baseForCurrent = 0;

      // 🛑 STAFF OVERRIDES & SPECIAL SIGILS
      if (targetUser.bot) {
        rank = '🤖 Automated Network Service Engine';
        nextMilestone = '✨ System bots transcend the leaderboard progression structure.';
        requiredForNext = totalVouches;
      } else if (targetUser.id === interaction.guild.ownerId) {
        rank = '👑 High Sovereign Overlord (Server Owner)';
        nextMilestone = '✨ Absolute Monarch status accomplished!';
        requiredForNext = totalVouches;
      } else if (targetMember?.permissions.has(PermissionFlagsBits.Administrator)) {
        rank = '🛠️ High Command Staff (Administrator)';
        nextMilestone = '✨ Server Administrative clearance assigned.';
        requiredForNext = totalVouches;
      } else if (targetMember?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        rank = '⚔️ Imperial Peacekeeper (Moderator)';
        nextMilestone = '✨ Active Moderator security profile.';
        requiredForNext = totalVouches;
      } else {
        // 📈 DYNAMIC MILESTONE PROGRESSION TRACKER (Your Custom Hierarchy Matrix!)
        if (userRoleNames.some(name => name.includes('immortal legend'))) {
          rank = 'Immortal Legend 「 👑 」'; nextMilestone = '✨ Ultimate Mythic Monarch status accomplished!'; requiredForNext = totalVouches; baseForCurrent = 150;
        } else if (userRoleNames.some(name => name.includes('vanguard lord'))) {
          rank = 'Vanguard Lord 「 🔱 」'; nextMilestone = 'Immortal Legend (150 Vouches)'; requiredForNext = 150; baseForCurrent = 100;
        } else if (userRoleNames.some(name => name.includes('grand paladin'))) {
          rank = 'Grand Paladin「 ⚔️ 」'; nextMilestone = 'Vanguard Lord (100 Vouches)'; requiredForNext = 100; baseForCurrent = 75;
        } else if (userRoleNames.some(name => name.includes('sovereign guard'))) {
          rank = 'Sovereign Guard 「 🛡️ 」'; nextMilestone = 'Grand Paladin (75 Vouches)'; requiredForNext = 75; baseForCurrent = 50;
        } else if (userRoleNames.some(name => name.includes('high banneret'))) {
          rank = 'High Banneret 「 🦅 」'; nextMilestone = 'Sovereign Guard (50 Vouches)'; requiredForNext = 50; baseForCurrent = 25;
        } else if (userRoleNames.some(name => name.includes('vanguard squire'))) {
          rank = 'Vanguard Squire 「 🛡️ 」'; nextMilestone = 'High Banneret (25 Vouches)'; requiredForNext = 25; baseForCurrent = 10;
        } else if (userRoleNames.some(name => name.includes('sworn citizen'))) {
          rank = 'Sworn Citizen「 📜 」'; nextMilestone = 'Vanguard Squire (10 Vouches)'; requiredForNext = 10; baseForCurrent = 0;
        }
      }

      // Calculate progress bars dynamically
      let progressDisplay = '';
      if (requiredForNext > baseForCurrent && totalVouches < requiredForNext) {
        const totalSegmentNeed = requiredForNext - baseForCurrent;
        const currentSegmentHave = totalVouches - baseForCurrent;
        const percentage = Math.max(0, Math.min(100, (currentSegmentHave / totalSegmentNeed) * 100));
        
        const filledBlocks = Math.round(percentage / 10);
        const emptyBlocks = 10 - filledBlocks;
        progressDisplay = `\n\n**Progress to Next Rank:**\n\`${'▰'.repeat(filledBlocks)}${'▱'.repeat(emptyBlocks)}\` (${Math.round(percentage)}%)`;
      }

      embed
        .setTitle(`🔍 Imperial Audit: ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(`Detailed ledger background validation check on member profile: ${targetUser}`)
        .addFields(
          { name: '🆔 User Snowflake ID', value: `\`${targetUser.id}\``, inline: false },
          { name: '🏆 Total Logged Vouches', value: `\`${totalVouches}\` verified network entries`, inline: false },
          { name: '📜 Current Ledger Standing', value: rank, inline: false },
          { name: '🎯 Next Target Milestone', value: `${nextMilestone}${progressDisplay}`, inline: false }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ─── AUDIT SUB-ROUTE: GENERAL LEADERBOARD ROSTERS ───
    const sorted = Object.entries(db).sort(([, a], [, b]) => b - a).slice(0, 10);
    let auditList = '';

    if (sorted.length === 0) {
      auditList = '*No transaction history vouches logged inside core records yet.*';
    } else {
      auditList = sorted.map(([id, count], index) => {
        let medal = '🔹';
        if (index === 0) medal = '🥇';
        if (index === 1) medal = '🥈';
        if (index === 2) medal = '🥉';
        return `${medal} **#${index + 1}** <@${id}> — \`${count}\` valid items (ID: \`${id}\`)`;
      }).join('\n');
    }

    embed
      .setTitle('🔱 Imperial Vouch Network High-Score Standings')
      .setDescription(`Top transaction verification leaders configured across data systems:\n\n${auditList}`);

    return interaction.reply({ embeds: [embed] });
  }
};