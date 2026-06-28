module.exports = async (client) => {
  client.on('messageCreate', async (msg) => {
    // 1. Ignore if: Author is bot or message starts with /
    if (msg.author.bot || msg.content.startsWith('/')) return;

    // 2. Define standard restricted channels (No chat, use command)
    const restrictedChannels = {
      '1514243424696406106': 'Please use **/search** for this channel. If you want to chat, go here: <#1509852289790382080>',
      '1414094908897099886': 'Please use **/vouch** to formalize a reputation. Casual chat is not allowed here.'
    };

    // 3. Handle restricted command-only channels
    if (restrictedChannels[msg.channelId]) {
      msg.delete().catch(() => {});
      const warn = await msg.channel.send(`${msg.author}, ${restrictedChannels[msg.channelId]}`);
      setTimeout(() => warn.delete().catch(() => {}), 5000);
      return;
    }

    // 4. Handle Media-Only channel (1509847844641706024)
    if (msg.channelId === '1509847844641706024') {
      const hasMedia = msg.attachments.size > 0 || msg.embeds.length > 0 || msg.content.includes('http');
      
      if (!hasMedia) {
        msg.delete().catch(() => {});
        const warn = await msg.channel.send(`${msg.author}, This channel is for **media only** (pictures/videos).`);
        setTimeout(() => warn.delete().catch(() => {}), 5000);
      }
    }
  });
};
