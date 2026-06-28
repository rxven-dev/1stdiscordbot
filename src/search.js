const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for a game on Steam to get its AppID and information')
    .addStringOption(option =>
      option.setName('game')
        .setDescription('The name of the game you want to search for (e.g., gtav)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ALLOWED_CHANNEL_ID = '1514243424696406106'; // Your dedicated search channel
    const GEN_CHAT_CHANNEL_ID = '1509852289790382080'; // General chat channel

    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
      return await interaction.reply({
        content: `❌ This command can only be used in <#${ALLOWED_CHANNEL_ID}>. If you just want to talk, please head over to <#${GEN_CHAT_CHANNEL_ID}>!`,
        ephemeral: true
      });
    }

    const query = interaction.options.getString('game');
    await interaction.deferReply();

    try {
      const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`);
      const data = await response.json();

      if (!data || !data.items || data.items.length === 0) {
        return await interaction.editReply(`❌ Could not find any games matching "**${query}**" on Steam.`);
      }

      const game = data.items[0];
      const appId = game.id;
      const gameName = game.name;
      
      // CONVERT TINY IMAGE TO THE FULL HIGH-RES STEAM BANNER PICTURE DIRECTLY
      const largeBannerImg = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
      
      let priceInfo = 'Free / Unpriced';
      if (game.price) {
        const initialPrice = (game.price.initial / 100).toFixed(2);
        const finalPrice = (game.price.final / 100).toFixed(2);
        priceInfo = game.price.discount_percent > 0 
          ? `~~$${initialPrice}~~ **$${finalPrice}** (-${game.price.discount_percent}%)`
          : `**$${finalPrice}**`;
      }

      const platforms = [];
      if (game.platforms?.windows) platforms.push('💻 Windows');
      if (game.platforms?.mac) platforms.push('🍏 macOS');
      if (game.platforms?.linux) platforms.push('🐧 Linux');
      const platformString = platforms.length > 0 ? platforms.join(', ') : 'Unknown';

      const searchEmbed = new EmbedBuilder()
        .setColor('#a04be0') // Updated your embed strip color!
        .setTitle(`🎮 ${gameName}`)
        .setURL(`https://store.steampowered.com/app/${appId}`)
        .setDescription(`Use only this channel to search for games by their AppID by using "/search".`)
        
        // Puts the full high-res game art directly into the large image banner section
        .setImage(largeBannerImg)
        
        .addFields(
          { name: '🆔 AppID / UID', value: `\`${appId}\``, inline: true },
          { name: '💰 Price', value: priceInfo, inline: true },
          { name: '⚙️ Platforms', value: platformString, inline: true },
          { name: '🔗 Quick Links', value: `[Go to DepotBox to get the manifest file and play the games](https://depotbox.org/) • [SteamDB Link](https://steamdb.info/app/${appId})`, inline: false }
        )
        .setFooter({ text: `Search request processed for ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.editReply({ embeds: [searchEmbed] });

    } catch (error) {
      console.error('❌ Error executing Steam search lookup command:', error);
      await interaction.editReply('❌ An error occurred while communicating with Steam systems.');
    }
  }
};