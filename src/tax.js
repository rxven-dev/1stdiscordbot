const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  // ⚔️ Data builder configures the multi-currency interface options for Discord
  data: new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Calculate standard 5% Imperial fee with automatic live PHP exchange conversions')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Total transaction valuation amount')
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

  async execute(interaction) {
    const CHANNEL_ID = '1520312909488459838';

    if (interaction.channelId !== CHANNEL_ID) {
      return interaction.reply({ content: `❌ Please use this command in <#${CHANNEL_ID}>.`, ephemeral: true });
    }

    // Acknowledge interaction to buy network execution time before external fetch
    await interaction.deferReply();

    const initialAmount = interaction.options.getInteger('amount');
    const currencyType = interaction.options.getString('currency');

    const handlingFee = Math.round(initialAmount * 0.05);
    const totalToPay = initialAmount + handlingFee;

    // Currency prefix symbol mapping index
    const symbols = { PHP: '₱', USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' };
    const symbol = symbols[currencyType] || '₱';

    const embedFields = [
      { name: '💰 Trade Worth', value: `\`${symbol}${initialAmount.toLocaleString()}\` ${currencyType}`, inline: false },
      { name: '🛡️ Middleman Fee (5%)', value: `\`${symbol}${handlingFee.toLocaleString()}\` ${currencyType}`, inline: true },
      { name: '💳 Total you need to pay', value: `\`${symbol}${totalToPay.toLocaleString()}\` ${currencyType}`, inline: true }
    ];

    // 🌐 LIVE API INTERATIONAL EXCHANGES PIPELINE
    if (currencyType !== 'PHP') {
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;
      if (apiKey) {
        try {
          const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${currencyType}`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            const phpRate = data.conversion_rates ? data.conversion_rates.PHP : null;

            if (phpRate) {
              const baseInPhp = Math.round(initialAmount * phpRate);
              const feeInPhp = Math.round(handlingFee * phpRate);
              const totalInPhp = Math.round(totalToPay * phpRate);

              embedFields.push(
                { name: '───', value: '💱 **Live Local PHP Exchange Equivalent** ───', inline: false },
                { name: '🇵🇭 Trade Value (PHP)', value: `\`₱${baseInPhp.toLocaleString()}\``, inline: true },
                { name: '🇵🇭 Fee Value (PHP)', value: `\`₱${feeInPhp.toLocaleString()}\``, inline: true },
                { name: '🇵🇭 Total Due (PHP)', value: `\`₱${totalInPhp.toLocaleString()}\``, inline: true }
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
      .setDescription(`Ensure both parties fully accept this valuation model before transferring assets inside the session. Live conversions are backed by updated market analytics.`)
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};