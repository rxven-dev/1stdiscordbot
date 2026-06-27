const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ticketsystem',
  async executeCommand(interaction) {
    const PANEL_CHANNEL_ID = '1520312813678104626';

    if (interaction.channelId !== PANEL_CHANNEL_ID) {
      return interaction.reply({ content: `❌ You can only deploy this panel inside <#${PANEL_CHANNEL_ID}>.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🏰 Imperial Middleman Services')
      .setColor('#a04be0')
      .setDescription('Need a trusted safe transaction? Click the button below to initiate a private middleman request session. Only official trusted **Vanguard Lords (100+ Vouches)** will be summoned to assist you.')
      .setFooter({ text: 'Ensure you verify the middleman’s profile rank before proceeding.' });

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_mm_ticket').setLabel('Request Middleman').setEmoji('🛡️').setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ content: 'Panel deployed.', embeds: [embed], components: [btn] });
  },

  async handleButton(interaction) {
    const OFFICIAL_MM_ROLE_ID = '1520310648582443089';

    if (interaction.customId === 'open_mm_ticket') {
      await interaction.deferReply({ ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: `🤝🏽-mm-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parentId, 
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: OFFICIAL_MM_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🛡️ Secure Session Established')
        .setColor('#a04be0')
        .setDescription(`Welcome ${interaction.user}. A private session has been logged. Summoning all active <@&${OFFICIAL_MM_ROLE_ID}> to oversee this transfer. Please state your terms, values, and participating party handles while waiting.`);

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_mm_ticket').setLabel('Close Session').setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@&${OFFICIAL_MM_ROLE_ID}>`, embeds: [welcomeEmbed], components: [closeBtn] });
      return interaction.editReply({ content: `Your session has opened cleanly at ${channel}` });
    }

    if (interaction.customId === 'close_mm_ticket') {
      await interaction.reply({ content: 'Locking and purging channel walls in 5 seconds...' });
      setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
    }
  }
};