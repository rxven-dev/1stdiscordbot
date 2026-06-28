const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (client) => {
  const BOT_LOGS_CHANNEL_ID = '1514251673219108966'; // Your bot logs channel

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Regex to catch Discord invite links
    const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discord\.com\/invite)\/[a-zA-Z0-9\-]+/i;

    if (inviteRegex.test(message.content)) {
      const member = message.member;
      if (!member) return;

      // Skip staff/admins
      if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return;
      }

      // 1. Delete the invite link
      await message.delete().catch(() => null);

      // 2. Timeout (Mute) the user for 24 hours
      const timeoutDuration = 24 * 60 * 60 * 1000;
      const reason = 'Automated Link Protection: Server recruitment / unauthorized advertising.';

      try {
        if (!member.moderatable) {
          console.log(`⚠️ Cannot timeout ${member.user.tag} due to role hierarchy.`);
          return; // Stop running if the bot physically can't mute them
        }
        await member.timeout(timeoutDuration, reason);
      } catch (err) {
        console.error(`❌ Failed to timeout user ${member.user.tag}:`, err);
        return;
      }

      // 3. Send warning to the chat channel
      const warningEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚠️ Unauthorized Advertising Detected')
        .setDescription(`${message.author}, server recruitment or posting invite links is strictly prohibited here. You have been **muted for 24 hours**.`);
      
      const warningMsg = await message.channel.send({ embeds: [warningEmbed] }).catch(() => null);
      if (warningMsg) setTimeout(() => warningMsg.delete().catch(() => null), 10000);

      // 4. Log the infraction to bot-logs with an UNMUTE BUTTON
      try {
        const logChannel = await client.channels.fetch(BOT_LOGS_CHANNEL_ID).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          
          const logEmbed = new EmbedBuilder()
            .setColor('#a04be0')
            .setTitle('🛡️ Security Log: Invite Link Filter Triggered')
            .addFields(
              { name: 'User Tag', value: `${member.user.tag}`, inline: true },
              { name: 'User ID', value: `\`${member.id}\``, inline: true },
              { name: 'Channel Location', value: `<#${message.channel.id}>`, inline: true },
              { name: 'Intercepted Link', value: `\`\`\`${message.content}\`\`\`` },
              { name: 'Action Taken', value: '🤐 **Muted / Timed Out for 24 Hours**', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Anti-Recruitment System', iconURL: client.user.displayAvatarURL() });

          // Create the interactive Green Unmute Button attaching the Target User's ID to it dynamically
          const unmuteButton = new ButtonBuilder()
            .setCustomId(`unmute_${member.id}`)
            .setLabel('🔊 Unmute User')
            .setStyle(ButtonStyle.Success);

          const row = new ActionRowBuilder().addComponents(unmuteButton);

          await logChannel.send({ embeds: [logEmbed], components: [row] });
        }
      } catch (err) {
        console.error('❌ Failed to log incident to bot-logs:', err);
      }
    }
  });
};