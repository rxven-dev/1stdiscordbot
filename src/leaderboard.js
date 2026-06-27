const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  const channelId = '1514622201716801546';
  const stateFile = './leaderboard_state.json';
  const BLACKLIST_FILE = './blacklist.json';

  const postLeaderboard = async () => {
    const today = new Date().toISOString().split('T')[0];
    let state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};

    if (state.lastPosted === today) return; 

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) return;

      // Anti-duplicate clean look checks
      const messages = await channel.messages.fetch({ limit: 10 });
      const alreadyPostedToday = messages.some(msg => {
        if (msg.author.id !== client.user.id || !msg.embeds.length) return false;
        return msg.embeds[0].title === '🏆 Daily Top 3 Middlemen' && new Date(msg.createdTimestamp).toISOString().split('T')[0] === today;
      });

      if (alreadyPostedToday) {
        state.lastPosted = today;
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        return;
      }

      const data = fs.existsSync('./vouches.json') ? JSON.parse(fs.readFileSync('./vouches.json', 'utf8')) : {};
      const blacklist = fs.existsSync(BLACKLIST_FILE) ? JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8')) : [];

      // 🔥 FILTER OUT BLACKLISTED USERS FROM LEADERBOARD SORTS
      const sorted = Object.entries(data)
        .filter(([id]) => !blacklist.includes(id)) 
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      const embed = new EmbedBuilder()
        .setTitle('🏆 Daily Top 3 Middlemen')
        .setColor('#a04be0')
        .setDescription(sorted.length > 0 
          ? sorted.map((val, index) => `${index + 1}. <@${val[0]}> - **${val[1]}** vouches`).join('\n') 
          : 'No vouches yet!')
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      
      state.lastPosted = today;
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      console.log('✅ Leaderboard posted successfully.');
    } catch (err) {
      console.error('❌ Leaderboard Error:', err);
    }
  };

  postLeaderboard();
  setInterval(postLeaderboard, 3600000); 
};