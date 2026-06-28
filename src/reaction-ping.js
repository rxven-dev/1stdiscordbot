const { Events, EmbedBuilder } = require('discord.js');

const ROLES_CONFIG = {
    '🥕': '1515951265765658715',
    '🍓': '1515951482703450153',
    '🫐': '1515951497349824613',
    '🌷': '1515951836157313154',
    '🍅': '1515951839307370596',
    '🎍': '1515951847985254490',
    '🌽': '1515951851197956197',
    '🌵': '1515951854247477268',
    '🌰': '1515951881245954138',
    '🫛': '1515951863957164093',
    '🍌': '1515951865492148255',
    '🌙': '1515951897196888074',
    '🥀': '1515951889211199518',
    '🍍': '1515951857036693504',
    '🐉': '1515951878448349194',
    '🍇': '1515951869669670962',
    '🐲': '1515951899965391031',
    '🥭': '1515951875566997574',
    '🍏': '1515951894533509120',
    '🍑': '1515951892025573406',
    '🌻': '1515951886640087140', 
    '🍒': '1515951883838033930',
    '🍎': '1515951842054504458',
};

module.exports = (client) => {
    
    // 1. SETUP COMMAND: !setup-reactions
    client.on('messageCreate', async (message) => {
        if (message.content.startsWith('!setup-reactions') && message.member.permissions.has('Administrator')) {
            const entries = Object.entries(ROLES_CONFIG);
            // Split into two chunks (12 and 11) to avoid the 20-reaction limit
            const chunks = [entries.slice(0, 12), entries.slice(12)];
            
            // Your clickable info links
            const extraLinks = `\n\n**- Seed Stock : <#1515943620828467210>\n- Gear Stock : <#1515947899526053918>\n- Weather : <#1515948123732836492>**`;

            for (const chunk of chunks) {
                const roleList = chunk.map(([emoji, id]) => `${emoji}: <@&${id}>`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle('🌱 Select Your Roles')
                    .setDescription(`Just react on what role you want to be notified!:\n\n${roleList}${extraLinks}`)
                    .setColor('#7289da');

                const sentMessage = await message.channel.send({ embeds: [embed] });
                
                // Add the reactions to the message
                for (const [emoji] of chunk) {
                    await sentMessage.react(emoji);
                }
            }
            message.reply("✅ Successfully created two reaction embeds!");
        }
    });

    // 2. REACTION ADD
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch();
        const roleId = ROLES_CONFIG[reaction.emoji.name];
        if (roleId) {
            try {
                const member = await reaction.message.guild.members.fetch(user.id);
                await member.roles.add(roleId);
            } catch (err) { console.error("❌ Error adding role:", err.message); }
        }
    });

    // 3. REACTION REMOVE
    client.on(Events.MessageReactionRemove, async (reaction, user) => {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch();
        const roleId = ROLES_CONFIG[reaction.emoji.name];
        if (roleId) {
            try {
                const member = await reaction.message.guild.members.fetch(user.id);
                await member.roles.remove(roleId);
            } catch (err) { console.error("❌ Error removing role:", err.message); }
        }
    });
};