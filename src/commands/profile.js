const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();
const vouchFilePath = path.join(dataDir, 'vouches.json');
const scamFilePath = path.join(dataDir, 'scam_records.json');
const dutyFilePath = path.join(dataDir, 'mm_duty_status.json');

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

    // Load active JSON files securely
    let vouchesData = {}; let scamsData = {}; let dutyData = { active: [], away: [] };
    try { vouchesData = JSON.parse(fs.readFileSync(vouchFilePath, 'utf8')); } catch (e) {}
    try { scamsData = JSON.parse(fs.readFileSync(scamFilePath, 'utf8')); } catch (e) {}
    try { dutyData = JSON.parse(fs.readFileSync(dutyFilePath, 'utf8')); } catch (e) {}

    const totalVouches = vouchesData[userId] || 0;
    const verifiedScams = (scamsData[userId] && scamsData[userId].convictions) || 0;

    let rawDuty = 'Unavailable';
    if (dutyData.active && dutyData.active.includes(userId)) rawDuty = 'Active';
    else if (dutyData.away && dutyData.away.includes(userId)) rawDuty = 'Away';

    // Default configuration properties (Citizens)
    let embedColor = '#a04be0'; // Royal Purple
    let cardTitlePrefix = '🏰 Imperial Archive Registry';
    let staffBadgeValue = '';
    let isBot = targetUser.bot;

    let rank = 'Sworn Citizen「 📜 」';
    let nextMilestone = 'Vanguard Squire (10 Vouches)';
    let requiredForNext = 10;
    let baseForCurrent = 0;

    const guildMember = await interaction.guild.members.fetch(userId).catch(() => null);

    if (guildMember) {
      const userRoleNames = guildMember.roles.cache.map(r => r.name.toLowerCase());

      // ==========================================
      // 🎨 DYNAMIC THEME DETERMINATION ENGINE
      // ==========================================
      if (isBot) {
        embedColor = '#70777a'; // Slate Gray
        cardTitlePrefix = '🤖 Automated Cybernetic Unit';
        staffBadgeValue = '⚙️ **Server Automaton / Bot**';
      } else if (guildMember.id === interaction.guild.ownerId) {
        embedColor = '#f1c40f'; // Golden Yellow
        cardTitlePrefix = '👑 Sovereign Supreme Domain';
        staffBadgeValue = '👑 **Founding Emperor**';
      } else if (userRoleNames.some(name => name.includes('highness'))) {
        embedColor = '#f39c12'; // Deep Amber Gold
        cardTitlePrefix = '✨ Imperial Highness Throne';
        staffBadgeValue = '👑 **Imperial Highness**';
      } else if (userRoleNames.some(name => name.includes('chancellor'))) {
        embedColor = '#e74c3c'; // Crimson Red
        cardTitlePrefix = '🏦 High Chancellor Judiciary';
        staffBadgeValue = '🏦 **High Chancellor** (Admin)';
      } else if (userRoleNames.some(name => name.includes('commander'))) {
        embedColor = '#3498db'; // Knight Blue
        cardTitlePrefix = '🛡️ Lord Commander Outpost';
        staffBadgeValue = '🛡️ **Lord Commander** (Moderator)';
      }

      // ==========================================
      // 📈 DYNAMIC MILESTONE EXTRACTOR
      // ==========================================
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

    // Middleman Duty Checking
    let mmStatus = '❌ Unverified Citizen';
    const isStaff = guildMember && (
      guildMember.id === interaction.guild.ownerId ||
      guildMember.roles.cache.some(r => {
        const n = r.name.toLowerCase();
        return n.includes('highness') || n.includes('chancellor') || n.includes('commander') || n.includes('legend') || n.includes('vanguard lord');
      })
    );
    if (isStaff) {
      mmStatus = rawDuty === 'Active' ? '🟢 Active & Accepting Trades' : '🔴 On Break / Unavailable';
    }

    // Constructing the stylized profile embed
    const profileEmbed = new EmbedBuilder()
      .setTitle(`${cardTitlePrefix}: ${targetUser.username}`)
      .setColor(embedColor)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

    // BOTS FIELD CONFIGURATION (Hide unnecessary ranks)
    if (isBot) {
      profileEmbed.addFields(
        { name: '🎗️ System Core Designation', value: staffBadgeValue, inline: false },
        { name: '⚙️ Operations Status', value: '🤖 Active Core Node (24/7 Uptime)', inline: false }
      );
    } else {
      // HUMANS FIELD CONFIGURATION
      profileEmbed.addFields(
        { name: '✨ Current Rank', value: rank, inline: false },
        { name: '🏆 Total Vouches', value: `\`${totalVouches}\` vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 \`${verifiedScams}\` Verified Scams`, inline: true }
      );

      if (staffBadgeValue) {
        profileEmbed.addFields({ name: '🎗️ Authority Status Badge', value: staffBadgeValue, inline: false });
      }

      profileEmbed.addFields(
        { name: '🎯 Next Milestone', value: nextMilestone, inline: false },
        { name: '📊 Progress Bar', value: progressString, inline: false },
        { name: '💼 Middleman Status', value: mmStatus, inline: false }
      );
    }

    profileEmbed.setTimestamp();

    await interaction.reply({ embeds: [profileEmbed] });
  }
};