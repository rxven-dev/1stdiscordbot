module.exports = async (client) => {
  client.on('messageCreate', async (msg) => {
    // 1. Ignore if: Author is bot or message starts with /
    if (msg.author.bot || msg.content.startsWith('/')) return;

    // 2. Define standard restricted channels (No chat, use designated command only)
    const restrictedChannels = {
      '1514243424696406106': 'Please use **/search** for this channel. If you want to chat, go here: <#1509852289790382080>',
      '1414094908897099886': 'Please use **/vouch** or **/scam** to formalize reputations here. Casual chat is not allowed.',
      '1520312703472631838': 'Please use **/profile** inside this channel. Casual chat is not allowed here.',
      '1520312909488459838': 'Please use **/tax** inside this ledger channel. Casual chat is not allowed here.',
      '1520312877343445114': 'Please use **/mmstatus** inside this channel. Casual chat is not allowed here.'
    };

    // 3. Handle restricted command-only channels
    if (restrictedChannels[msg.channelId]) {
      msg.delete().catch(() => {});
      const warn = await msg.channel.send(`${msg.author}, ${restrictedChannels[msg.channelId]}`);
      setTimeout(() => warn.delete().catch(() => {}), 5000);
      return;
    }

    // 4. Handle Media-Only channel
    if (msg.channelId === '1509847844641706024') {
      const hasMedia = msg.attachments.size > 0 || msg.embeds.length > 0 || msg.content.includes('http://') || msg.content.includes('https://');
      if (!hasMedia) {
        msg.delete().catch(() => {});
        const warn = await msg.channel.send(`${msg.author}, This channel is strictly reserved for media attachments and links only!`);
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        return;
      }
    }
  });
};