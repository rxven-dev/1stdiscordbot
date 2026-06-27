const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const path = require('path');

const dataDir = process.env.RAILWAY_ENVIRONMENT ? '/data' : process.cwd();
const VOUCH_FILE = path.join(dataDir, 'vouches.json');

if (!fs.existsSync(dataDir) && process.env.RAILWAY_ENVIRONMENT) {
    fs.mkdirSync(dataDir, { recursive: true });
}

module.exports = {
  async executeVouch(interaction) {
    const { options, user } = interaction;
    let db = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};

    const targetUser = options.getUser('user');
    const proofAttachment = options.getAttachment('proof');

    if (!targetUser) return interaction.reply({ content: '❌ Invalid user selected.', ephemeral: true });
    if (targetUser.id === user.id) return interaction.reply({ content: '❌ You cannot vouch for yourself!', ephemeral: true });

    if (!proofAttachment.contentType?.startsWith('image/')) {
      return interaction.reply({ content: '❌ Invalid file type. The proof upload option must be an image format (PNG, JPG).', ephemeral: true });
    }

    db[targetUser.id] = (db[targetUser.id] || 0) + 1;
    fs.writeFileSync(VOUCH_FILE, JSON.stringify(db, null, 2));

    const confirmationEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setDescription(`✅ **${user}** has successfully vouched for **${targetUser}**! (Total vouches: **${db[targetUser.id]}**)`)
      .setImage(proofAttachment.url)
      .setTimestamp();

    return interaction.reply({ embeds: [confirmationEmbed] });
  },

  async executeRep(interaction) {
    const { options, user } = interaction;
    let db = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};

    const targetUser = options.getUser('user') || user;
    const count = db[targetUser.id] || 0;
    return interaction.reply({ content: `👤 **${targetUser.username}** currently has **${count}** trade vouches.`, ephemeral: true });
  }
};