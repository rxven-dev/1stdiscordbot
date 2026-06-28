const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const path = require('path');

const dataDir = fs.existsSync('/data') ? '/data' : process.cwd();
const VOUCH_FILE = path.join(dataDir, 'vouches.json');
const BLACKLIST_FILE = path.join(dataDir, 'blacklist.json');

module.exports = (client) => {
  const channelId = '1514622201716801546';

  const updateLeaderboard = async () => {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) return;

      // 1. FETCH AND PROCESS CURRENT REAL-TIME DATA
      const data = fs.existsSync(VOUCH_FILE) ? JSON.parse(fs.readFileSync(VOUCH_FILE, 'utf8')) : {};
      const blacklist = fs.existsSync(BLACKLIST_FILE) ? JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8')) : [];

      const sorted = Object.entries(data)
        .filter(([id]) => !blacklist.includes(id)) 
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      let leaderboardDescription = 'No vouches yet!';
      if (sorted.length > 0) {
        leaderboardDescription = sorted.map((val, index) => `${index + 1}. <@${val[0]}> - **${val[1]}** vouches`).join('\n');
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Daily Top 3 Middlemen')
        .setColor('#a04be0')
        .setDescription(leaderboardDescription)
        .setTimestamp();

      // 2. CHECK FOR AN EXISTING LEADERBOARD POST FROM TODAY
      const today = new Date().toISOString().split('T')[0];
      const messages = await channel.messages.fetch({ limit: 15 });
      
      const existingMessage = messages.find(msg => {
        if (msg.author.id !== client.user.id || !msg.embeds.length) return false;
        return msg.embeds[0].title === '🏆 Daily Top 3 Middlemen' && 
               new Date(msg.createdTimestamp).toISOString().split('T')[0] === today;
      });

      // 3. REACTIVE LIVE RENDERING UPDATE
      if (existingMessage) {
        // If it already exists, update its fields live to reflect real-time counts!
        await existingMessage.edit({ embeds: [embed] });
        console.log('🔄 Daily leaderboard panel dynamically edited and updated.');
      } else {
        // If it's a brand new day, post a fresh panel
        await channel.send({ embeds: [embed] });
        console.log('✅ Fresh daily leaderboard posted for the day.');
      }
    } catch (err) {
      console.error('❌ Failed leaderboard reactive update execution error:', err);
    }
  };

  // Run shortly after bootup
  setTimeout(updateLeaderboard, 5000);
  // Scan and keep data fresh every 5 minutes instead of once an hour
  setInterval(updateLeaderboard, 300000);
};