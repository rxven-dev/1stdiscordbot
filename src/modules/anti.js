const { EmbedBuilder } = require('discord.js');

module.exports = async (client) => {
  const HONEYPOT_CHANNEL_ID = '1514259569449373706'; // The trap channel
  const GEN_CHAT_CHANNEL_ID = '1509852289790382080'; // Your general chat
  const BOT_LOGS_CHANNEL_ID = '1514251673219108966'; // Your bot logs channel
  const SEARCH_CHANNEL_ID = '1514243424696406106';   // Your /search command channel

  // 1. AUTOMATICALLY SEND THE WARNING EMBED ON STARTUP
  try {
    const channel = await client.channels.fetch(HONEYPOT_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      const messages = await channel.messages.fetch({ limit: 10 });
      const alreadyHasEmbed = messages.some(msg => msg.author.id === client.user.id && msg.embeds.length > 0);

      if (!alreadyHasEmbed) {
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('☢️ DO NOT SEND MESSAGES IN THIS CHANNEL')
          .setDescription(
            `This channel is used to catch spam bots, when people get hacked, their account ` +
            `9/10 times sends scam images that either try to steal money, or hack others, the ` +
            `bot bans. **Any messages sent here will result in an immediate automatic kick/softban.**\n\n` +
            `If you are looking to chat with members, please head over to <#${GEN_CHAT_CHANNEL_ID}>!`
          );

        await channel.send({ embeds: [embed] });
        console.log('✅ Honeypot warning embed automatically posted.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to check/send the honeypot embed:', error);
  }

  // 2. AUTOMATICALLY DETECT, SOFTBAN, AND LOG SPAMMERS + CLEAN UNNECESSARY CHAT
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- FEATURE A: HONEYPOT AUTO-BAN SYSTEM ---
    if (message.channel.id === HONEYPOT_CHANNEL_ID) {
      const member = message.member;
      if (!member) return;

      if (!message.guild.members.me.permissions.has('BanMembers')) {
        console.error("⚠️ The bot is missing 'Ban Members' permissions.");
        return;
      }

      if (!member.bannable) {
        console.log(`⚠️ Could not ban ${member.user.tag} (Higher role/Server Owner).`);
        return;
      }

      const contentSnippet = message.content || '*[No text content]*';
      const hasAttachments = message.attachments.size > 0 ? `🖼️ Sent ${message.attachments.size} attachment(s)` : 'None';

      try {
        await message.delete().catch(() => null);

        await message.guild.members.ban(member.id, {
          deleteMessageSeconds: 7 * 24 * 60 * 60,
          reason: 'Automated HoneyPot Trigger: Hacked account/Spam bot activity detected.'
        });

        await message.guild.members.unban(member.id, 'Softban cleanup complete.');
        console.log(`🛑 Softbanned and cleared messages for ${member.user.tag}`);

        const logChannel = await client.channels.fetch(BOT_LOGS_CHANNEL_ID).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🛡️ Automated Security Action: User Softbanned')
            .setTimestamp()
            .addFields(
              { name: 'User Tag', value: `${member.user.tag}`, inline: true },
              { name: 'User ID', value: `\`${member.id}\``, inline: true },
              { name: 'Trigger Location', value: `<#${HONEYPOT_CHANNEL_ID}>`, inline: true },
              { name: 'Message Content', value: contentSnippet.slice(0, 1024) },
              { name: 'Media/Photos', value: hasAttachments, inline: true },
              { name: 'Action Taken', value: '🔴 Softbanned (Banned & Unbanned to clear recent spam)', inline: true }
            )
            .setFooter({ text: 'Anti-Spam Security System', iconURL: client.user.displayAvatarURL() });

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error(`Failed to process action for ${member.user.tag}:`, error);
      }
      return;
    }

    // --- FEATURE B: CLEANING UNNECESSARY CHAT IN SEARCH CHANNEL ---
    if (message.channel.id === SEARCH_CHANNEL_ID) {
      // If a user sends normal text inside the search command channel, wipe it
      try {
        await message.delete().catch(() => null);
        
        // Send a temporary reply warning them to use general chat instead
        const warningMessage = await message.channel.send(
          `⚠️ ${message.author}, casual chatting is not allowed in this channel. Please use commands only! If you want to chat, head over to <#${GEN_CHAT_CHANNEL_ID}>.`
        );

        // Delete the warning message automatically after 5 seconds to keep the channel clean
        setTimeout(() => {
          warningMessage.delete().catch(() => null);
        }, 5000);

      } catch (error) {
        console.error('❌ Failed to clean up text in search channel:', error);
      }
    }
  });
};