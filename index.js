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
    // !TênNhânVật
    // ========================
    const character = characters[cmd];

    if (!character) return;

    return message.channel.send({
        content: `**${character.name}**`,
        files: [character.image]
    });

});

// Đăng nhập
client.login(process.env.TOKEN);