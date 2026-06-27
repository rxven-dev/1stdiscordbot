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
        '💝 **DONATION TIER (Pay Anything You Can)**\n' +
        'No platform entry costs! Tip or donate any amount you see fit at the end of the trade if you love our safety service.'
      )
      .setFooter({ text: 'Ensure you verify the middleman’s profile rank before proceeding.' });

    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_mm_paid').setLabel('Request Paid (Fast)').setEmoji('💎').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('open_mm_donate').setLabel('Donate Tier (Any Amount)').setEmoji('💝').setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ content: 'Panel deployed.', embeds: [embed], components: [buttonsRow] });
  },

  async handleButton(interaction) {
    const EXCLUSIVE_STAFF_ROLES = [
      '1520310648582443089', // Vanguard Lord
      '1520310652021899415', // Immortal Legend
      '1414079432741617724', // Lord Commander
      '1414079646256857128'  // High Chancellor
    ];

    if (interaction.customId === 'open_mm_paid' || interaction.customId === 'open_mm_donate') {
      const isPaid = interaction.customId === 'open_mm_paid';
      
      const modal = new ModalBuilder()
        .setCustomId(isPaid ? 'mm_form_paid' : 'mm_form_donate')
        .setTitle('Please answer the question below.');

      const txInput = new TextInputBuilder()
        .setCustomId('tx_details')
        .setLabel('What is the transaction? *')
        .setPlaceholder('Type your details here...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const amountInput = new TextInputBuilder()
        .setCustomId('tx_amount')
        .setLabel('How much is the transaction? *')
        .setPlaceholder('Type your value/amount here...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const partnerInput = new TextInputBuilder()
        .setCustomId('tx_partner')
        .setLabel('Whom are you dealing with? *')
        .setPlaceholder('put here the user id or username of the user you are dealing')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(txInput),
        new ActionRowBuilder().addComponents(amountInput),
        new ActionRowBuilder().addComponents(partnerInput)
      );

      return await interaction.showModal(modal);
    }

    if (interaction.customId === 'claim_mm_ticket') {
      const hasPermission = interaction.member.roles.cache.some(r => EXCLUSIVE_STAFF_ROLES.includes(r.id));
      if (!hasPermission) {
        return interaction.reply({ content: '❌ Only official Vanguard Lords or Staff can claim middleman sessions!', ephemeral: true });
      }

      await interaction.deferReply();

      for (const roleId of EXCLUSIVE_STAFF_ROLES) {
        await interaction.channel.permissionOverwrites.edit(roleId, { ViewChannel: false }).catch(() => null);
      }
      
      await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
        SendMessages: true
      });

      const claimedEmbed = new EmbedBuilder()
        .setDescription(`🤝 **This transaction has been officially claimed by ${interaction.user}!**\n\nAll other general staff views have been disabled for privacy. Please state your positions and proceed safely.`)
        .setColor('#2ecc71');

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_mm_ticket').setLabel('Close Session').setStyle(ButtonStyle.Danger)
      );

      await interaction.message.edit({ components: [] });
      return await interaction.editReply({ embeds: [claimedEmbed], components: [actionRow] });
    }

    if (interaction.customId === 'close_mm_ticket') {
      const isStaff = interaction.member.roles.cache.some(r => EXCLUSIVE_STAFF_ROLES.includes(r.id));
      if (!isStaff) {
        return interaction.reply({ content: '❌ Only the attending middleman or management staff can close this session line.', ephemeral: true });
      }

      const closePromptEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Termination Audit Protocol')
        .setDescription('Please choose the outcome of this operational trade instance. Selecting a successful outcome provides a fast vouch button link to the traders.')
        .setColor('#e74c3c');

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`mm_trade_success_${interaction.user.id}`).setLabel('✅ Successful Trade').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('mm_trade_failed').setLabel('❌ Cancelled / No Trade').setStyle(ButtonStyle.Secondary)
      );

      return await interaction.reply({ embeds: [closePromptEmbed], components: [closeRow] });
    }

    if (interaction.customId.startsWith('mm_trade_success_')) {
      const middlemanId = interaction.customId.split('_')[3];
      
      const vouchEmbed = new EmbedBuilder()
        .setTitle('🏆 Fast-Track Transaction Completed!')
        .setDescription(`This transaction was verified safely by middleman <@${middlemanId}>.\n\nTraders, please click the node below to automatically submit an official vouch to their \`/profile\` matrix!`)
        .setColor('#2ecc71');

      const vouchRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`submit_auto_vouch_${middlemanId}`).setLabel('⭐ Click to Vouch Middleman').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('force_purge_ticket').setLabel('⛔ Delete Channel').setStyle(ButtonStyle.Danger)
      );

      return await interaction.update({ embeds: [vouchEmbed], components: [vouchRow] });
    }

    if (interaction.customId.startsWith('submit_auto_vouch_')) {
      const middlemanId = interaction.customId.split('_')[3];

      if (interaction.user.id === middlemanId) {
        return interaction.reply({ content: '❌ Anti-Exploit Override: You cannot vouch for yourself!', ephemeral: true });
      }

      // Read database file securely from persistent volume space safely
      let db = {};
      if (fs.existsSync(VOUCH_FILE)) {
        try {
           db = JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8'));
        } catch (e) {
           db = {};
        }
      }

      // Increment flat database state architecture safely 
      db[middlemanId] = (db[middlemanId] || 0) + 1;

      // Force synchronous permanent filesystem lock down 
      fs.writeFileSync(VOUCH_FILE, JSON.stringify(db, null, 2), 'utf8');

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`used_vouch_${middlemanId}`).setLabel('✅ Vouch Submitted Successfully').setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId('force_purge_ticket').setLabel('⛔ Delete Channel').setStyle(ButtonStyle.Danger)
      );

      return await interaction.update({ 
        content: `🎉 Thank you **${interaction.user.username}**! Your automated vouch has been recorded safely inside the database. (Total: **${db[middlemanId]}**)`, 
        components: [disabledRow] 
      });
    }

    if (interaction.customId === 'mm_trade_failed' || interaction.customId === 'force_purge_ticket') {
      await interaction.reply({ content: 'Purging channel walls completely in 5 seconds...' });
      setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
    }
  },

  async handleModal(interaction) {
    const OFFICIAL_MM_ROLE_ID = '1520310648582443089';
    await interaction.deferReply({ ephemeral: true });

    const isPaid = interaction.customId === 'mm_form_paid';
    const txDetails = interaction.fields.getTextInputValue('tx_details');
    const txAmount = interaction.fields.getTextInputValue('tx_amount');
    const txPartner = interaction.fields.getTextInputValue('tx_partner');

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

    await channel.send({ content: `<@&${OFFICIAL_MM_ROLE_ID}>`, embeds: [welcomeEmbed], components: [controlRow] });
    return interaction.editReply({ content: `Your session has opened cleanly at ${channel}` });
  }
};