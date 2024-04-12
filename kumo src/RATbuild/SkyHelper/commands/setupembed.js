import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setupembed")
  .setDescription("Setup an embed.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(client, interaction) {
  const modal = new ModalBuilder().setCustomId("setupEmbed").setTitle("Setup verification message");

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

  const linkInput = new TextInputBuilder()
    .setCustomId("link")
    .setLabel("What should the link be?")
    .setPlaceholder("Please provide a link")
    .setStyle(TextInputStyle.Short);

  const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
  const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(linkInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

  await interaction.showModal(modal);
}
