require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
} = require('discord.js');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const REVIEWS_CHANNEL_ID = process.env.REVIEWS_CHANNEL_ID;
const CUSTOMER_ROLE_ID = process.env.CUSTOMER_ROLE_ID;
const UPDATES_CHANNEL_ID = process.env.UPDATES_CHANNEL_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const reviewCooldowns = new Map();
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const productNames = {
    fivem: '🎮 FiveM External',
    r6: '🎯 R6 External',
    retrac: '🎯 Fortnite Retrac',
    fortnitepublic: '🎯 Fortnite Public',
    fortniteai: '🎯 Fortnite Ai',
    fortniteprivate: '🎯 Fortnite Private',
    roblox: '🤖 Roblox External',
    tempSpoofer: '⏱️ Temp Spoofer',
    permSpoofer: '🛡️ Perm Spoofer',
};

const productColors = {
    fivem: 0x3498DB,
    r6: 0xE74C3C,
    retrac: 0x9B59B6,
    fortnitepublic: 0x9B59B6,
    fortniteai: 0x9B59B6,
    fortniteprivate: 0x9B59B6,
    roblox: 0x9B59B6,
    tempSpoofer: 0x2ECC71,
    permSpoofer: 0xF39C12,
};

const productImages = {
    'Fortnite Ai': 'https://cdn.discordapp.com/attachments/1488561753699647638/1490902207825186816/Futuristic_Fortnite_character_in_misty_forest.png?ex=69d5be61&is=69d46ce1&hm=3cf427c66be7c6b32aa170ff5bb9531a395fed5f7e74d9406017c45d27520994&',
    'Fortnite Retrac': 'https://cdn.discordapp.com/attachments/1488561753699647638/1488561794329874602/Phantomware_Retrac.jpg',
    'Fortnite Public': 'https://cdn.discordapp.com/attachments/1488561753699647638/1489081081591238757/ChatGPT_Image_Apr_1_2026_09_56_23_PM.png?ex=69cf1e53&is=69cdccd3&hm=7a97b68015d1503c2fd664ff60c491efb4633d1c1bf5722a761ff463ae4bd7b9&',
    'Fortnite Private': 'https://cdn.discordapp.com/attachments/1488561753699647638/1501380281389682748/Fn_Private.png?ex=69fbdcd9&is=69fa8b59&hm=d8ca1e26042b47ae5b66bec04e77a5868e23083d3a4b2aefcd65aef35ad06e3&',
    'R6 External': 'https://cdn.discordapp.com/attachments/1488561753699647638/1488568907143839794/Phantomware_R6.png',
    'FiveM External': 'https://cdn.discordapp.com/attachments/1488561753699647638/1488570787408515375/Phantomware_Fivem.png',
    'Temp Spoofer': 'https://cdn.discordapp.com/attachments/1488561753699647638/1488572444502397078/Phantowmare_Spoofer.jpg',
    'Roblox External': 'https://cdn.discordapp.com/attachments/1488561753699647638/1500361106638504018/Roblox.png?ex=69f827ab&is=69f6d62b&hm=fc725aa4c14f2260e2de6a16aab1f03380f60b6ce96b6510f43066c3d462d403&',
};

const stars = (r) => '⭐'.repeat(r) + '✰'.repeat(5 - r);

const commands = [
    new SlashCommandBuilder()
        .setName('reviewpanel')
        .setDescription('Post review panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('deletereview')
        .setDescription('Delete a review by message ID')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o =>
            o.setName('messageid')
             .setDescription('Message ID of the review')
             .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('update')
        .setDescription('Send a product update')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o =>
            o.setName('product')
             .setDescription('Product to update')
             .setRequired(true)
             .addChoices(
                 { name: 'Fortnite Retrac', value: 'Fortnite Retrac' },
                 { name: 'Fortnite Public', value: 'Fortnite Public' },
                 { name: 'Fortnite Ai', value: 'Fortnite Ai' },
                 { name: 'Fortnite Private', value: 'Fortnite Private' },
                 { name: 'R6 External', value: 'R6 External' },
                 { name: 'FiveM External', value: 'FiveM External' },
                 { name: 'Roblox External', value: 'Roblox External' },
                 { name: 'Temp Spoofer', value: 'Temp Spoofer' }
             )
        )
        .addStringOption(o =>
            o.setName('message')
             .setDescription('Update message')
             .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('image')
             .setDescription('Optional image URL')
        )
        .addStringOption(o =>
            o.setName('schedule')
             .setDescription('Schedule time (YYYY-MM-DD HH:MM)')
        ),
].map(c => c.toJSON());

function buildReviewPanel() {
    return {
        embeds: [
            new EmbedBuilder()
                .setTitle('⭐ PhantomWare Reviews')
                .setColor(0x9B59B6)
                .setDescription('Leave feedback below.\n\n━━━━━━━━━━━━━━━━━━━━━━━')
                .setFooter({ text: 'PhantomWare' })
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_review_select')
                    .setLabel('✍️ Write Review')
                    .setStyle(ButtonStyle.Primary)
            )
        ]
    };
}

function buildProductSelect() {
    return {
        flags: 64,
        components: [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('review_product_select')
                    .setPlaceholder('Choose product')
                    .addOptions(
                        { label: 'FiveM', value: 'fivem', emoji: '🎮' },
                        { label: 'R6', value: 'r6', emoji: '🎯' },
                        { label: 'Fortnite Public', value: 'fortnitepublic', emoji: '🎯' },
                        { label: 'Fortnite Ai', value: 'fortniteai', emoji: '🎯' },
                        { label: 'Fortnite Private', value: 'fortniteprivate', emoji: '🎯' },
                        { label: 'Retrac', value: 'retrac', emoji: '🎯' },
                        { label: 'Roblox', value: 'roblox', emoji: '🤖' },
                        { label: 'Temp Spoofer', value: 'tempSpoofer', emoji: '⏱️' },
                        { label: 'Perm Spoofer', value: 'permSpoofer', emoji: '🛡️' }
                    )
            )
        ]
    };
}

