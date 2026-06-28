const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Calculate standard 5% Imperial fee with automatic live PHP exchange conversions')
    .addNumberOption(option => 
      option.setName('amount')
        .setDescription('Total transaction valuation amount (decimals supported)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('currency')
        .setDescription('Select the trading currency denomination')
        .setRequired(true)
        .addChoices(
          { name: '₱ Philippine Peso (PHP)', value: 'PHP' },
          { name: '$ United States Dollar (USD)', value: 'USD' },
          { name: '€ Euro (EUR)', value: 'EUR' },
          { name: '£ British Pound (GBP)', value: 'GBP' },
          { name: 'C$ Canadian Dollar (CAD)', value: 'CAD' },
          { name: 'A$ Australian Dollar (AUD)', value: 'AUD' }
        )),

  async executeTax(interaction) {
    await interaction.deferReply();

    const initialAmount = interaction.options.getNumber('amount');
    const currencyType = interaction.options.getString('currency');

    const handlingFee = Math.round((initialAmount * 0.05) * 100) / 100;
    const totalToPay = Math.round((initialAmount + handlingFee) * 100) / 100;

    const symbols = { PHP: '₱', USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' };
    const symbol = symbols[currencyType] || '₱';

    const embedFields = [
      { name: '💰 Trade Worth', value: `\`${symbol}${initialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\` ${currencyType}`, inline: false },
      { name: '🛡️ Middleman Fee (5%)', value: `\`${symbol}${handlingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\` ${currencyType}`, inline: true },
      { name: '💳 Total you need to pay', value: `\`${symbol}${totalToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\` ${currencyType}`, inline: true }
    ];

    if (currencyType === 'PHP') {
      embedFields.push(
        { name: '───', value: '💱 **Local PHP Ledger Metrics** ───', inline: false },
        { name: '🇵🇭 Trade Value (PHP)', value: `\`₱${initialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
        { name: '🇵🇭 Fee Value (PHP)', value: `\`₱${handlingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
        { name: '🇵🇭 Total Due (PHP)', value: `\`₱${totalToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true }
      );
    } else {
      const apiKey = process.env.EXCHANGE_RATE_API_KEY; 
      if (apiKey) {
        try {
          const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${currencyType}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const phpRate = data.conversion_rates ? data.conversion_rates.PHP : null;
            if (phpRate) {
              const baseInPhp = initialAmount * phpRate;
              const feeInPhp = handlingFee * phpRate;
              const totalInPhp = totalToPay * phpRate;

              embedFields.push(
                { name: '───', value: '💱 **Live Local PHP Exchange Equivalent** ───', inline: false },
                { name: '🇵🇭 Trade Value (PHP)', value: `\`₱${baseInPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
                { name: '🇵🇭 Fee Value (PHP)', value: `\`₱${feeInPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
                { name: '🇵🇭 Total Due (PHP)', value: `\`₱${totalInPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true }
              );
            }
          }
        } catch (error) {
          console.error('❌ ExchangeRate API connection error:', error.message);
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 Imperial Market Ledger Breakdown [${currencyType}]`)
      .setColor('#a04be0')
      .addFields(embedFields)
      .setDescription(`Ensure both parties fully accept this valuation model before transferring assets inside the session.`)
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};