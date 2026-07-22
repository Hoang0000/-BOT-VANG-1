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

    // Bỏ qua tin nhắn của bot
    if (message.author.bot) return;

    // Chỉ nhận lệnh bắt đầu bằng !
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
    // Phải nhập ít nhất 3 ký tự
    // ========================
    if (cmd.length < 3) {
        return message.reply("❌ Hãy nhập ít nhất **3 ký tự**.");
    }

    // ========================
    // Tìm các nhân vật bắt đầu bằng chuỗi nhập
    // ========================
    const matches = Object.entries(characters).filter(([key]) =>
        key.startsWith(cmd)
    );

    // Không tìm thấy
    if (matches.length === 0) {
        return message.reply("❌ Không tìm thấy nhân vật.");
    }

    // Có nhiều kết quả
    if (matches.length > 1) {

        const list = matches
            .map(([_, data]) => `• ${data.name}`)
            .join("\n");

        return message.reply(
            `🔎 Có nhiều nhân vật phù hợp:\n\n${list}\n\n➡️ Hãy nhập thêm vài ký tự.`
        );
    }

    // Chỉ có 1 kết quả
    const character = matches[0][1];

    return message.channel.send({
        content: `**${character.name}**`,
        files: [character.image]
    });

});

// Đăng nhập
client.login(process.env.TOKEN);