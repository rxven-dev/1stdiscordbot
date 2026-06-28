const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    const seedsConfig = {
        "Carrot": { emoji: "🥕", roleId: "1515951265765658715" },
        "Strawberry": { emoji: "🍓", roleId: "1515951482703450153" },
        "Blueberry": { emoji: "🫐", roleId: "1515951497349824613" },
        "Tulip": { emoji: "🌷", roleId: "1515951836157313154" },
        "Tomato": { emoji: "🍅", roleId: "1515951839307370596" },
        "Bamboo": { emoji: "🎍", roleId: "1515951847985254490" },
        "Corn": { emoji: "🌽", roleId: "1515951851197956197" },
        "Cactus": { emoji: "🌵", roleId: "1515951854247477268" },
        "Acorn": { emoji: "🌰", roleId: "1515951881245954138" },
        "Green Bean": { emoji: "🫛", roleId: "1515951863957164093" },
        "Banana": { emoji: "🍌", roleId: "1515951865492148255" },
        "Moon Bloom": { emoji: "🌙", roleId: "1515951897196888074" },
        "Venus Fly Trap": { emoji: "🥀", roleId: "1515951889211199518" },
        "Pineapple": { emoji: "🍍", roleId: "1515951857036693504" },
        "Dragonfruit": { emoji: "🐉", roleId: "1515951878448349194" },
        "Grape": { emoji: "🍇", roleId: "1515951869669670962" },
        "Dragon Breath": { emoji: "🐲", roleId: "1515951899965391031" },
        "Mango": { emoji: "🥭", roleId: "1515951875566997574" },
        "Poison Apple": { emoji: "🍏", roleId: "1515951894533509120" },
        "Pomegranate": { emoji: "🍑", roleId: "1515951892025573406" },
        "Sunflower": { emoji: "🌻", roleId: "1515951886640087140" },
        "Cherry": { emoji: "🍒", roleId: "1515951883838033930" },
        "Apple": { emoji: "🍎", roleId: "1515951842054504458" }
    };

    client.on('messageCreate', async (message) => {
        try {
            // Channel filter and Bot ID filter
            if (message.channel.id !== '1515943620828467210') return;
            if (message.author.id !== '1515054582844358767') return;

            const embed = message.embeds[0];
            if (!embed) return;

            const embedText = (embed.description || "") + " " + (embed.fields ? embed.fields.map(f => f.value).join(" ") : "");
            const rolesToMention = [];

            for (const [seedName, data] of Object.entries(seedsConfig)) {
                if (embedText.includes(seedName)) {
                    rolesToMention.push(`<@&${data.roleId}>`);
                }
            }

            if (rolesToMention.length > 0) {
                const notifyEmbed = new EmbedBuilder()
                    .setColor('#a04be0')
                    .setTitle('🌱 NEW GARDEN STOCK')
                    .setDescription(
                        `The following seeds are currently in stock:\n\n${rolesToMention.join(' ')}\n\n` +
                        `If you want to get pinged for future stock, please head over to <#1515943436644253817>!`
                    );

                await message.channel.send({ embeds: [notifyEmbed] });
                console.log('✅ Seed stock notification embed posted.');
            }
        } catch (error) {
            console.error('❌ Failed to process seed stock embed:', error);
        }
    });
};