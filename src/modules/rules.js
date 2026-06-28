const { EmbedBuilder } = require('discord.js');

module.exports = async (client) => {
  const TARGET_CHANNEL_ID = '1413935679154552935';

  try {
    const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error('❌ Could not find the rules text channel or bot lacks access.');
      return;
    }

    // 1. FETCH CHANNEL HISTORY TO PREVENT DUPLICATION RESENDS
    // This part inside rules.js stops it from duplicating:
    const recentMessages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    if (recentMessages) {
      const alreadySent = recentMessages.some(
        (msg) => msg.author.id === client.user.id && msg.embeds.length > 0 && msg.embeds[0].title === '📜 SERVER RULES'
      );
      if (alreadySent) {
        console.log('ℹ️ Server Rules are already posted. Skipping duplicate send.');
        return;
      }
    }

    console.log('🔄 Posting the clean server rules embed layout...');

    // 3. BUILD THE SERIOUS RED RULES EMBED CARD
    const embedRules = new EmbedBuilder()
      .setTitle('📜 SERVER RULES')
      .setColor('#a04be0') // Vibrant blue color for a rules channel
      .setDescription('Welcome to the server! To ensure a fun, safe, and welcoming environment for everyone, please read and follow our community guidelines closely.')
      .addFields(
        { 
          name: '👑 1. Treat Everyone with Respect', 
          value: 'Bullying, hate speech, insults, discrimination, or general toxicity will absolutely not be tolerated. Keep the environment friendly and constructive.' 
        },
        { 
          name: '🚫 2. No Spam or Self-Promotion', 
          value: 'Avoid flooding the chat with repetitive messages. Do not drop links to external websites, streams, or other Discord servers unless an admin has explicitly permitted it.' 
        },
        { 
          name: '📁 3. Use Channels Properly', 
          value: 'Keep the server clean by organizing your content. Post questions, memes, bot commands, and casual talk in their designated channels.' 
        },
        { 
          name: '⚖️ 4. Keep it Clean and Legal', 
          value: 'Absolutely no NSFW (Not Safe For Work), piracy, malicious files, or illegal content is allowed on this server.' 
        },
        { 
          name: '⚠️ 5. No Unauthorized Trading or Scamming', 
          value: 'Do not buy, sell, or trade accounts/services outside of our official server channels. Any sketchy behavior or scam attempts will result in an immediate, permanent ban.' 
        },
        { 
          name: '🛡️ 6. See Something? Say Something', 
          value: 'If you notice suspicious behavior, a compromised account, or someone breaking the rules, please notify or tag a moderator/admin immediately or report it through this <#1414103053807780042>' 
        },
        { 
          name: '💬 7. Keep Drama in the DMs', 
          value: 'If you have a personal dispute with another member, resolve it privately or open a staff support ticket. Keep public chats free from unnecessary arguments.' 
        },
        { 
          name: '🛠️ 8. Follow Staff Instructions', 
          value: 'The moderation and admin teams are here to keep things running smoothly. Please follow their instructions. Violations will result in warnings, temporary mutes, or permanent bans depending on the severity.' 
        }
      )
      .setFooter({ text: 'Thank you for keeping our community safe and enjoyable!', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    // 4. SEND TO DISCORD
    await channel.send({ embeds: [embedRules] });
    console.log('🚀 SUCCESS: Server Rules layout sent successfully!');

  } catch (error) {
    console.error('❌ Error executing rules module inside rules.js:', error);
  }
};