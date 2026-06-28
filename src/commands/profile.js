const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Force exact physical root-level absolute layout volume matching
const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();

const vouchFilePath = path.join(dataDir, 'vouches.json');
const scamFilePath = path.join(dataDir, 'scam_records.json');
const dutyFilePath = path.join(dataDir, 'mm_duty_status.json');

// Ensure the data directory structure exists cleanly in isolation
if (!fs.existsSync(dataDir) && process.env.RAILWAY_ENVIRONMENT) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Safeguard all physical file links from missing database parse errors
if (!fs.existsSync(vouchFilePath)) fs.writeFileSync(vouchFilePath, JSON.stringify({}), 'utf8');
if (!fs.existsSync(scamFilePath)) fs.writeFileSync(scamFilePath, JSON.stringify({}), 'utf8');
if (!fs.existsSync(dutyFilePath)) fs.writeFileSync(dutyFilePath, JSON.stringify({}), 'utf8');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View an Imperial Registry user profile background summary card')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Select a member to view their credentials')
        .setRequired(false)),

  async executeProfile(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userId = targetUser.id;

    // Load active JSON files into memory structures
    let vouchesData = {};
    let scamsData = {};
    let dutyData = { active: [], away: [] };

    try {
      vouchesData = JSON.parse(fs.readFileSync(vouchFilePath, 'utf8'));
    } catch (e) { console.error("Vouch parse exception:", e); }

    try {
      scamsData = JSON.parse(fs.readFileSync(scamFilePath, 'utf8'));
    } catch (e) { console.error("Scam parse exception:", e); }

    try {
      dutyData = JSON.parse(fs.readFileSync(dutyFilePath, 'utf8'));
    } catch (e) { console.error("Duty status parse exception:", e); }

    // Read unique counts or fallback safely to 0
    const totalVouches = vouchesData[userId] || 0;
    const verifiedScams = (scamsData[userId] && scamsData[userId].convictions) || 0;

    // Locate matching real-time duty indicators
    let rawDuty = 'Unavailable';
    if (dutyData.active && dutyData.active.includes(userId)) {
      rawDuty = 'Active';
    } else if (dutyData.away && dutyData.away.includes(userId)) {
      rawDuty = 'Away';
    }

    // ==========================================
    // 🏛️ AUTOMATIC DYNAMIC ROLE SCANNER ENGINE
    // ==========================================
    let rank = 'Sworn Citizen「 📜 」';
    let nextMilestone = 'Vanguard Squire (10 Vouches)';
    let requiredForNext = 10;
    let baseForCurrent = 0;

    // Staff Badge Dynamic Scanner
    let staffBadgeValue = '';
    const guildMember = await interaction.guild.members.fetch(userId).catch(() => null);

    if (guildMember) {
      // 1. Check Owner Status Automatically
      if (guildMember.id === interaction.guild.ownerId) {
        staffBadgeValue = '👑 **Founding Emperor**';
      }

      // 2. Scan User Roles Dynamically by Name
      const userRoleNames = guildMember.roles.cache.map(r => r.name.toLowerCase());

      // Set Staff Badges based on Role Names
      if (userRoleNames.some(name => name.includes('chancellor'))) {
        staffBadgeValue = '🏦 **High Chancellor** (Admin)';
      } else if (userRoleNames.some(name => name.includes('commander'))) {
        staffBadgeValue = '🛡️ **Lord Commander** (Moderator)';
      }

      // Set Rank Roster dynamically based on the highest tier role found
      if (userRoleNames.some(name => name.includes('immortal legend'))) {
        rank = 'Immortal Legend 「 👑 」';
        nextMilestone = '✨ Ultimate Mythic Monarch status accomplished!';
        requiredForNext = totalVouches;
        baseForCurrent = 150;
      } else if (userRoleNames.some(name => name.includes('vanguard lord'))) {
        rank = 'Vanguard Lord 「 🔱 」';
        nextMilestone = 'Immortal Legend (150 Vouches)';
        requiredForNext = 150;
        baseForCurrent = 100;
      } else if (userRoleNames.some(name => name.includes('grand paladin'))) {
        rank = 'Grand Paladin「 ⚔️ 」';
        nextMilestone = 'Vanguard Lord (100 Vouches)';
        requiredForNext = 100;
        baseForCurrent = 75;
      } else if (userRoleNames.some(name => name.includes('sovereign guard'))) {
        rank = 'Sovereign Guard 「 🛡️ 」';
        nextMilestone = 'Grand Paladin (75 Vouches)';
        requiredForNext = 75;
        baseForCurrent = 50;
      } else if (userRoleNames.some(name => name.includes('high banneret'))) {
        rank = 'High Banneret 「 🦅 」';
        nextMilestone = 'Sovereign Guard (50 Vouches)';
        requiredForNext = 50;
        baseForCurrent = 25;
      } else if (userRoleNames.some(name => name.includes('vanguard squire'))) {
        rank = 'Vanguard Squire 「 🛡️ 」';
        nextMilestone = 'High Banneret (25 Vouches)';
        requiredForNext = 25;
        baseForCurrent = 10;
      } else if (userRoleNames.some(name => name.includes('sworn citizen'))) {
        rank = 'Sworn Citizen「 📜 」';
        nextMilestone = 'Vanguard Squire (10 Vouches)';
        requiredForNext = 10;
        baseForCurrent = 0;
      }
    }

    // Progress Bar Calculator
    let progressString = 'Fully Graduated 🏆';
    if (totalVouches < 150) {
      const neededRange = requiredForNext - baseForCurrent;
      const currentProgress = totalVouches - baseForCurrent;
      const percentage = Math.min(Math.max(currentProgress / neededRange, 0), 1);
      const filledBlocks = Math.round(percentage * 10);
      const emptyBlocks = 10 - filledBlocks;
      progressString = '🟩'.repeat(filledBlocks) + '⬛'.repeat(emptyBlocks) + ` (${totalVouches}/${requiredForNext})`;
    }

    // Dynamic Middleman Authorization Check (Normalized String Matching Engine)
    let mmStatus = '❌ Unverified Citizen';
    
    const isStaff = guildMember && (
      guildMember.id === interaction.guild.ownerId ||
      guildMember.roles.cache.some(r => {
        const nameClean = r.name.toLowerCase();
        // Added 'highness' to completely secure your owner account rank metrics!
        return nameClean.includes('highness') || 
               nameClean.includes('chancellor') || 
               nameClean.includes('commander') || 
               nameClean.includes('legend') || 
               nameClean.includes('vanguard lord');
      })
    );

    if (isStaff) {
      mmStatus = rawDuty === 'Active' ? '🟢 Active & Accepting Trades' : '🔴 On Break / Unavailable';
    }

    // Generate Profile Embed Component Structure Layout
    const profileEmbed = new EmbedBuilder()
      .setTitle(`🏰 Imperial Archive Registry: ${targetUser.username}`)
      .setColor('#a04be0')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '✨ Current Rank', value: rank, inline: false },
        { name: '🏆 Total Vouches', value: `\`${totalVouches}\` vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 \`${verifiedScams}\` Verified Scams`, inline: true }
      );

    // Dynamic, decoupled field layouts so milestones never hide for staff users!
    if (staffBadgeValue) {
      profileEmbed.addFields({ name: '🎗️ Authority Status Badge', value: staffBadgeValue, inline: false });
    }

    profileEmbed.addFields(
      { name: '🎯 Next Milestone', value: nextMilestone, inline: false },
      { name: '📊 Progress Bar', value: progressString, inline: false },
      { name: '💼 Middleman Status', value: mmStatus, inline: false }
    ).setTimestamp();

    try {
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ embeds: [profileEmbed] });
      } else {
        return await interaction.editReply({ embeds: [profileEmbed] });
      }
    } catch (networkError) {
      try {
        return await interaction.followUp({ embeds: [profileEmbed], ephemeral: true });
      } catch (fError) {
        console.error('CRITICAL: Discord network pipe collapsed during profiling action rendering:', fError);
      }
    }
  }
};