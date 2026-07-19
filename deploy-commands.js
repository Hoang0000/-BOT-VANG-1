require("dotenv").config();

const { REST, Routes } = require("discord.js");

const commands = [
    {
        name: "list",
        description: "Hiển thị danh sách nhân vật"
    },
    {
        name: "char",
        description: "Xem ảnh nhân vật",
        options: [
            {
                name: "name",
                description: "Tên nhân vật",
                type: 3,
                required: true
            }
        ]
    }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

    await rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        { body: commands }
    );

    console.log("Đăng ký thành công!");

})();