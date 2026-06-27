const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ticketsystem',
  async executeCommand(interaction) {
    // 🎯 Target panel deployment channel
    const PANEL_CHANNEL_ID = '1520312813678104626';

    if (interaction.channelId !== PANEL_CHANNEL_ID) {
      return interaction.reply({ content: `❌ You can only deploy this panel inside <#${PANEL_CHANNEL_ID}>.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🏰 Imperial Middleman Services')
      .setColor('#a04be0')
      .setDescription(
        'Need a trusted safe transaction? Select your preferred service tier below to open a secure room. ' +
        'Only official trusted **Vanguard Lords (100+ Vouches)** will be summoned to assist you.\n\n' +
        '💎 **PAID SERVICE TIER (5% Fee)**\n' +
        'Our staff team handles your transaction with maximum speed priority.\n\n' +
        '💝 **DONATION TIER (Pay Anything You Can)**\n' +
        'No platform entry costs! Tip or donate any amount you see fit at the end of the trade if you love our safety service.'
      )
      .setFooter({ text: 'Ensure you verify the middleman’s profile rank before proceeding.' });

    // 🌟 Two interactive tracking buttons for Paid Priority vs Donation Tier
    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_mm_paid').setLabel('Request Paid (Fast)').setEmoji('💎').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('open_mm_donate').setLabel('Donate Tier (Any Amount)').setEmoji('💝').setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ content: 'Panel deployed.', embeds: [embed], components: [buttonsRow] });
  },

  async handleButton(interaction) {
    const OFFICIAL_MM_ROLE_ID = '1520310648582443089';

    if (interaction.customId === 'open_mm_paid' || interaction.customId === 'open_mm_donate') {
      await interaction.deferReply({ ephemeral: true });

      const isPaid = interaction.customId === 'open_mm_paid';
      
      // Categorizes text channels cleanly based on user priority selection 
      const channelName = isPaid 
        ? `💸-paid-${interaction.user.username}` 
        : `💝-donate-${interaction.user.username}`;

      const channel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: interaction.channel.parentId, 
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: OFFICIAL_MM_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(isPaid ? '💎 Imperial Priority Session' : '💝 Imperial Donation Session')
        .setColor(isPaid ? '#a04be0' : '#ffb6c1')
        .setDescription(
          `Welcome ${interaction.user}. A private session has been established.\n\n` +
          `**Selected Service:** ${isPaid ? '`💎 PAID TIER (Fast Lane)`' : '`💝 DONATION TIER (Pay What You Can)`'}\n\n` +
          `Summoning <@&${OFFICIAL_MM_ROLE_ID}> to oversee this trade. Please state your terms, values, items, and participating handles while waiting.`
        );

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