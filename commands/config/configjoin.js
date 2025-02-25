const variables = require("../../helpers/variables.js");
const Constants = require("../../helpers/constants");
const Command = require("../../structures/Command.js"),
    Discord = require("discord.js");

module.exports = class extends Command {
    constructor (client) {
        super(client, {
            name: "configjoin",
            enabled: true,
            aliases: [ "join", "joinconfig" ],
            clientPermissions: [ "EMBED_LINKS", "ADMINISTRATOR" ],
            permLevel: 2,

            slashCommandOptions: {
                description: "Configure the join messages"
            }
        });
    }

    async run (message, args, data) {

        const guildPlugins = await this.client.database.fetchGuildPlugins(message.guild.id);
        const plugin = guildPlugins.find((p) => p.pluginName === "join")?.pluginData;

        const opt = { filter: (m) => m.author.id === message.author.id, max: 1, time: 90000, errors: [ "time" ] };
        
        const str = plugin?.enabled ? message.translate("config/configjoin:DISABLE", {
            prefix: message.guild.settings.prefix
        }) : "";
        const msg = await message.sendT("config/configjoin:INSTRUCTIONS_1", {
            string: `${str}`,
            variables: variables.filter((v) => !v.ignore).map((variable) => `{${variable.name}} | ${message.translate(`config/configjoin:VARIABLE_${variable.name.toUpperCase()}`)}` + (variable.endPart ? "\n" : "")).join("\n")
        });

        let collected = await message.channel.awaitMessages(opt).catch(() => {});
        if (!collected || !collected.first()) return msg.error("common:CANCELLED", null, true);
        const confMessage = collected.first().content;
        if (confMessage === "cancel") return msg.error("common:CANCELLED", null, true);
        if (confMessage === message.guild.settings.prefix+"setjoin") return;
        collected.first().delete().catch(() => {});

        msg.sendT("config/configjoin:INSTRUCTIONS_2", null, true);

        collected = await message.channel.awaitMessages(opt).catch(() => {});
        if (!collected || !collected.first()) return msg.error("common:CANCELLED", null, true);
        const confChannel = collected.first();
        if (confChannel.content === "cancel") return msg.error("common:CANCELLED", null, true);
        const channel = confChannel.mentions.channels.first()
        || message.guild.channels.cache.get(confChannel.content)
        || message.guild.channels.cache.find((ch) => ch.name === confChannel.content || `#${ch.name}` === confChannel.content);
        if (!channel || channel.type === "voice") return msg.error("config/configjoin:CHANNEL_NOT_FOUND", {
            channel: confChannel.content
        }, true);
        collected.first().delete().catch(() => {});

        msg.sendT("config/configjoindm:SUCCESS", null, true);

        const embed = new Discord.MessageEmbed()
            .setTitle(message.translate("config/configjoin:TITLE"))
            .addField(message.translate("common:MESSAGE"), confMessage)
            .addField(message.translate("common:CHANNEL"), channel.toString())
            .addField(message.translate("common:TEST_IT"), message.translate("config/configjoin:TEST", {
                prefix: message.guild.settings.prefix
            }))
            .setThumbnail(message.author.avatarURL())
            .setColor(data.color)
            .setFooter(data.footer);
        message.channel.send({ embeds: [embed] });

        await this.client.database.updateGuildPlugin(message.guild.id, "join", {
            ...(plugin || {}),
            enabled: true,
            mainMessage: confMessage,
            channel: channel.id
        });

    }

    async runInteraction (interaction, data) {

        const guildPlugins = await this.client.database.fetchGuildPlugins(interaction.guild.id);
        const plugin = guildPlugins.find((p) => p.pluginName === "join")?.pluginData;

        const opt = { filter: (m) => m.author.id === interaction.user.id, max: 1, time: 90000, errors: [ "time" ] };
        
        const str = plugin?.enabled ? interaction.guild.translate("config/configjoin:DISABLE", {
            prefix: interaction.guild.settings.prefix
        }) : "";
        await interaction.reply({ content: interaction.guild.translate("config/configjoin:INSTRUCTIONS_1", {
            string: `${str}`,
            variables: variables.filter((v) => !v.ignore).map((variable) => `{${variable.name}} | ${interaction.guild.translate(`config/configjoin:VARIABLE_${variable.name.toUpperCase()}`)}` + (variable.endPart ? "\n" : "")).join("\n")
        }) });

        let collected = await interaction.channel.awaitMessages(opt).catch(() => {});
        if (!collected || !collected.first()) return interaction.editReply({ content: Constants.Emojis.ERROR + " " + interaction.guild.translate("common:CANCELLED") });
        const confMessage = collected.first().content;
        if (confMessage === "cancel") return interaction.editReply({ content: Constants.Emojis.SUCCESS + " " + interaction.guild.translate("common:CANCELLED") });
        if (confMessage === interaction.guild.settings.prefix+"setjoin") return;
        collected.first().delete().catch(() => {});

        interaction.editReply({ content: interaction.guild.translate("config/configjoin:INSTRUCTIONS_2") });

        collected = await interaction.channel.awaitMessages(opt).catch(() => {});
        if (!collected || !collected.first()) return interaction.editReply({ content: Constants.Emojis.ERROR + " " + interaction.guild.translate("common:CANCELLED") });
        const confChannel = collected.first();
        if (confChannel.content === "cancel") return interaction.editReply({ content: Constants.Emojis.SUCCESS + " " + interaction.guild.translate("common:CANCELLED") });
        const channel = confChannel.mentions.channels.first()
        || interaction.guild.channels.cache.get(confChannel.content)
        || interaction.guild.channels.cache.find((ch) => ch.name === confChannel.content || `#${ch.name}` === confChannel.content);
        if (!channel || channel.type === "voice") return interaction.editReply({ content: Constants.Emojis.ERROR + " " + interaction.guild.translate("config/configjoin:CHANNEL_NOT_FOUND", {
            channel: confChannel.content
        }) });
        collected.first().delete().catch(() => {});

        const embed = new Discord.MessageEmbed()
            .setTitle(interaction.guild.translate("config/configjoin:TITLE"))
            .addField(interaction.guild.translate("common:MESSAGE"), confMessage)
            .addField(interaction.guild.translate("common:CHANNEL"), channel.toString())
            .addField(interaction.guild.translate("common:TEST_IT"), interaction.guild.translate("config/configjoin:TEST", {
                prefix: interaction.guild.settings.prefix
            }))
            .setThumbnail(interaction.user.avatarURL())
            .setColor(data.color)
            .setFooter(data.footer);

        interaction.editReply({ content: interaction.guild.translate("config/configjoindm:SUCCESS"), embeds: [embed] });

        await this.client.database.updateGuildPlugin(interaction.guild.id, "join", {
            ...(plugin || {}),
            enabled: true,
            mainMessage: confMessage,
            channel: channel.id
        });

    }
};
