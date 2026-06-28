const { EmbedBuilder } = require('discord.js');

module.exports = async (client) => {
  const IMPORTANT_CHANNEL_ID = '1513461879962599464';

  try {
    const channel = await client.channels.fetch(IMPORTANT_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error('❌ Could not find the important text channel or bot lacks access.');
      return;
    }

    // 1. FETCH CHANNEL HISTORY TO CHECK FOR THE EMBED TITLE
    const recentMessages = await channel.messages.fetch({ limit: 25 }).catch(() => null);
    
    if (recentMessages) {
      const alreadySent = recentMessages.some(
        (msg) => msg.author.id === client.user.id && msg.embeds.length > 0 && msg.embeds[0].title === '雷文 SHOP'
      );

      // 2. ANTI-RESEND TRIGGER: If found, stop completely!
      if (alreadySent) {
        console.log('ℹ️ Important Shop Guide layout is already posted. Skipping duplicate send.');
        return;
      }
    }

    console.log('🔄 No duplicate found. Posting the clean shop guide embed...');

    const shopEmbed = new EmbedBuilder()
      .setColor('#5865F2') 
      .setTitle('雷文 SHOP')
      .setDescription(
        "is a lifesaver for broke gamers who love Steam titles but can't afford the steep " +
        "price tags, giving them a way to *play cracked versions of their favorite games* for " +
        "just a fraction of the cost.\n\n" +
        "Look, we all know how frustrating it is when a new game drops on Steam and it " +
        "costs more than your weekly budget. That’s exactly why Lei Wen Shop exists—to " +
        "help out people who genuinely love gaming but just don't have the cash to burn " +
        "right now. They pull together cracked, fully playable Steam titles and offer them " +
        "at deep, pocket-friendly discounts, giving you a straightforward way to jump into " +
        "the action without breaking the bank or missing out on the games everyone else is " +
        "playing.\n\n" +
        "You can find these games as always on the <#1514243424696406106>\n\n" +
        "## **S1MPLE STEPS**\n\n" +
        "• Go to this channel first <#1514243424696406106>\n" +
        "• Then, type `/search`\n" +
        "• Get the code the one you want to play\n" +
        "• Next click the website below to get the manifest files or go to this channel <#1514509406224777288>\n" +
        "• Download them, and then you can play right away!\n\n" +
        "**ENJOY AND PLAY AS YOU WANT!!**"
      );

    await channel.send({ embeds: [shopEmbed] });
    console.log('🚀 SUCCESS: Shop Guide layout sent safely!');

  } catch (error) {
    console.error('❌ Error sending layout inside important.js:', error);
  }
};