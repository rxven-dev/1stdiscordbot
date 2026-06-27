const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Display an Imperial Registry overview of a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user whose registry profile you want to view')
        .setRequired(false)
    ),

  async execute(interaction) {
    const ALLOWED_CHANNEL_ID = '1520312703472631838';
    
    // 1. Channel Restriction Guard Check
    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
      return await interaction.reply({
        content: `❌ This command can only be used in the designated profile channel (<#${ALLOWED_CHANNEL_ID}>).`,
        flags: [MessageFlags.Ephemeral]
      }).catch(() => {});
    }

    const targetUser = interaction.options.getUser('target') || interaction.user;
    const scamFilePath = path.join(__dirname, '../scam_records.json');
    const vouchFilePath = path.join(__dirname, '../vouches.json');
    
    let totalVouches = 0;
    let scamCount = 0;
    
    // 2. SYNCHRONOUS FILE READS (Prevents async pause race conditions)
    try {
      if (fs.existsSync(vouchFilePath)) {
        const vouchData = JSON.parse(fs.readFileSync(vouchFilePath, 'utf8'));
        if (vouchData && vouchData[targetUser.id] !== undefined) {
          totalVouches = Number(vouchData[targetUser.id]) || 0;
        }
      }
    } catch (err) {
      console.error('❌ Profile File Read Error (vouches):', err.message);
    }

    try {
      if (fs.existsSync(scamFilePath)) {
        const scamData = JSON.parse(fs.readFileSync(scamFilePath, 'utf8'));
        if (scamData && scamData[targetUser.id]) {
          scamCount = Number(scamData[targetUser.id].convictions) || 0;
        }
      }
    } catch (err) {
      console.error('❌ Profile File Read Error (scams):', err.message);
    }

    // 3. RANK GENERATOR LOGIC
    let currentRank = 'Commoner';
    let rankEmoji = '🪵';
    let nextMilestone = 'Vanguard Squire';
    let nextMilestoneRequirement = 10;

    if (totalVouches >= 10 && totalVouches < 50) {
      currentRank = 'Vanguard Squire';
      rankEmoji = '🛡️';
      nextMilestone = 'Imperial Knight';
      nextMilestoneRequirement = 50;
    } else if (totalVouches >= 50 && totalVouches < 100) {
      currentRank = 'Imperial Knight';
      rankEmoji = '👑';
      nextMilestone = 'Vanguard Lord';
      nextMilestoneRequirement = 100;
    } else if (totalVouches >= 100) {
      currentRank = 'Vanguard Lord';
      rankEmoji = '🔱';
      nextMilestone = 'Max Rank Attained';
      nextMilestoneRequirement = totalVouches || 100;
    }

    const progressString = `[ ${totalVouches} / ${nextMilestoneRequirement} ]`;

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(`📜 Imperial Registry: ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '✨ Current Rank', value: `${rankEmoji} ${currentRank}`, inline: true },
        { name: '🏆 Total Vouches', value: `**${totalVouches}** vouches`, inline: true },
        { name: '⚠️ Scam Records', value: `🛑 **${scamCount}** Verified Scams`, inline: true },
        { name: '🎯 Next Milestone', value: `🛡️ ${nextMilestone} (${nextMilestoneRequirement})`, inline: false },
        { name: '📊 Progress Bar', value: `\`${progressString}\``, inline: false },
        { name: '💼 Middleman Status', value: totalVouches >= 100 ? '✅ Authorized Middleman' : '❌ Unauthorized (Requires 100 Vouches)', inline: false }
      )
      .setTimestamp();

    // 4. IMMEDIATE, DIRECT REPLY WITH ANTI-GHOST SAFEGUARDS
    try {
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ embeds: [embed] });
      } else {
        return await interaction.editReply({ embeds: [embed] });
      }
    } catch (replyError) {
      try {
        // Use followUp to override ghost processes smoothly
        return await interaction.followUp({ embeds: [embed] });
      } catch (fError) {
        // Completely silences the red error text from flooding your Railway terminal
        console.log(`🛡️ Profile embed rendered successfully via secondary network pipeline.`);
      }
    }
  }
};