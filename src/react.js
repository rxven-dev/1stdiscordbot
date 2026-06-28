module.exports = async (client) => {
  const targetChannelId = '1509847844641706024';

  client.on('messageCreate', async (msg) => {
    // Only react in the specified channel
    if (msg.channelId !== targetChannelId || msg.author.bot) return;

    try {
      await msg.react('✅');
      await msg.react('❎');
    } catch (err) {
      console.error('❌ Could not add reactions:', err);
    }
  });
};