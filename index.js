require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const characters = require("./characters.json");

// ========================================
// BOT
// ========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ========================================
// CẤU HÌNH
// ========================================

const CHARACTERS_PER_PAGE = 12;

// ========================================
// LẤY EMOJI
// ========================================

function getCharacterEmoji(character) {

    if (!character || !character.emoji) {
        return null;
    }

    // emoji dạng:
    // "emoji": "123456789"

    if (typeof character.emoji === "string") {

        return {
            id: String(character.emoji)
        };
    }

    // emoji dạng:
    // "emoji": {
    //     "name": "Akekuri",
    //     "id": "123456789",
    //     "animated": false
    // }

    if (
        typeof character.emoji === "object" &&
        character.emoji.id
    ) {

        return {
            id: String(character.emoji.id),
            name: character.emoji.name
                ? String(character.emoji.name)
                : undefined,
            animated:
                character.emoji.animated === true
        };
    }

    return null;
}

// ========================================
// TẠO BUTTON NHÂN VẬT
// ========================================

function createCharacterButton(key, character) {

    const button = new ButtonBuilder()
        .setCustomId(`char_${key}`)
        .setLabel(
            String(character.name).slice(0, 80)
        )
        .setStyle(ButtonStyle.Secondary);

    const emoji = getCharacterEmoji(character);

    if (emoji) {
        try {
            button.setEmoji(emoji);
        } catch (error) {
            console.log(
                `⚠️ Emoji lỗi của ${character.name}`
            );
        }
    }

    return button;
}

// ========================================
// TẠO DANH SÁCH NHÂN VẬT
// ========================================

function createCharacterList(page = 0) {

    const allCharacters =
        Object.entries(characters);

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                allCharacters.length /
                CHARACTERS_PER_PAGE
            )
        );

    // Chặn page
    page = Math.max(
        0,
        Math.min(
            page,
            totalPages - 1
        )
    );

    const start =
        page * CHARACTERS_PER_PAGE;

    const pageCharacters =
        allCharacters.slice(
            start,
            start + CHARACTERS_PER_PAGE
        );

    // ========================================
    // EMBED
    // ========================================

    const embed =
        new EmbedBuilder()
            .setTitle("📋 THƯ VIỆN NHÂN VẬT")
            .setDescription(
                "Chọn nhân vật bên dưới để xem ảnh.\n\n" +
                `📄 Trang **${page + 1} / ${totalPages}**`
            );

    const rows = [];

    // ========================================
    // BUTTON NHÂN VẬT
    // 3 BUTTON / HÀNG
    // ========================================

    for (
        let i = 0;
        i < pageCharacters.length;
        i += 3
    ) {

        const row =
            new ActionRowBuilder();

        const rowCharacters =
            pageCharacters.slice(
                i,
                i + 3
            );

        for (
            const [key, character]
            of rowCharacters
        ) {

            row.addComponents(
                createCharacterButton(
                    key,
                    character
                )
            );
        }

        rows.push(row);
    }

    // ========================================
    // NÚT CHUYỂN TRANG
    // ========================================

    const previousButton =
        new ButtonBuilder()
            .setCustomId(
                `page_prev_${page}`
            )
            .setLabel("Trang trước")
            .setEmoji("◀️")
            .setStyle(
                ButtonStyle.Primary
            )
            .setDisabled(
                page === 0
            );

    const pageButton =
        new ButtonBuilder()
            .setCustomId(
                `page_number_${page}`
            )
            .setLabel(
                `${page + 1} / ${totalPages}`
            )
            .setStyle(
                ButtonStyle.Secondary
            )
            .setDisabled(true);

    const nextButton =
        new ButtonBuilder()
            .setCustomId(
                `page_next_${page}`
            )
            .setLabel("Trang sau")
            .setEmoji("▶️")
            .setStyle(
                ButtonStyle.Primary
            )
            .setDisabled(
                page >= totalPages - 1
            );

    const navigationRow =
        new ActionRowBuilder()
            .addComponents(
                previousButton,
                pageButton,
                nextButton
            );

    rows.push(navigationRow);

    return {
        embeds: [embed],
        components: rows
    };
}

// ========================================
// READY
// ========================================

client.once(
    "clientReady",
    () => {

        console.log(
            `✅ Bot đã đăng nhập: ${client.user.tag}`
        );

        console.log(
            `📚 Tổng nhân vật: ${
                Object.keys(characters).length
            }`
        );
    }
);

// ========================================
// MESSAGE COMMAND
// ========================================

