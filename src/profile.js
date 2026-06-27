const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Target the shared permanent volume folder explicitly
const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();
const scamFilePath = path.join(dataDir, 'scam_records.json');
const vouchFilePath = path.join(dataDir, 'vouches.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View an Imperial Registry user profile background summary card')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Select a member to view their credentials')
        .setRequired(false)),

  async executeProfile(interaction) {
    // 1. Fetch the Target User Object and their Guild Member Object safely
    const targetUser = interaction.options.getUser('user') || interaction.user;
    let targetMember = null;
    try {
      targetMember = await interaction.guild.members.fetch(targetUser.id);
    } catch (e) {
      // Fallback if user is no longer in the server
    }

    // --- 2. DYNAMIC DATA ACQUISITION METRICS ---
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
        if (vouchData[targetUser.id] !== undefined) {
          // FIXED: Support both object format (.count) or flat integer format directly
          if (typeof vouchData[targetUser.id] === 'object' && vouchData[targetUser.id].count !== undefined) {
            totalVouches = Number(vouchData[targetUser.id].count) || 0;
          } else {
            totalVouches = Number(vouchData[targetUser.id]) || 0;
          }
        }
      } catch (err) {
        console.error('❌ Error reading vouch metrics path:', err.message);
      }
    }

    // --- 3. DETERMINE THE USER CATEGORY TIER & COLORS ---
    let titlePrefix = '📜 Imperial Registry';
    let embedColor = '#1a1a1a'; // Default dark theme
    let staffBadgeValue = null;
    let mmStatus = '❌ Unauthorized (Requires 100 Vouches)';

    // Define staff role IDs based on your mmstatus.js settings
    const ROLES = {
      VANGUARD_LORD: '1520310648582443089',
      IMMORTAL_LEGEND: '1520310652021899415',
      LORD_COMMANDER: '1414079432741617724',
      HIGH_CHANCELLOR: '1414079646256857128'
    };

    if (targetUser.bot) {
      titlePrefix = '🤖 Autonomous Construct';
      embedColor = '#00b0f4'; // Cyber Blue
      staffBadgeValue = '⚡ Official Automated Imperial Service System';
    } else if (targetUser.id === interaction.guild.ownerId) {
      titlePrefix = '👑 Imperial Sovereign';
      embedColor = '#ff4757'; // Premium Crimson Red
      staffBadgeValue = '🔱 **Server Founder & Absolute Authority**';
      mmStatus = '⚡ Certified Senior Management (Highly Trusted)';
    } else if (targetMember && targetMember.roles.cache.has(ROLES.HIGH_CHANCELLOR)) {
      titlePrefix = '🏛️ High Chancellor';
      embedColor = '#eccc68'; // Imperial Gold
      staffBadgeValue = '🌟 **Server Administrator (High Council Execution)**';
      mmStatus = '⚡ Certified Senior Management (Highly Trusted)';
    } else if (targetMember && targetMember.roles.cache.has(ROLES.LORD_COMMANDER)) {
      titlePrefix = '⚔️ Lord Commander';
      embedColor = '#2ed573'; // Emerald Enforcement Green
      staffBadgeValue = '🛡️ **Server Moderator (Enforcer & Order Overseer)**';
      mmStatus = '⚡ Certified Senior Management (Highly Trusted)';
    } else if (targetMember && targetMember.roles.cache.has(ROLES.VANGUARD_LORD)) {
      titlePrefix = '🔱 Vanguard Lord';
      embedColor = '#a04be0'; 
      mmStatus = '✅ Verified Authorized Imperial Middleman';
    } else if (targetMember && targetMember.roles.cache.has(ROLES.IMMORTAL_LEGEND)) {
      titlePrefix = '👑 Immortal Legend';
      embedColor = '#ffb6c1';
    }

    // --- 4. STANDARD SOCIAL REPUTATION SYSTEM RANK CALCULATOR ---
    let rank = '🪵 Sworn Citizen (Not a Middleman)';
    let nextMilestone = '🔷 Vanguard Squire (10)';
    let progressString = '`[ 0 / 10 ]`';

    if (staffBadgeValue) {
      rank = '👑 Absolute Immunity / Server Management';
    } else {
      if (totalVouches >= 10 && totalVouches < 25) {
        rank = '🔷 Vanguard Squire';
        nextMilestone = '⚔️ Knight Imperial (25)';
        progressString = `\`[ ${totalVouches} / 25 ]\``;
      } else if (totalVouches >= 25 && totalVouches < 50) {
        rank = '⚔️ Knight Imperial';
        nextMilestone = '🛡️ High Paladin (50)';
        progressString = `\`[ ${totalVouches} / 50 ]\``;
      } else if (totalVouches >= 50 && totalVouches < 100) {
        rank = '🛡️ High Paladin';
        nextMilestone = '🔱 Vanguard Lord (100)';
        progressString = `\`[ ${totalVouches} / 100 ]\``;
      } else if (totalVouches >= 100) {
        rank = '🔱 Vanguard Lord';
        nextMilestone = '👑 Max Level Attained';
        progressString = `\`[ ${totalVouches} / 100+ ]\``;
        if (mmStatus.startsWith('❌')) {
          mmStatus = '✅ Verified Authorized Imperial Middleman';
        }
      } else {
        progressString = `\`[ ${totalVouches} / 10 ]\``;
      }
    }

    // --- 5. RICH VISUAL GRAPH EMBED COMPILATION ---
    const profileEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(`${titlePrefix}: ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '✨ Current Rank', value: rank, inline: false },
        { name: '🏆 Total Vouches', value: `\`${totalVouches}\` vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 \`${verifiedScams}\` Verified Scams`, inline: true }
      );

    // Dynamic Insertion: Handle specialized layout metrics
    if (staffBadgeValue) {
      profileEmbed.addFields({ name: '🎗️ Authority Status Badge', value: staffBadgeValue, inline: false });
    } else {
      profileEmbed.addFields(
        { name: '🎯 Next Milestone', value: nextMilestone, inline: false },
        { name: '📊 Progress Bar', value: progressString, inline: false }
      );
    }

    profileEmbed.addFields({ name: '💼 Middleman Status', value: mmStatus, inline: false }).setTimestamp();

    // --- 6. SECURE NETWORK PIPELINE ROUTING WRAPPER ---
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

  async execute(interaction) {
    return await this.executeProfile(interaction);
  }
};