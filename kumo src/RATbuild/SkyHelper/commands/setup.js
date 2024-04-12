import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from "discord.js";
import * as db from "../database.js";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Setup the bot.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(client, interaction) {
  const guildID = interaction.guild.id;
  const webhook = await db.getWebhook(guildID);
  if (!webhook) {
    const modal = new ModalBuilder().setCustomId("setupWebhook").setTitle("Setup webhook");

    const webhookInput = new TextInputBuilder()
      .setCustomId("webhook")
      .setLabel("What's your webhook?")
      .setPlaceholder("https://discord.com/api/webhooks/.../...")
      .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(webhookInput);

    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  } else {
    const modal = new ModalBuilder().setCustomId("setupMessage").setTitle("Setup verification message");

    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("What should the title be?")
      .setPlaceholder("Please provide a title")
      .setStyle(TextInputStyle.Short);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("What should the description be?")
      .setPlaceholder("Please provide a description")
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);
  }
}