client.on(
    "messageCreate",
    async (message) => {

        // Không xử lý bot
        if (message.author.bot) {
            return;
        }

        const content =
            message.content.trim();

        // ========================================
        // !LIST
        // ========================================

        if (
            content.toLowerCase() === "!list"
        ) {

            try {

                await message.channel.send(
                    createCharacterList(0)
                );

            } catch (error) {

                console.error(
                    "❌ Lỗi !list:",
                    error
                );
            }

            return;
        }

        // ========================================
        // CÁC LỆNH KHÁC PHẢI BẮT ĐẦU !
        // ========================================

        if (
            !content.startsWith("!")
        ) {
            return;
        }

        const search =
            content
                .slice(1)
                .trim()
                .toLowerCase();

        // Tối thiểu 3 ký tự
        if (
            search.length < 3
        ) {
            return;
        }

        let foundCharacter = null;

        // ========================================
        // TÌM NHÂN VẬT
        // ========================================

        for (
            const [key, character]
            of Object.entries(characters)
        ) {

            const name =
                String(character.name)
                    .toLowerCase();

            const characterKey =
                String(key)
                    .toLowerCase();

            const aliases =
                Array.isArray(
                    character.aliases
                )
                    ? character.aliases.map(
                        alias =>
                            String(alias)
                                .toLowerCase()
                    )
                    : [];

            // Tìm theo tên
            if (
                name.startsWith(search)
            ) {

                foundCharacter =
                    character;

                break;
            }

            // Tìm theo alias
            if (
                aliases.some(
                    alias =>
                        alias.startsWith(search)
                )
            ) {

                foundCharacter =
                    character;

                break;
            }

            // Tìm theo key
            if (
                characterKey.startsWith(search)
            ) {

                foundCharacter =
                    character;

                break;
            }
        }

        // Không tìm thấy
        if (!foundCharacter) {
            return;
        }

        // ========================================
        // GỬI ẢNH
        // ========================================

        try {

            await message.channel.send({
                files: [
                    foundCharacter.image
                ]
            });

        } catch (error) {

            console.error(
                "❌ Lỗi gửi ảnh:",
                error
            );
        }
    }
);

// ========================================
// BUTTON INTERACTION
// ========================================

client.on(
    "interactionCreate",
    async (interaction) => {

        if (!interaction.isButton()) {
            return;
        }

        const customId =
            interaction.customId;

        // ========================================
        // CHUYỂN TRANG
        // ========================================

        if (
            customId.startsWith("page_prev_") ||
            customId.startsWith("page_next_")
        ) {

            try {

                // ========================================
                // ACKNOWLEDGE NGAY
                // ========================================

                await interaction.deferUpdate();

                // ========================================
                // LẤY PAGE HIỆN TẠI
                // ========================================

                const parts =
                    customId.split("_");

                const currentPage =
                    parseInt(
                        parts[parts.length - 1],
                        10
                    );

                if (
                    Number.isNaN(currentPage)
                ) {
                    return;
                }

                let newPage =
                    currentPage;

                // ========================================
                // TRANG TRƯỚC
                // ========================================

                if (
                    customId.startsWith(
                        "page_prev_"
                    )
                ) {

                    newPage =
                        currentPage - 1;
                }

                // ========================================
                // TRANG SAU
                // ========================================

                if (
                    customId.startsWith(
                        "page_next_"
                    )
                ) {

                    newPage =
                        currentPage + 1;
                }

                // ========================================
                // TỔNG TRANG
                // ========================================

                const totalPages =
                    Math.max(
                        1,
                        Math.ceil(
                            Object.keys(
                                characters
                            ).length /
                            CHARACTERS_PER_PAGE
                        )
                    );

                // ========================================
                // GIỚI HẠN PAGE
                // ========================================

                newPage =
                    Math.max(
                        0,
                        Math.min(
                            newPage,
                            totalPages - 1
                        )
                    );

                // ========================================
                // CẬP NHẬT MESSAGE
                // ========================================

                await interaction.message.edit(
                    createCharacterList(
                        newPage
                    )
                );

                console.log(
                    `📄 Chuyển trang: ${
                        currentPage + 1
                    } → ${
                        newPage + 1
                    }`
                );

            } catch (error) {

                console.error(
                    "❌ Lỗi chuyển trang:",
                    error
                );
            }

            return;
        }

        // ========================================
        // BUTTON NHÂN VẬT
        // ========================================

        if (
            customId.startsWith("char_")
        ) {

            try {

                const key =
                    customId.substring(5);

                const character =
                    characters[key];

                if (!character) {

                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction.reply({
                            content:
                                "❌ Không tìm thấy nhân vật.",
                            ephemeral: true
                        });
                    }

                    return;
                }

                // ========================================
                // TÊN NGƯỜI BẤM
                // ========================================

                const username =
                    interaction.member
                        ?.displayName ||
                    interaction.user.globalName ||
                    interaction.user.username;

                // ========================================
                // GỬI ẢNH
                // ========================================

                await interaction.reply({

                    content:
                        `👤 **${username}** đã chọn **${character.name}**`,

                    files: [
                        character.image
                    ]
                });

            } catch (error) {

                console.error(
                    "❌ Lỗi nút nhân vật:",
                    error
                );
            }

            return;
        }
    }
);

// ========================================
// ERROR HANDLER
// ========================================

client.on(
    "error",
    (error) => {

        console.error(
            "❌ Discord Client Error:",
            error
        );
    }
);

// ========================================
// LOGIN
// ========================================

client.login(
    process.env.TOKEN
);