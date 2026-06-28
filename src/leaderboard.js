const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const path = require('path');

// Direct check if Railway volume storage exists physically on server
const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();
const VOUCH_FILE = path.join(dataDir, 'vouches.json');
const BLACKLIST_FILE = path.join(dataDir, 'blacklist.json');
const stateFile = path.join(dataDir, 'leaderboard_state.json');

module.exports = (client) => {
  const channelId = '1514622201716801546';

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

      // CRITICAL PATH ROUTING ALIGNMENT FIX
      const data = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};
      const blacklist = fs.existsSync(BLACKLIST_FILE) ? JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8')) : [];

      // 🔥 FILTER OUT BLACKLISTED USERS FROM LEADERBOARD SORTS
      const sorted = Object.entries(data)
        .filter(([id]) => !blacklist.includes(id)) 
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      // Cleaned formatting template string list conversion structure
      let leaderboardDescription = 'No vouches yet!';
      if (sorted.length > 0) {
        leaderboardDescription = sorted.map((val, index) => `${index + 1}. <@${val[0]}> - **${val[1]}** vouches`).join('\n');
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Daily Top 3 Middlemen')
        .setColor('#a04be0')
        .setDescription(leaderboardDescription)
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      
      state.lastPosted = today;
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      console.log('✅ Daily leaderboard posted with absolute volume tracking path synchronization!');
    } catch (err) {
      console.error('❌ Failed leaderboard daily scheduler post task execution error:', err);
    }
  };

  // Run immediately on bootup check
  setTimeout(postLeaderboard, 5000);
  // Re-verify task cycle route every single hour
  setInterval(postLeaderboard, 3600000);
};