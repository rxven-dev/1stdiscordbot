const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Directly check if Railway's volume folder exists physically on the server
const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();
const VOUCH_FILE = path.join(dataDir, 'vouches.json');

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
      .setDescription(
        'Need a trusted safe transaction? Select your preferred service tier below to open a secure room. ' +
        'Only official trusted **Vanguard Lords (100+ Vouches)** will be summoned to assist you.\n\n' +
        '💎 **PAID SERVICE TIER (5% Fee)**\n' +
        'Our staff team handles your transaction with maximum speed priority.\n\n' +
        '💝 **DONATION TIER (Free / Optional)**\n' +
        'Free automated room allocation. Tips/donations to middlemen are highly appreciated!'
      )
      .setFooter({ text: 'Imperial Security Network Protocol', iconURL: interaction.guild.iconURL() });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_paid').setLabel('💎 Paid Service (5%)').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_free').setLabel('💝 Donation Tier').setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ content: 'Deploying service panel hub...', ephemeral: true });
    return await interaction.channel.send({ embeds: [embed], components: [row] });
  },

  async handleInteraction(interaction) {
    // --- 1. HANDLE MAIN INITIAL BUTTON CLICKS FROM USERS ---
    if (interaction.customId === 'ticket_paid' || interaction.customId === 'ticket_free') {
      // 🟢 CRITICAL FIXED LINE: Tell Discord we are working IMMEDIATELY to prevent "Interaction Failed"
      await interaction.deferReply({ ephemeral: true });

      const ticketType = interaction.customId === 'ticket_paid' ? 'paid' : 'free';
      const staffRoleId = '1520312604856029255';
      
      // Assemble core system permissions dynamically
      const overwrites = [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ];

      // Failsafe validation for Staff Role
      if (interaction.guild.roles.cache.has(staffRoleId)) {
        overwrites.push({
          id: staffRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        });
      } else {
        console.warn(`⚠️ Ticket System Warn: Role ID ${staffRoleId} not found in guild cache.`);
      }

      try {
        const ticketChannel = await interaction.guild.channels.create({
          name: `🎫-${ticketType}-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: '1520312527274115164',
          permissionOverwrites: overwrites
        });

        const ticketEmbed = new EmbedBuilder()
          .setColor('#a04be0')
          .setTitle(`🏰 Imperial Support Room — ${ticketType.toUpperCase()}`)
          .setDescription(`Greetings ${interaction.user}, welcome to your service room. Staff will be with you shortly.\n\nClick the button below once your deal is ready to call an available Middleman.`);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`call_mm_${ticketType}`).setLabel('🤝 Summon Middleman').setStyle(ButtonStyle.Primary)
        );

        await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });
        return await interaction.editReply({ content: `✅ Your ticket room has been initialized successfully: ${ticketChannel}` });
      } catch (err) {
        console.error('❌ Failed creating ticket channel:', err);
        return await interaction.editReply({ content: `❌ System permission or channel creation error. Please ensure Category ID \`1520312527274115164\` exists.` });
      }
    }

    // --- 2. HANDLE MIDDLEMAN SUMMON BUTTONS ---
    if (interaction.customId === 'call_mm_paid' || interaction.customId === 'call_mm_free') {
      const isPaid = interaction.customId === 'call_mm_paid';
      
      const modal = new ModalBuilder()
        .setCustomId(isPaid ? 'modal_mm_paid' : 'modal_mm_free')
        .setTitle('Imperial Transaction Registry');

      const dealInput = new TextInputBuilder()
        .setCustomId('deal_details')
        .setLabel('WHAT ARE YOU TRADING?')
        .setPlaceholder('Example: Selling Steam Account for $50 Crypto')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const user2Input = new TextInputBuilder()
        .setCustomId('other_user')
        .setLabel('OTHER PARTY DISCORD USERNAME / ID')
        .setPlaceholder('Example: rxven_dev')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(dealInput),
        new ActionRowBuilder().addComponents(user2Input)
      );

      // Note: Modals handle their own instant acknowledgment, do not defer before showing them!
      return await interaction.showModal(modal);
    }

    // --- 3. HANDLE REGISTRY MODAL SUBMISSIONS ---
    if (interaction.customId === 'modal_mm_paid' || interaction.customId === 'modal_mm_free') {
      await interaction.deferReply();
      
      const isPaid = interaction.customId === 'modal_mm_paid';
      const dealDetails = interaction.fields.getTextInputValue('deal_details');
      const otherUser = interaction.fields.getTextInputValue('other_user');

      const summonEmbed = new EmbedBuilder()
        .setColor(isPaid ? '#00e5ff' : '#00ff66')
        .setTitle(`📌 Pending Middleman Request [${isPaid ? 'PAID TIER' : 'DONATION'}]`)
        .setDescription(`**Client:** ${interaction.user}\n**Counterparty:** \`${otherUser}\``)
        .addFields({ name: '📝 Deal Metrics Description', value: dealDetails, inline: false })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`claim_ticket`).setLabel('🛡️ Claim Session').setStyle(ButtonStyle.Success)
      );

      await interaction.channel.send({ content: `<@&1520312604856029255> **New Trade Room Awaiting Claim!**`, embeds: [summonEmbed], components: [actionRow] });
      return await interaction.deleteReply();
    }

    // --- 4. HANDLE MIDDLEMAN TICKET CLAIM BUTTONS ---
    if (interaction.customId === 'claim_ticket') {
      const staffRoleId = '1520312604856029255';
      
      if (!interaction.member.roles.cache.has(staffRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Access Denied: Only certified Middleman operators can claim this queue entry.', ephemeral: true });
      }

      await interaction.deferReply();

      await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      const claimedEmbed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('🛡️ Session Security Claimed')
        .setDescription(`Your Middleman helper for this session will be ${interaction.user}.\n\nBoth parties must transfer asset keys inside this terminal only under direct supervision.`);

      const completeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`complete_trade_${interaction.user.id}`).setLabel('✅ Complete & Generate Vouch Option').setStyle(ButtonStyle.Danger)
      );

      await interaction.channel.send({ embeds: [claimedEmbed], components: [completeRow] });
      return await interaction.deleteReply();
    }

    // --- 5. HANDLE SESSION CLOSE AND VOUCH FORM GENERATION ---
    if (interaction.customId.startsWith('complete_trade_')) {
      const middlemanId = interaction.customId.split('complete_trade_')[1];

      if (interaction.user.id !== middlemanId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Only the assigned middleman can click this action.', ephemeral: true });
      }

      const finalRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vouch_btn_${middlemanId}`).setLabel('🏆 Leave Vouch Score').setStyle(ButtonStyle.Success)
      );

      await interaction.channel.send({
        content: '🎉 **Transaction Finished!** Click the green voucher button below to add a verified vouch score onto your middleman\'s standing profile card matrix!',
        components: [finalRow]
      });

      return await interaction.message.edit({ components: [] });
    }

    // --- 6. HANDLE THE VOUCH BUTTON OPERATION AND LIVE DATABASE WRITE ---
    if (interaction.customId.startsWith('vouch_btn_')) {
      const middlemanId = interaction.customId.split('vouch_btn_')[1];

      if (interaction.user.id === middlemanId) {
        return interaction.reply({ content: '❌ Security Exception: Operators cannot vouch for their own matrix files.', ephemeral: true });
      }

      await interaction.deferReply();

      let db = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};
      db[middlemanId] = (db[middlemanId] || 0) + 1;
      fs.writeFileSync(VOUCH_FILE, JSON.stringify(db, null, 2), 'utf8');

      return await interaction.editReply({
        content: `✅ **Vouch Recorded!** Added 1 vouch point to <@${middlemanId}>. They now have \`${db[middlemanId]}\` total valid entries inside core database records!`
      });
    }
  }
};