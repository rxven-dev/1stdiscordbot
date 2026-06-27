const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'tax',
  async execute(interaction) {
    const CHANNEL_ID = '1520312909488459838';

    if (interaction.channelId !== CHANNEL_ID) {
      return interaction.reply({ content: `❌ Please use this command in <#${CHANNEL_ID}>.`, ephemeral: true });
    }

    const initialAmount = interaction.options.getInteger('amount');
    const handlingFee = Math.round(initialAmount * 0.05);
    const payoutReturn = initialAmount - handlingFee;

    const embed = new EmbedBuilder()
      .setTitle('📊 Imperial Market Ledger Breakdown')
      .setColor('#a04be0')
      .addFields(
        { name: '💰 Base Trade Worth', value: `\`${initialAmount.toLocaleString()}\``, inline: false },
        { name: '🛡️ Middleman Fee (5%)', value: `\`${handlingFee.toLocaleString()}\``, inline: true },
        { name: '🎁 Payout Yield (Net)', value: `\`${payoutReturn.toLocaleString()}\``, inline: true }
      )
      .setDescription('Ensure both parties fully accept this valuation model before transferring assets inside the session.')
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};