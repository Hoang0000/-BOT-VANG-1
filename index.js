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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ========================
// CẤU HÌNH
// ========================

// 12 nhân vật / trang
// 3 nút mỗi hàng × 4 hàng
// + 1 hàng chuyển trang = 5 hàng
const CHARACTERS_PER_PAGE = 12;


// ========================
// TẠO DANH SÁCH
// ========================

function createCharacterList(page = 0) {

    const allCharacters = Object.entries(characters);

    const totalPages = Math.max(
        1,
        Math.ceil(
            allCharacters.length / CHARACTERS_PER_PAGE
        )
    );

    const start =
        page * CHARACTERS_PER_PAGE;

    const pageCharacters =
        allCharacters.slice(
            start,
            start + CHARACTERS_PER_PAGE
        );

    // ========================
    // EMBED
    // ========================

    const embed = new EmbedBuilder()
        .setTitle("📋 THƯ VIỆN NHÂN VẬT")
        .setDescription(
            "Chọn nhân vật bên dưới để xem ảnh.\n\n" +
            `📄 Trang **${page + 1} / ${totalPages}**`
        );

    // ========================
    // NÚT NHÂN VẬT
    // ========================

    const rows = [];

    for (
        let i = 0;
        i < pageCharacters.length;
        i += 3
    ) {

        const row =
            new ActionRowBuilder();

        const rowCharacters =
            pageCharacters.slice(i, i + 3);

        for (
            const [key, character]
            of rowCharacters
        ) {

            const button =
                new ButtonBuilder()
                    .setCustomId(
                        `char_${key}`
                    )
                    .setLabel(
                        character.name.slice(0, 80)
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    );

            // ========================
            // ICON RIÊNG
            // ========================

            if (
                character.emoji &&
                character.emoji.id
            ) {

                button.setEmoji({
                    id: character.emoji.id,
                    name:
                        character.emoji.name ||
                        character.name
                });

            }

            row.addComponents(button);
        }

        rows.push(row);
    }


    // ========================
    // NÚT CHUYỂN TRANG
    // ========================

    const previous =
        new ButtonBuilder()
            .setCustomId(
                `page_prev_${page}`
            )
            .setLabel("Trang trước")
            .setEmoji("◀️")
            .setStyle(
                ButtonStyle.Primary
            )
            .setDisabled(page === 0);


    const pageNumber =
        new ButtonBuilder()
            .setCustomId("page_number")
            .setLabel(
                `${page + 1} / ${totalPages}`
            )
            .setStyle(
                ButtonStyle.Secondary
            )
            .setDisabled(true);


    const next =
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


    const navigation =
        new ActionRowBuilder()
            .addComponents(
                previous,
                pageNumber,
                next
            );

    rows.push(navigation);


    return {
        embeds: [embed],
        components: rows
    };
}


// ========================
// BOT READY
// ========================

client.once(
    "clientReady",
    () => {

        console.log(
            `✅ Đăng nhập: ${client.user.tag}`
        );

    }
);


// ========================
// XỬ LÝ !LIST + !TÊN
// ========================

client.on(
    "messageCreate",
    async (message) => {

        if (message.author.bot)
            return;

        if (!message.content.startsWith("!"))
            return;

        const cmd =
            message.content
                .slice(1)
                .trim()
                .toLowerCase();


        // ========================
        // !LIST
        // ========================

        if (cmd === "list") {

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


        // ========================
        // ÍT NHẤT 3 KÝ TỰ
        // ========================

        if (cmd.length < 3) {

            return message.reply(
                "❌ Hãy nhập ít nhất **3 ký tự**."
            );

        }


        // ========================
        // TÌM NHÂN VẬT
        // ========================

        const matches =
            Object.values(characters)
                .filter(character => {

                    const names = [
                        character.name,
                        ...(character.aliases || [])
                    ].map(name =>
                        name.toLowerCase()
                    );

                    return names.some(name =>
                        name.startsWith(cmd)
                    );

                });


        // ========================
        // KHÔNG TÌM THẤY
        // ========================

        if (matches.length === 0) {

            return message.reply(
                "❌ Không tìm thấy nhân vật."
            );

        }


        // ========================
        // NHIỀU KẾT QUẢ
        // ========================

        if (matches.length > 1) {

            const list =
                matches
                    .map(character =>
                        `• ${character.name}`
                    )
                    .join("\n");

            return message.reply(
                `🔎 **Có nhiều nhân vật phù hợp:**\n\n` +
                `${list}\n\n` +
                `➡️ Hãy nhập thêm vài ký tự.`
            );

        }


        // ========================
        // GỬI ẢNH
        // ========================

        const character =
            matches[0];

        try {

            await message.channel.send({

                content:
                    `**${character.name}**`,

                files: [
                    character.image
                ]

            });

        } catch (error) {

            console.error(
                "❌ Lỗi gửi ảnh:",
                error
            );

            await message.reply(
                `❌ Không thể gửi ảnh **${character.name}**.`
            );

        }

    }
);


// ========================
// XỬ LÝ BUTTON
// ========================

client.on(
    "interactionCreate",
    async (interaction) => {

        if (!interaction.isButton())
            return;


        // ========================
        // BẤM NHÂN VẬT
        // ========================

        if (
            interaction.customId
                .startsWith("char_")
        ) {

            const key =
                interaction.customId
                    .replace("char_", "");

            const character =
                characters[key];


            if (!character) {

                return interaction.reply({

                    content:
                        "❌ Không tìm thấy nhân vật. Dùng lệch !list để mở thư viện",

                    ephemeral: true

                });

            }


            try {

                await interaction.reply({

                    content:
                        `**${character.name}**`,

                    files: [
                        character.image
                    ]

                });

            } catch (error) {

                console.error(
                    "❌ Lỗi gửi ảnh:",
                    error
                );

                if (
                    !interaction.replied
                ) {

                    await interaction.reply({

                        content:
                            `❌ Không thể gửi ảnh **${character.name}**.`,

                        ephemeral: true

                    });

                }

            }

            return;
        }


        // ========================
        // CHUYỂN TRANG
        // ========================

        if (
            interaction.customId
                .startsWith("page_prev_") ||

            interaction.customId
                .startsWith("page_next_")
        ) {

            const currentPage =
                Number(
                    interaction.customId
                        .split("_")
                        .pop()
                );

            let newPage =
                currentPage;


            if (
                interaction.customId
                    .startsWith("page_prev_")
            ) {

                newPage--;

            }


            if (
                interaction.customId
                    .startsWith("page_next_")
            ) {

                newPage++;

            }


            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        Object.keys(characters).length /
                        CHARACTERS_PER_PAGE
                    )
                );


            if (newPage < 0)
                newPage = 0;

            if (newPage >= totalPages)
                newPage = totalPages - 1;


            try {

                await interaction.update(
                    createCharacterList(
                        newPage
                    )
                );

            } catch (error) {

                console.error(
                    "❌ Lỗi chuyển trang:",
                    error
                );

            }

            return;
        }

    }
);


// ========================
// ĐĂNG NHẬP
// ========================

client.login(
    process.env.TOKEN
);