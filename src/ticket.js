const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ticket',
  async handleInteraction(interaction) {
    const LOG_CHANNEL_ID = '1514251673219108966';

    if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
      await interaction.deferReply({ ephemeral: true });
      const fields = interaction.fields.getTextInputValue('ticket_reason');

      const ticketChannel = await interaction.guild.channels.create({
        name: `support-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      await ticketChannel.send({ embeds: [new EmbedBuilder().setTitle('Support Details').setDescription(fields).setColor('#2ECC71')] });
      await interaction.editReply({ content: `✅ Ticket opened: ${ticketChannel}` });

      const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
      if (logChannel) {
        const claimButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`claim_${ticketChannel.id}`).setLabel('Claim Ticket').setStyle(ButtonStyle.Primary).setEmoji('✋')
        );
        await logChannel.send({ 
          embeds: [new EmbedBuilder().setTitle('🎫 New Ticket').setDescription(`${fields}\n\n**Status:** Unclaimed`).setColor('#3498DB')],
          components: [claimButton] 
        });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('claim_')) {
      const channelId = interaction.customId.split('_')[1];
      const ticketChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);
      if (ticketChannel) {
        await ticketChannel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true });
        await interaction.reply({ content: `✅ You claimed ${ticketChannel}!`, ephemeral: true });
        
        const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(interaction.message.embeds[0].description.replace('Unclaimed', `Claimed by ${interaction.user}`));
        await interaction.message.edit({ embeds: [newEmbed], components: [] });
      }
    }
  }
};