const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  const WELCOME_CHANNEL_ID = '1414077018068221962'; // Your welcome channel ID

  client.on('guildMemberAdd', async (member) => {
    try {
      const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);
      if (!channel || !channel.isTextBased()) return;

      // Get the current server member count
      const memberCount = member.guild.memberCount;

      // Construct the welcome embed card based exactly on your screenshot layout
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#a04be0') // Blurple/Purple color strip matching your bot's layout
        .setTitle(`WELCOME TO 雷文 I 🛒!`)
        .setDescription(
          'say hi in <#1509852289790382080>!\n' + 
          'read the <#1413935679154552935>!\n' + 
          'server announces in <#1513461879962599464>!\n' + 
          'flex in <#1509847844641706024>!'
        )
        // Your updated heart-eyes anime GIF link
        .setImage('https://cdn.discordapp.com/attachments/1421728958046801996/1520300070602543224/d9a1f394ff5722a94549f92fa3abcf0e.gif?ex=6a40b146&is=6a3f5fc6&hm=8c9492d5ff0a9683a498b10862cbb884e98d467f76cc4c1062d9ed915847ebe3&')
        .setFooter({ text: `we now have ${memberCount} members! <3` });

      // Send the content greeting message outside the embed, along with the card
      await channel.send({
        content: `Welcome ${member}! 👏`,
        embeds: [welcomeEmbed]
      });

    } catch (error) {
      console.error('❌ Error executing welcome card handler:', error);
    }
  });
};