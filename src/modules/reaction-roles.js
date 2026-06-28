const { Events, EmbedBuilder } = require('discord.js');

// 📌 Configured Channel ID
const GATEWAY_CHANNEL_ID = '1516008262833668136'; 

// 🎯 LOCKED-IN UNIFIED ID: The bot will now track and edit this message instead of duplicating it!
const GATEWAY_MESSAGE_ID = '1520282988276088937'; 

// 🔑 Configured System Mapping
const ROLE_MAPPING = {
    '🎮': '1520273210548027422', // Valorant Role ID
    '🌱': '1515950193156034600',  // Grow A Garden 2 Role ID
    '🪴': '1520284099321925662'
};

module.exports = async (client) => {
    console.log("🚀 [ROLE SYSTEM] Module loaded into memory. Checking embed synchronization...");

    async function syncCombinedEmbed() {
        try {
            // Wait until client cache is fully active
            while (!client.readyAt) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const channel = await client.channels.fetch(GATEWAY_CHANNEL_ID).catch(() => null);
            if (!channel) return;

            // 🎨 Multi-Role Embed Layout Configuration
            const unifiedEmbed = new EmbedBuilder()
                .setColor('#A855F7') 
                .setTitle('✨ Channel Access')
                .setDescription(
                    'Select your channel you want to have access with..\n\n' +
                    '🎮 : VALORANT\n' +
                    '🌱 : GROW A GARDEN 2\n' +
                    '🪴 : MINECRAFT'
                );

            const existingMessage = await channel.messages.fetch(GATEWAY_MESSAGE_ID).catch(() => null);

            if (existingMessage) {
                // 👇 This safely edits your existing message, adding absolute stability
                await existingMessage.edit({ embeds: [unifiedEmbed] });
                await existingMessage.react('🎮');
                await existingMessage.react('🌱');
                await existingMessage.react('🪴');
                console.log("🔄 [ROLE SYSTEM] Combined reaction menu verified and synced cleanly.");
            } else {
                console.log("📢 Saved message ID missing. Creating a fallback embed menu...");
                const newMessage = await channel.send({ embeds: [unifiedEmbed] });
                await newMessage.react('🎮');
                await newMessage.react('🌱');
                await newMessage.react('🪴');
                console.log(`⚠️ Update your GATEWAY_MESSAGE_ID string to: ${newMessage.id}`);
            }
            
        } catch (error) {
            console.error("❌ [ROLE SYSTEM] Synchronization error:", error);
        }
    }

    syncCombinedEmbed();

    // --- 1. ADD ROLE ON REACTION ---
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        if (reaction.message.id === GATEWAY_MESSAGE_ID) {
            const targetRoleId = ROLE_MAPPING[reaction.emoji.name];
            if (targetRoleId) {
                try {
                    const member = await reaction.message.guild.members.fetch(user.id);
                    await member.roles.add(targetRoleId);
                    console.log(`✅ Added role for ${reaction.emoji.name} to ${user.tag}`);
                } catch (err) {
                    console.error(`❌ Error adding role for ${reaction.emoji.name}:`, err.message);
                }
            }
        }
    });

    // --- 2. REMOVE ROLE ON UNREACTION ---
    client.on(Events.MessageReactionRemove, async (reaction, user) => {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        if (reaction.message.id === GATEWAY_MESSAGE_ID) {
            const targetRoleId = ROLE_MAPPING[reaction.emoji.name];
            if (targetRoleId) {
                try {
                    const member = await reaction.message.guild.members.fetch(user.id);
                    await member.roles.remove(targetRoleId);
                    console.log(`❌ Removed role for ${reaction.emoji.name} from ${user.tag}`);
                } catch (err) {
                    console.error(`❌ Error removing role for ${reaction.emoji.name}:`, err.message);
                }
            }
        }
    });
};