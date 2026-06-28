const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
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
    const ALLOWED_CHANNEL = '1520312703472631838';
    
    if (interaction.channelId !== ALLOWED_CHANNEL) {
      return interaction.reply({ content: `❌ This command can only be used in <#${ALLOWED_CHANNEL}>.`, flags: MessageFlags.Ephemeral });
    }
    
    await interaction.deferReply();

    let vouchesData = {}; let scamsData = {}; let dutyData = { active: [], away: [] };
    try { vouchesData = fs.existsSync(vouchFilePath) ? JSON.parse(fs.readFileSync(vouchFilePath, 'utf8')) : {}; } catch(e) {}
    try { scamsData = fs.existsSync(scamFilePath) ? JSON.parse(fs.readFileSync(scamFilePath, 'utf8')) : {}; } catch(e) {}
    try { dutyData = fs.existsSync(dutyFilePath) ? JSON.parse(fs.readFileSync(dutyFilePath, 'utf8')) : { active: [], away: [] }; } catch(e) {}

    const totalVouches = vouchesData[userId] || 0;
    const verifiedScams = scamsData[userId] || 0;

    let rank = 'Neutral Civilian / External Party 👤';
    let embedColor = '#95a5a6';

    if (totalVouches >= 100) { rank = 'Vanguard Lord 🔱 (100+ Vouches)'; embedColor = '#f1c40f'; }
    else if (totalVouches >= 70) { rank = 'Immortal Legend 👑 (70+ Vouches)'; embedColor = '#e74c3c'; }
    else if (totalVouches >= 40) { rank = 'Apex Overlord ⚔️ (40+ Vouches)'; embedColor = '#9b59b6'; }
    else if (totalVouches >= 20) { rank = 'Elite Mercenary 🛡️ (20+ Vouches)'; embedColor = '#3498db'; }
    else if (totalVouches >= 10) { rank = 'Trusted Vendor 📦 (10+ Vouches)'; embedColor = '#2ecc71'; }
    else if (totalVouches >= 5) { rank = 'Rising Merchant 📈 (5+ Vouches)'; embedColor = '#1abc9c'; }
    else if (totalVouches >= 1) { rank = 'Verified Trader 🤝 (1+ Vouch)'; embedColor = '#34495e'; }

    if (verifiedScams > 0) {
      rank = '☣️ BLACKLISTED SCAMMER ☣️';
      embedColor = '#000000';
    }

    // --- FIXED PROGRESS BAR CALCULATOR LOGIC MATRIX ---
    let nextMilestone = '🎉 Elite Champion Rank Maxed Out!';
    let progressString = '████████████████████ 100%';

    function generateProgressBar(current, min, max) {
      const targetRange = max - min;
      const gainedInTier = current - min;
      const percentage = Math.min(Math.max(Math.floor((gainedInTier / targetRange) * 100), 0), 100);
      
      // 10 segments total for clean visual presentation
      const filledBlocks = Math.round(percentage / 10);
      const emptyBlocks = 10 - filledBlocks;
      return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks) + ` ${percentage}%`;
    }

    if (totalVouches < 1) { 
      nextMilestone = 'Verified Trader 🤝 (1 Vouch Required)'; 
      progressString = '░░░░░░░░░░ 0%'; 
    }
    else if (totalVouches < 5) { 
      progressString = generateProgressBar(totalVouches, 1, 5);
      nextMilestone = `Rising Merchant 📈 (${5 - totalVouches} more required)`;
    } else if (totalVouches < 10) {
      progressString = generateProgressBar(totalVouches, 5, 10);
      nextMilestone = `Trusted Vendor 📦 (${10 - totalVouches} more required)`;
    } else if (totalVouches < 20) {
      progressString = generateProgressBar(totalVouches, 10, 20);
      nextMilestone = `Elite Mercenary 🛡️ (${20 - totalVouches} more required)`;
    } else if (totalVouches < 40) {
      progressString = generateProgressBar(totalVouches, 20, 40);
      nextMilestone = `Apex Overlord ⚔️ (${40 - totalVouches} more required)`;
    } else if (totalVouches < 70) {
      progressString = generateProgressBar(totalVouches, 40, 70);
      nextMilestone = `Immortal Legend 👑 (${70 - totalVouches} more required)`;
    } else if (totalVouches < 100) {
      progressString = generateProgressBar(totalVouches, 70, 100);
      nextMilestone = `Vanguard Lord 🔱 (${100 - totalVouches} more required)`;
    }

    let staffBadgeValue = '';
    let cardTitlePrefix = 'Imperial Network ID Card';
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    const isBot = targetUser.bot;

    if (member) {
      if (member.roles.cache.has('1421722522851868827')) {
        staffBadgeValue = '👑 **Imperial Highness** | Divine Crown Ruler';
        cardTitlePrefix = '👑 Imperial Royal Sovereign Matrix File';
        embedColor = '#ff007f'; 
      } 
      else if (member.permissions.has('Administrator') || member.roles.cache.has('1414079646256857128')) {
        staffBadgeValue = '💎 **High Chancellor** | Server Overseer Operations';
        cardTitlePrefix = '🏛️ Imperial Administrative Matrix File';
        embedColor = '#a04be0'; 
      } 
      else if (member.roles.cache.has('1414079432741617724')) {
        staffBadgeValue = '🛡️ **Lord Commander** | Security Division Force';
        cardTitlePrefix = '⚔️ Staff Guard Operational Profile';
        embedColor = '#e67e22';
      } 
      else if (member.roles.cache.has('1520310648582443089')) {
        staffBadgeValue = '🔱 **Vanguard Lord** | Certified Middleman Operator';
        cardTitlePrefix = '📜 Imperial Certified Middleman Ledger';
      }
    }

    let statusQuote = '';
    if (member && (member.roles.cache.has('1520310648582443089') || member.permissions.has('Administrator') || member.roles.cache.has('1421722522851868827'))) {
      const isActive = dutyData.active && dutyData.active.includes(userId);
      statusQuote = isActive ? '🟢 Online & Accepting Middleman Trades' : '🔴 On Break / Currently Unavailable';
    }

    const profileEmbed = new EmbedBuilder()
      .setTitle(`${cardTitlePrefix}: ${targetUser.username}`)
      .setColor(embedColor)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

    if (isBot) {
      profileEmbed.addFields(
        { name: '🎗️ System Designation', value: staffBadgeValue || '🤖 Automated Defense Mechanism', inline: false },
        { name: '⚙️ Operations Status', value: '🤖 Active Cybernetic Node (24/7 Monitoring)', inline: false }
      );
    } else {
      profileEmbed.addFields(
        { name: '✨ Current Rank', value: rank, inline: false },
        { name: '🏆 Total Vouches', value: `\`${totalVouches}\` vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 \`${verifiedScams}\` Verified Scams`, inline: true }
      );

      if (staffBadgeValue) {
        profileEmbed.addFields({ name: '🎗️ Authority Status Badge', value: staffBadgeValue, inline: false });
      }

      if (statusQuote) {
        profileEmbed.setDescription(statusQuote);
      }

      profileEmbed.addFields(
        { name: '🎯 Next Milestone', value: nextMilestone, inline: false },
        { name: '📊 Progress Bar', value: progressString, inline: false },
        { name: '📅 Registry Footprint', value: `Account Built: <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: false }
      );
    }

    return await interaction.editReply({ embeds: [profileEmbed] });
  }
};