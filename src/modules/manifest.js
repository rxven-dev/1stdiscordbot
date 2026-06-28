const { EmbedBuilder } = require('discord.js');

module.exports = async (client) => {
  const TRACKER_CHANNEL_ID = '1514509406224777288'; // Your target channel

  try {
    const channel = await client.channels.fetch(TRACKER_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error('❌ Could not find the text channel or bot lacks access.');
      return;
    }

    // 1. FETCH RECENT MESSAGES TO CHECK FOR DUPLICATES
    const recentMessages = await channel.messages.fetch({ limit: 10 });
    
    // Checks if the bot already has an embed message tracking this website
    const alreadySent = recentMessages.some(
      (msg) => msg.author.id === client.user.id && msg.embeds.length > 0 && msg.embeds[0].title.includes('Website Manifest Generator')
    );

    // 2. IF IT ALREADY SENT IT, STOP RUNNING SO IT DOES NOT DUPLICATE
    if (alreadySent) {
      console.log('ℹ️ Manifest dashboard is already posted in Discord. Skipping duplicate send.');
      return;
    }

    // 3. IF NO EMBED EXISTS, GENERATE AND SEND IT
    const masterEmbed = new EmbedBuilder()
      .setColor('#a04be0') // Purple accent color matching DepotBox theme
      .setTitle('⚙️ Website Manifest Generator - Updated File')
      .setURL('https://depotbox.org/')
      
      // Part 1: Main Status Update and Lists Data Layout
      .setDescription(
        'A new updated manifest file has been processed and generated successfully. ' +
        'The updated configuration has been pushed to the main branch repository.\n\n' +
        '### 🔥 Popular Depots (Last 30 Days)\n' +
        '**#1** `The Last of Us™ Part I` \n' +
        '> AppID: 1888930 (328 downloads)\n\n' +
        '**#2** `Grand Theft Auto V Enhanced` \n' +
        '> AppID: 3240220 (305 downloads)\n\n' +
        '**#3** `Forza Horizon 6` \n' +
        '> AppID: 2483190 (280 downloads)\n\n' +
        '---\n' +
        '### 📈 Trending Lists\n' +
        '🔹 **AAA Games!!**\n' +
        '└ *by ZyOoD* — 💜 72 | 📥 1571\n\n' +
        '🔹 **DepotBox Official List**\n' +
        '└ *by thomasalvenin* — 💜 1076 | 📥 897\n\n' +
        '🔹 **2D / 3D Platformer Games**\n' +
        '└ *by PenguinCore* — 💜 26 | 📥 371\n\n' +
        '--------------------------------------------------------------------'
      )
      
      // Part 2: The Grid Fields Layout from the first design
      .addFields(
        { name: '🌐 Website', value: '`DEPOT.ORG`', inline: true },
        { name: '🔧 Type', value: 'Manifest Update', inline: true },
        { name: '🧑‍💻 Developer', value: 'DepotBox System', inline: true },
        
        { name: '📅 Update Date', value: 'Jun 11, 2026', inline: true },
        { name: '⚡ Status', value: '🟢 Active 24hrs', inline: true },
        
        { name: '📡 Manifest Source', value: 'DepotBox Generator Engine', inline: false },
        { name: '🔗 Link👇', value: '[Website](https://depotbox.org/)', inline: false }
      )
      
      .setImage('https://cdn.mos.cms.futurecdn.net/caJZ5WQ8HTfYqMdUdyPCu8.jpg')
      .setFooter({ 
        text: `Automated Log Tracker • System made by centric._. • v2.0.1`, 
        iconURL: client.user.displayAvatarURL() 
      })
      .setTimestamp();

    await channel.send({ embeds: [masterEmbed] });
    console.log('🚀 Combined Master Manifest layout sent successfully!');

  } catch (error) {
    console.error('❌ Error sending layout inside manifest.js:', error);
  }
};