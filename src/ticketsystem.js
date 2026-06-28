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
        '💝 **DONATION TIER (Pay Any Amount)**\n' +
        'Available for all members. Middleman processing speeds depend on queue workload volume.'
      )
      .setFooter({ text: 'Imperial Security Matrix System Protocols' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_paid_ticket').setLabel('Request Paid Service').setEmoji('💎').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('open_free_ticket').setLabel('Request Donation Service').setEmoji('💝').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ content: '✅ Middleman panel deployed successfully.', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },

  async handleInteraction(interaction) {
    const OFFICIAL_MM_ROLE_ID = '1326445582310113292';

    // --- 1. HANDLE TIER MODAL CREATION POPUPS ---
    if (interaction.customId === 'open_paid_ticket' || interaction.customId === 'open_free_ticket') {
      const isPaid = interaction.customId === 'open_paid_ticket';
      const modal = new ModalBuilder()
        .setCustomId(isPaid ? 'modal_paid_ticket' : 'modal_free_ticket')
        .setTitle(isPaid ? '💎 Priority Session Setup' : '💝 Donation Session Setup');

      const itemInput = new TextInputBuilder()
        .setCustomId('tx_details')
        .setLabel('📝 What is the transaction?')
        .setPlaceholder('e.g., Trading Roblox Limited Adurite for $50 Crypto LTC')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const amountInput = new TextInputBuilder()
        .setCustomId('tx_amount')
        .setLabel('💰 How much is the transaction?')
        .setPlaceholder('e.g., $50.00 USD')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const partnerInput = new TextInputBuilder()
        .setCustomId('tx_partner')
        .setLabel('👥 Whom are you dealing with?')
        .setPlaceholder('e.g., Discord Username / User ID')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(itemInput),
        new ActionRowBuilder().addComponents(amountInput),
        new ActionRowBuilder().addComponents(partnerInput)
      );

      return await interaction.showModal(modal);
    }

    // --- 2. HANDLE MODAL SUBMISSIONS & CREATION ---
    if (interaction.isModalSubmit() && (interaction.customId === 'modal_paid_ticket' || interaction.customId === 'modal_free_ticket')) {
      await interaction.deferReply({ ephemeral: true });
      const isPaid = interaction.customId === 'modal_paid_ticket';

      const txDetails = interaction.fields.getTextInputValue('tx_details');
      const txAmount = interaction.fields.getTextInputValue('tx_amount');
      const txPartner = interaction.fields.getTextInputValue('tx_partner');

      const guild = interaction.guild;
      const channel = await guild.channels.create({
        name: `${isPaid ? '💎┃priority' : '💝┃donation'}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: OFFICIAL_MM_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(isPaid ? '💎 Imperial Priority Session' : '💝 Imperial Donation Session')
        .setColor(isPaid ? '#a04be0' : '#ffb6c1')
        .setDescription(`Welcome ${interaction.user}. A private secure session has been established.\n\n**Selected Tier:** ${isPaid ? '`💎 PAID TIER (Fast Speed)`' : '`💝 DONATION TIER (Pay Any Amount)`'}`)
        .addFields(
          { name: '📝 What is the transaction?', value: `\`\`\`${txDetails}\`\`\`` },
          { name: '💰 How much is the transaction?', value: `\`${txAmount}\``, inline: true },
          { name: '👥 Whom are you dealing with?', value: `${txPartner}`, inline: true }
        );

      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_mm_ticket').setLabel('Claim Ticket').setEmoji('⚔️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('close_mm_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@&${OFFICIAL_MM_ROLE_ID}> | ${interaction.user} requested an agent!`, embeds: [welcomeEmbed], components: [controlRow] });
      return await interaction.editReply({ content: `🏰 Ticket established successfully! Proceed to: ${channel}` });
    }

    // --- 3. CLAIM SERVICE TICKETS ---
    if (interaction.customId === 'claim_mm_ticket') {
      if (!interaction.member.roles.cache.has(OFFICIAL_MM_ROLE_ID)) {
        return interaction.reply({ content: '❌ Access Denied: Only certified Middlemen can claim operations.', ephemeral: true });
      }

      await interaction.deferUpdate();

      const finishedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`complete_mm_${interaction.user.id}`).setLabel('Complete Trade').setEmoji('🔒').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('close_mm_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
      );

      await interaction.channel.permissionOverwrites.set([
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: OFFICIAL_MM_ROLE_ID, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.guild.roles.cache.find(r => r.name === 'Support Staff')?.id || OFFICIAL_MM_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel] }
      ]);

      await interaction.channel.setName(`⚔️┃active-${interaction.user.username}`);
      return await interaction.message.edit({ components: [finishedRow] });
    }

    // --- 4. CLOSE SERVICE TICKETS ---
    if (interaction.customId === 'close_mm_ticket') {
      await interaction.reply({ content: '⚠️ Locking channel directory container...' });
      return setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }

    // --- 5. COMPLETE TRADE & SPAWN SYNCHRONIZED VOUCH BUTTON ---
    if (interaction.customId.startsWith('complete_mm_')) {
      const middlemanId = interaction.customId.split('complete_mm_')[1];

      if (interaction.user.id !== middlemanId) {
        return interaction.reply({ content: '❌ Access Denied: Only the assigned operator can close this operation.', ephemeral: true });
      }

      await interaction.deferUpdate();

      const finalRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vouch_btn_${middlemanId}`).setLabel('Click to Vouch Middleman').setEmoji('⭐').setStyle(ButtonStyle.Success)
      );

      await interaction.channel.send({
        content: '🎉 **Transaction Complete!** The session has concluded successfully.\n\nThank you for using Imperial Middleman Services. Clients, please click the button below to add a verified vouch score onto your middleman\'s standing profile card matrix!',
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

      // CRITICAL FIX: Instantly tell Discord we are processing, solving "Interaction Failed"
      await interaction.deferReply();

      // Read database dynamically from the absolute persistent cloud storage path
      let db = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};

      // Increment value on the production database object
      db[middlemanId] = (db[middlemanId] || 0) + 1;

      // Write update back to the exact persistent volume path immediately
      fs.writeFileSync(VOUCH_FILE, JSON.stringify(db, null, 2), 'utf8');

      // Edit our deferred reply with the absolute accurate live file total 
      return await interaction.editReply({
        content: `✅ **Vouch Recorded!** Added 1 vouch point to <@${middlemanId}>'s standing records matrix. (Total: **${db[middlemanId]}**)`
      });
    }
  }
};