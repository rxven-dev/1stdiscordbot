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

    // Direct Synchronized Live Pool Extraction
    let vouchData = {};
    let scamData = {};
    let dutyData = {};

    try {
      vouchData = JSON.parse(fs.readFileSync(vouchFilePath, 'utf8'));
      scamData = JSON.parse(fs.readFileSync(scamFilePath, 'utf8'));
      dutyData = JSON.parse(fs.readFileSync(dutyFilePath, 'utf8'));
    } catch (parseErr) {
      console.error('Error fetching internal file links matrix:', parseErr);
    }

    const totalVouches = vouchData[userId] || 0;
    const verifiedScams = scamData[userId] || 0;
    const rawDuty = dutyData[userId] || 'Offline';

    // Staff identification block setups
    const guildMember = await interaction.guild.members.fetch(userId).catch(() => null);
    let staffBadgeValue = '';
    
    if (guildMember) {
      if (guildMember.id === interaction.guild.ownerId) {
        staffBadgeValue = '👑 **Founding Emperor**';
      } else if (guildMember.roles.cache.has('1326445582310113292')) {
        staffBadgeValue = '⚔️ **Imperial Guard Middleman**';
      } else if (guildMember.permissions.has(PermissionFlagsBits.Administrator)) {
        staffBadgeValue = '🛡️ **High Council Administrator**';
      }
    }

    // Rank Progression Matrix Logic
    let rank = 'Neutral Civilian';
    let nextMilestone = 'Initiate Merchant (10 Vouches)';
    let requiredForNext = 10;
    let baseForCurrent = 0;

    if (totalVouches >= 100) {
      rank = '💎 Vanguard Lord';
      nextMilestone = '👑 Ultimate Mythic Monarch status accomplished!';
      requiredForNext = totalVouches;
      baseForCurrent = 100;
    } else if (totalVouches >= 50) {
      rank = '🔮 Master Spellweaver';
      nextMilestone = '💎 Vanguard Lord (100 Vouches)';
      requiredForNext = 100;
      baseForCurrent = 50;
    } else if (totalVouches >= 25) {
      rank = '🎖️ Elite Commander';
      nextMilestone = '🔮 Master Spellweaver (50 Vouches)';
      requiredForNext = 50;
      baseForCurrent = 25;
    } else if (totalVouches >= 10) {
      rank = '📜 Initiate Merchant';
      nextMilestone = '🎖️ Elite Commander (25 Vouches)';
      requiredForNext = 25;
      baseForCurrent = 10;
    }

    // Progress Bar Calculator
    let progressString = 'Fully Graduated 🏆';
    if (totalVouches < 100) {
      const neededRange = requiredForNext - baseForCurrent;
      const currentProgress = totalVouches - baseForCurrent;
      const percentage = Math.min(Math.max(currentProgress / neededRange, 0), 1);
      const filledBlocks = Math.round(percentage * 10);
      const emptyBlocks = 10 - filledBlocks;
      progressString = '🟩'.repeat(filledBlocks) + '⬛'.repeat(emptyBlocks) + ` (${totalVouches}/${requiredForNext})`;
    }

    // Duty Metric Output formatting
    let mmStatus = '❌ Unverified Citizen';
    if (guildMember && guildMember.roles.cache.has('1326445582310113292')) {
      mmStatus = rawDuty === 'Active' ? '🟢 Active & Accepting Trades' : '🔴 On Break / Unavailable';
    }

    const profileEmbed = new EmbedBuilder()
      .setTitle(`🏰 Imperial Archive Registry: ${targetUser.username}`)
      .setColor('#a04be0')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '✨ Current Rank', value: rank, inline: false },
        { name: '🏆 Total Vouches', value: `\`${totalVouches}\` vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 \`${verifiedScams}\` Verified Scams`, inline: true }
      );

    if (staffBadgeValue) {
      profileEmbed.addFields({ name: '🎗️ Authority Status Badge', value: staffBadgeValue, inline: false });
    } else {
      profileEmbed.addFields(
        { name: '🎯 Next Milestone', value: nextMilestone, inline: false },
        { name: '📊 Progress Bar', value: progressString, inline: false }
      );
    }

    profileEmbed.addFields({ name: '💼 Middleman Status', value: mmStatus, inline: false }).setTimestamp();

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
        console.error('🛡️ Failed network logging pipeline resolution:', fError);
      }
    }
  }
};