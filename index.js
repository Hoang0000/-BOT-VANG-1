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

    // Nếu emoji được lưu trực tiếp:
    //
    // "emoji": "123456789012345678"
    //
    if (typeof character.emoji === "string") {

        return {
            id: String(character.emoji)
        };
    }

    // Nếu emoji được lưu:
    //
    // "emoji": {
    //     "name": "Akekuri",
    //     "id": "123456789012345678"
    // }
    //

    if (character.emoji.id) {

        return {
            id: String(character.emoji.id),
            name: String(
                character.emoji.name ||
                "emoji"
            )
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

    // ========================================
    // GẮN EMOJI
    // ========================================

    const emoji = getCharacterEmoji(character);

    if (emoji) {
        button.setEmoji(emoji);
    }

    return button;
}

// ========================================
// TẠO DANH SÁCH NHÂN VẬT
// ========================================

function createCharacterList(page = 0) {

    const allCharacters = Object.entries(characters);

    const totalPages = Math.max(
        1,
        Math.ceil(
            allCharacters.length /
            CHARACTERS_PER_PAGE
        )
    );

    // ========================================
    // GIỚI HẠN TRANG
    // ========================================

    page = Math.max(
        0,
        Math.min(
            page,
            totalPages - 1
        )
    );

    // ========================================
    // NHÂN VẬT CỦA TRANG
    // ========================================

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

    const embed = new EmbedBuilder()
        .setTitle("📋 THƯ VIỆN NHÂN VẬT")
        .setDescription(
            "Chọn nhân vật bên dưới để xem ảnh.\n\n" +
            `📄 Trang **${page + 1} / ${totalPages}**`
        );

    const rows = [];

    // ========================================
    // BUTTON NHÂN VẬT
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

            const button =
                createCharacterButton(
                    key,
                    character
                );

            row.addComponents(button);
        }

        rows.push(row);
    }

    // ========================================
    // NÚT PHÂN TRANG
    // ========================================

    const navigationRow =
        new ActionRowBuilder();

    const previousButton =
        new ButtonBuilder()
            .setCustomId(
                `page_prev_${page}`
            )
            .setLabel("◀ Trang trước")
            .setStyle(
                ButtonStyle.Primary
            )
            .setDisabled(
                page === 0
            );

    const pageButton =
        new ButtonBuilder()
            .setCustomId(
                "page_number"
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
            .setLabel("Trang sau ▶")
            .setStyle(
                ButtonStyle.Primary
            )
            .setDisabled(
                page >= totalPages - 1
            );

    navigationRow.addComponents(
        previousButton,
        pageButton,
        nextButton
    );

    rows.push(navigationRow);

    // ========================================
    // TRẢ VỀ MESSAGE
    // ========================================

    return {
        embeds: [embed],
        components: rows
    };
}

// ========================================
// BOT READY
// ========================================

client.once("ready", () => {

    console.log(
        `✅ Bot đã đăng nhập: ${client.user.tag}`
    );

    console.log(
        `📚 Tổng nhân vật: ${Object.keys(characters).length}`
    );
});

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
        // CHỈ NHẬN LỆNH !
        // ========================================

        if (
            !content.startsWith("!")
        ) {
            return;
        }

        // ========================================
        // LẤY TỪ KHÓA
        // ========================================

        const search =
            content
                .slice(1)
                .trim()
                .toLowerCase();

        // Ít nhất 3 ký tự
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

            const characterKey =
                String(key)
                    .toLowerCase();

            // ========================================
            // TÌM THEO TÊN
            // ========================================

            if (
                name.startsWith(search)
            ) {

                foundCharacter =
                    character;

                break;
            }

            // ========================================
            // TÌM THEO ALIAS
            // ========================================

            if (
                aliases.some(
                    alias =>
                        alias.startsWith(
                            search
                        )
                )
            ) {

                foundCharacter =
                    character;

                break;
            }

            // ========================================
            // TÌM THEO KEY
            // ========================================

            if (
                characterKey.startsWith(
                    search
                )
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

        // Chỉ xử lý button
        if (!interaction.isButton()) {
            return;
        }

        // ========================================
        // NÚT TRANG TRƯỚC / TRANG SAU
        // ========================================

        if (
            interaction.customId.startsWith(
                "page_prev_"
            ) ||
            interaction.customId.startsWith(
                "page_next_"
            )
        ) {

            // ========================================
            // CHỐNG ACK 2 LẦN
            // ========================================

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                return;
            }

            try {

                // ========================================
                // LẤY TRANG HIỆN TẠI
                // ========================================

                const parts =
                    interaction.customId
                        .split("_");

                const currentPage =
                    Number(
                        parts[
                            parts.length - 1
                        ]
                    );

                let newPage =
                    currentPage;

                // ========================================
                // TRANG TRƯỚC
                // ========================================

                if (
                    interaction.customId
                        .startsWith(
                            "page_prev_"
                        )
                ) {

                    newPage--;
                }

                // ========================================
                // TRANG SAU
                // ========================================

                if (
                    interaction.customId
                        .startsWith(
                            "page_next_"
                        )
                ) {

                    newPage++;
                }

                // ========================================
                // TÍNH TỔNG TRANG
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
                // GIỚI HẠN
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
                // ACK INTERACTION
                // ========================================

                await interaction.deferUpdate();

                // ========================================
                // TẠO LẠI TOÀN BỘ COMPONENT
                //
                // Emoji sẽ được đọc lại từ
                // characters.json ở đây.
                // ========================================

                const pageData =
                    createCharacterList(
                        newPage
                    );

                // ========================================
                // EDIT MESSAGE
                // ========================================

                await interaction.message.edit(
                    pageData
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
        // NÚT NHÂN VẬT
        // ========================================

        if (
            interaction.customId.startsWith(
                "char_"
            )
        ) {

            // ========================================
            // CHỐNG ACK 2 LẦN
            // ========================================

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                return;
            }

            // ========================================
            // LẤY KEY
            // ========================================

            const key =
                interaction.customId
                    .substring(5);

            const character =
                characters[key];

            // ========================================
            // KHÔNG TÌM THẤY
            // ========================================

            if (!character) {

                try {

                    await interaction.reply({
                        content:
                            "❌ Không tìm thấy nhân vật.",
                        ephemeral: true
                    });

                } catch (error) {

                    console.error(
                        "❌ Lỗi interaction:",
                        error
                    );
                }

                return;
            }

            // ========================================
            // LẤY TÊN NGƯỜI BẤM
            // ========================================

            const username =
                interaction.member
                    ?.displayName ||
                interaction.user.globalName ||
                interaction.user.username;

            // ========================================
            // GỬI ẢNH
            // ========================================

            try {

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
// LOGIN
// ========================================

client.login(
    process.env.TOKEN
);
