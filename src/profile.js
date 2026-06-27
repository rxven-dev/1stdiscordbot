const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Safe dynamic relative links to your main root database files
const scamFilePath = path.join(__dirname, '../scam_records.json');
const vouchFilePath = path.join(__dirname, '../vouches.json');

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
        const jsonString = fs.readFileSync(vouchFilePath, 'utf8');
        // Handle empty or clean file gracefully
        if (jsonString && jsonString.trim() !== '{}' && jsonString.trim() !== '') {
          const vouchData = JSON.parse(jsonString);
          if (vouchData[targetUser.id] && vouchData[targetUser.id].count !== undefined) {
            totalVouches = Number(vouchData[targetUser.id].count) || 0;
          }
        }
      } catch (err) {
        console.error('❌ Error reading vouch metrics path:', err.message);
      }
    }

    // --- 3. EXPLICIT SERVER ROLE MATRIX IDs ---
    const ROLE_LORD_COMMANDER = '1414079432741617724'; // Moderator
    const ROLE_HIGH_CHANCELLOR = '1414079646256857128'; // Admin
    const ROLE_VANGUARD_LORD = '1520310648582443089';   // Official Middleman

    // --- 4. DETERMINE THE USER CATEGORY TIER & COLORS ---
    let titlePrefix = '📜 Imperial Registry';
    let embedColor = '#2f3136'; // Standard elegant dark discord theme
    let staffBadgeValue = null;
    let isManagement = false;

    if (targetUser.bot) {
      titlePrefix = '🤖 Autonomous Construct';
      embedColor = '#00b0f4'; // Cyber Blue
      staffBadgeValue = '⚡ Official Automated Imperial Service System';
    } else if (targetUser.id === interaction.guild.ownerId) {
      titlePrefix = '👑 Imperial Sovereign';
      embedColor = '#ff4757'; // Premium Crimson Red
      staffBadgeValue = '🔱 **Server Founder & Absolute Authority**';
      isManagement = true;
    } else if (targetMember && targetMember.roles.cache.has(ROLE_HIGH_CHANCELLOR)) {
      titlePrefix = '🏦 High Chancellor';
      embedColor = '#eccc68'; // Imperial Gold
      staffBadgeValue = '🌟 **Server Administrator (High Council Execution)**';
      isManagement = true;
    } else if (targetMember && targetMember.roles.cache.has(ROLE_LORD_COMMANDER)) {
      titlePrefix = '🛡️ Lord Commander';
      embedColor = '#2ed573'; // Emerald Enforcer Green
      staffBadgeValue = '⚔️ **Server Moderator (Vanguard Order Overseer)**';
      isManagement = true;
    }

    // --- 5. SOCIAL REPUTATION SYSTEM MILESTONE MILESTONES ---
    let rank = '📜 Sworn Citizen';
    let nextMilestone = '🛡️ Vanguard Squire (10)';
    let progressString = '`[ 0 / 10 ]`';

    if (isManagement) {
      rank = '👑 Absolute Immunity / Server Management';
    } else {
      if (totalVouches >= 0 && totalVouches < 10) {
        rank = '📜 Sworn Citizen (Not a Middleman)';
        nextMilestone = '🛡️ Vanguard Squire (10)';
        progressString = `\`[ ${totalVouches} / 10 ]\``;
      } else if (totalVouches >= 10 && totalVouches < 25) {
        rank = '🛡️ Vanguard Squire';
        nextMilestone = '🦅 High Banneret (25)';
        progressString = `\`[ ${totalVouches} / 25 ]\``;
      } else if (totalVouches >= 25 && totalVouches < 50) {
        rank = '🦅 High Banneret';
        nextMilestone = '🛡️ Sovereign Guard (50)';
        progressString = `\`[ ${totalVouches} / 50 ]\``;
      } else if (totalVouches >= 50 && totalVouches < 75) {
        rank = '🛡️ Sovereign Guard';
        nextMilestone = '⚔️ Grand Paladin (75)';
        progressString = `\`[ ${totalVouches} / 75 ]\``;
      } else if (totalVouches >= 75 && totalVouches < 100) {
        rank = '⚔️ Grand Paladin';
        nextMilestone = '🔱 Vanguard Lord (100)';
        progressString = `\`[ ${totalVouches} / 100 ]\``;
      } else if (totalVouches >= 100 && totalVouches < 150) {
        rank = '🔱 Vanguard Lord';
        nextMilestone = '👑 Immortal Legend (150)';
        progressString = `\`[ ${totalVouches} / 150 ]\``;
      } else if (totalVouches >= 150) {
        rank = '👑 Immortal Legend';
        nextMilestone = '🏆 Maximum Imperial Standing Achieved';
        progressString = `\`[ ${totalVouches} / 150+ ]\``;
      }
    }

    // --- 6. HIGHLY TRUSTED MIDDLEMAN CHECK OVERRIDES ---
    let mmStatus = '❌ Unauthorized (Not a Middleman / Requires 100 Vouches)';
    
    if (isManagement) {
      mmStatus = '⚡ **Certified Senior Management (Highly Trusted)**';
    } else if (targetMember && targetMember.roles.cache.has(ROLE_VANGUARD_LORD)) {
      mmStatus = '✅ **Verified Authorized Imperial Middleman**';
    } else if (totalVouches >= 100) {
      mmStatus = '✅ **Verified Authorized Imperial Middleman**';
    }

    // --- 7. RICH VISUAL GRAPH EMBED COMPILATION ---
    const profileEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(`${titlePrefix}: ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '✨ Current Rank', value: rank, inline: true },
        { name: '🏆 Total Vouches', value: `\`${totalVouches}\` vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 \`${verifiedScams}\` Verified Scams`, inline: true }
      );

    // Dynamic Insertion: If they are management/bot, output their authority badge field instead of standard bars
    if (staffBadgeValue) {
      profileEmbed.addFields({ name: '🎗️ Authority Status Badge', value: staffBadgeValue, inline: false });
    } else {
      profileEmbed.addFields(
        { name: '🎯 Next Milestone', value: nextMilestone, inline: false },
        { name: '📊 Progress Bar', value: progressString, inline: false }
      );
    }

    // Append middleman designation
    profileEmbed.addFields({ name: '💼 Middleman Status', value: mmStatus, inline: false }).setTimestamp();

    // --- 8. SECURE NETWORK PIPELINE ROUTING WRAPPER ---
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