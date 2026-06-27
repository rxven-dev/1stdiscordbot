const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Safe relative paths for data tracking
const scamFilePath = path.join(__dirname, '../scam_records.json');

module.exports = {
  // --- 1. SLASH COMMAND EXECUTION ---
  async executeScam(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const proofAttachment = interaction.options.getAttachment('proof');

    const staffLogChannelId = '1520312703472631838'; // Update to your official staff log channel ID if needed
    const logChannel = interaction.guild.channels.cache.get(staffLogChannelId);

    const embed = new EmbedBuilder()
      .setColor('#ff3333')
      .setTitle('🛑 New Fraud / Scam Report Filed')
      .setDescription(`A formal case report has been generated against a user suspicion matrix.`)
      .addFields(
        { name: '👤 Accused Suspect', value: `${targetUser} (${targetUser.id})`, inline: true },
        { name: '🛡️ Reported By', value: `${interaction.user} (${interaction.user.id})`, inline: true },
        { name: '📝 Case Particulars / Reason', value: reason, inline: false }
      )
      .setTimestamp();

    if (proofAttachment) {
      embed.setImage(proofAttachment.url);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`scam_guilty_${targetUser.id}`)
        .setLabel('Confirm Conviction (Guilty)')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`scam_innocent_${targetUser.id}`)
        .setLabel('Dismiss Case (Innocent)')
        .setStyle(ButtonStyle.Secondary)
    );

    // Send dispatch to log channels safely
    if (logChannel) {
      try {
        await logChannel.send({ embeds: [embed], components: [row] });
      } catch (err) {
        console.error('❌ Failed to route scam dispatch to channel logs:', err.message);
      }
    }

    // 🎯 DIRECT REPLY INTERACTION CONTROL WITH GHOST OVERRIDES
    try {
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ content: '✅ Your case report has been dispatched to the Imperial Staff Terminal logs for active review.', flags: [MessageFlags.Ephemeral] });
      } else {
        return await interaction.editReply({ content: '✅ Your case report has been dispatched to the Imperial Staff Terminal logs for active review.' });
      }
    } catch (replyError) {
      try {
        return await interaction.followUp({ content: '✅ Your case report has been dispatched to the Imperial Staff Terminal logs for active review.', flags: [MessageFlags.Ephemeral] });
      } catch (fError) {
        console.log('🛡️ Blocked a slash command scam ghost conflict cleanly.');
      }
    }
  },

  // --- 2. LOG MATRIX BUTTON RESPONSES ---
  async handleScamButton(interaction) {
    // Permission Guard Check
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      try {
        return await interaction.reply({ content: '❌ Only Imperial Staff can decide court case resolutions.', flags: [MessageFlags.Ephemeral] });
      } catch (e) { return; }
    }

    const { customId } = interaction;
    const parts = customId.split('_');
    const action = parts[1]; // 'guilty' or 'innocent'
    const suspectId = parts[2];

    const currentEmbed = interaction.message.embeds[0];
    if (!currentEmbed) return;

    const updatedEmbed = EmbedBuilder.from(currentEmbed);

    if (action === 'guilty') {
      updatedEmbed.setColor('#000000').setTitle('🛑 Case Verdict: CONVICTED GUILTY');

      try {
        let scamData = {};
        if (fs.existsSync(scamFilePath)) {
          scamData = JSON.parse(fs.readFileSync(scamFilePath, 'utf8')) || {};
        }

        if (!scamData[suspectId]) {
          scamData[suspectId] = { convictions: 0 };
        }
        scamData[suspectId].convictions = (Number(scamData[suspectId].convictions) || 0) + 1;

        fs.writeFileSync(scamFilePath, JSON.stringify(scamData, null, 2));
        updatedEmbed.addFields({ name: '⚖️ Court Decision Log', value: `🚨 Verified guilty verdict rendered by ${interaction.user}. Total convictions updated.` });
      } catch (err) {
        console.error('❌ Failed processing internal database write:', err.message);
      }
    } else {
      updatedEmbed.setColor('#555555').setTitle('🏳️ Case Verdict: DISMISSED INNOCENT');
      updatedEmbed.addFields({ name: '⚖️ Court Decision Log', value: `✅ Insufficient evidence. Dismissed clean by ${interaction.user}.` });
    }

    // 🎯 BUTTON UPDATE INTERACTION CONTROL WITH GHOST OVERRIDES
    try {
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.update({ embeds: [updatedEmbed], components: [] });
      } else {
        return await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
      }
    } catch (btnError) {
      try {
        // Fallback network pipeline update if ghost acknowledged it first
        return await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
      } catch (fError) {
        console.log('🛡️ Blocked a button scam ghost interaction loop crash safely.');
      }
    }
  }
};