function buildReviewModal(product) {
    return new ModalBuilder()
        .setCustomId(`review_${product}`)
        .setTitle('Submit Review')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('rating')
                    .setLabel('Rating (1-5)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(1)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('text')
                    .setLabel('Review')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
            )
        );
}

async function postReview(guild, user, product, rating, text) {
    const ch = await guild.channels.fetch(REVIEWS_CHANNEL_ID).catch(() => null);
    if (!ch) return null;

    return ch.send({
        content: '‎',
        embeds: [
            new EmbedBuilder()
                .setTitle(productNames[product])
                .setDescription(`**${stars(rating)}**\n\n"${text}"`)
                .setColor(productColors[product] ?? 0x9B59B6)
                .setFooter({ text: `${user.tag} • ${rating}/5 ⭐` })
        ]
    });
}

function formatUpdateMessage(product, raw) {
    return `🚀 **${product} Update**\n\n${raw}`;
}

client.once('clientReady', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await new REST({ version: '10' })
        .setToken(BOT_TOKEN)
        .put(Routes.applicationCommands(CLIENT_ID), { body: commands });
});

client.on('interactionCreate', async (i) => {
    try {

        // ── SLASH COMMANDS ─────────────────────────────
        if (i.isChatInputCommand()) {

            if (i.commandName === 'reviewpanel') {
                const msg = await i.channel.send(buildReviewPanel());
                await msg.pin().catch(() => {});
                await i.reply({ content: '✅ Posted', flags: 64 });
            }

            if (i.commandName === 'deletereview') {
                await i.deferReply({ flags: 64 });
                const messageId = i.options.getString('messageid');
                const ch = await client.channels.fetch(REVIEWS_CHANNEL_ID).catch(() => null);
                if (!ch) return i.editReply({ content: '❌ Reviews channel not found.' });

                const msg = await ch.messages.fetch(messageId).catch(() => null);
                if (!msg) return i.editReply({ content: '❌ Message not found.' });

                await msg.delete();
                await i.editReply({ content: '✅ Review deleted.' });
            }

            if (i.commandName === 'update') {
                await i.deferReply({ flags: 64 });

                const product = i.options.getString('product');
                const raw = i.options.getString('message');
                const schedule = i.options.getString('schedule');
                const image = i.options.getString('image') || productImages[product] || '';

                const embed = new EmbedBuilder()
                    .setDescription(formatUpdateMessage(product, raw))
                    .setColor(0x5865F2)
                    .setTimestamp();

                if (image) embed.setImage(image);

                const sendUpdate = async () => {
                    const ch = await client.channels.fetch(UPDATES_CHANNEL_ID).catch(() => null);
                    if (!ch) return;
                    await ch.send({ embeds: [embed] });
                };

                if (schedule) {
                    const time = new Date(schedule);
                    const delay = time.getTime() - Date.now();

                    if (delay > 0) {
                        await i.editReply({
                            content: `⏰ Scheduled for <t:${Math.floor(time.getTime() / 1000)}:F>`
                        });
                        setTimeout(sendUpdate, delay);
                    } else {
                        await i.editReply({ content: '❌ Time must be in the future.' });
                    }
                } else {
                    await sendUpdate();
                    await i.editReply({ content: '✅ Update sent!' });
                }
            }
        }

        // ── BUTTON ─────────────────────────────────────
        if (i.isButton() && i.customId === 'open_review_select') {
            await i.deferReply({ flags: 64 });

            if (CUSTOMER_ROLE_ID) {
                const member = await i.guild.members.fetch(i.user.id).catch(() => null);
                if (!member || !member.roles.cache.has(CUSTOMER_ROLE_ID)) {
                    return i.editReply({ content: '❌ Verified customers only.' });
                }
            }

            await i.editReply(buildProductSelect());
        }

        // ── SELECT MENU ────────────────────────────────
        if (i.isStringSelectMenu() && i.customId === 'review_product_select') {
            await i.showModal(buildReviewModal(i.values[0]));
        }

        // ── MODAL SUBMIT ───────────────────────────────
        if (i.isModalSubmit()) {
            await i.deferReply({ flags: 64 });

            const rating = parseInt(i.fields.getTextInputValue('rating'));
            const text = i.fields.getTextInputValue('text');
            const product = i.customId.replace('review_', '');

            if (isNaN(rating) || rating < 1 || rating > 5) {
                return i.editReply({ content: '❌ Rating must be 1–5.' });
            }

            const last = reviewCooldowns.get(i.user.id);
            if (last && Date.now() - last < COOLDOWN_MS) {
                return i.editReply({ content: '⏳ You can only review once every 24 hours.' });
            }

            const msg = await postReview(i.guild, i.user, product, rating, text);
            if (msg) {
                reviewCooldowns.set(i.user.id, Date.now());
                await i.editReply({ content: '✅ Review posted!' });
            } else {
                await i.editReply({ content: '❌ Failed to post review. Channel not found.' });
            }
        }

    } catch (error) {
        console.error('Interaction error:', error);
        if (error.code === 10062) return;
        try {
            if (i.replied || i.deferred) {
                await i.editReply({ content: '❌ Something went wrong.' });
            } else {
                await i.reply({ content: '❌ Something went wrong.', flags: 64 });
            }
        } catch (_) {}
    }
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

client.on('error', (error) => {
    console.error('Client error:', error);
});

client.login(BOT_TOKEN);