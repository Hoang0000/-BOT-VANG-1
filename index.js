require("dotenv").config();

const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const characters = require("./characters.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot sẵn sàng
client.once("clientReady", () => {
    console.log(`✅ Đăng nhập: ${client.user.tag}`);
});

// Xử lý tin nhắn
client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    if (!message.content.startsWith("!")) return;

    const cmd = message.content.slice(1).trim().toLowerCase();

    // ========================
    // !list
    // ========================
    if (cmd === "list") {

        const list = Object.values(characters)
            .map(c => `• ${c.name}`)
            .join("\n");

        return message.channel.send({
            content: `📋 **Danh sách nhân vật**\n\n${list}`
        });
    }

    // ========================
    // Ít nhất 3 ký tự
    // ========================
    if (cmd.length < 3) {
        return message.reply("❌ Hãy nhập ít nhất **3 ký tự**.");
    }

    // ========================
    // Tìm kiếm
    // ========================
    const matches = [];

    for (const character of Object.values(characters)) {

        // Key chính
        const names = [
            character.name.toLowerCase(),
            ...(character.aliases || []).map(a => a.toLowerCase())
        ];

        if (names.some(name => name.startsWith(cmd))) {
            matches.push(character);
        }
    }

    // Không tìm thấy
    if (matches.length === 0) {
        return message.reply("❌ Không tìm thấy nhân vật. Nhập lệnh !list để tìm");
    }

    // Có nhiều kết quả
    if (matches.length > 1) {

        const list = matches
            .map(c => `• ${c.name}`)
            .join("\n");

        return message.reply(
            `🔎 Có nhiều nhân vật phù hợp:\n\n${list}\n\n➡️ Hãy nhập thêm vài ký tự.`
        );
    }

    const character = matches[0];

    try {

        await message.channel.send({
            content: `**${character.name}**`,
            files: [character.image]
        });

    } catch (err) {

        console.error(err);

        return message.reply(
            `❌ Không thể gửi ảnh.\nĐường dẫn: ${character.image}`
        );

    }

});
//buff
// Đăng nhập
client.login(process.env.TOKEN);

