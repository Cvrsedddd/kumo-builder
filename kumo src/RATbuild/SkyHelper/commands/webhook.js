import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import * as db from "/root/SkyHelper/database.js";

export const data = new SlashCommandBuilder()
  .setName("webhook")
  .setDescription("Change the webhook.")
  .addStringOption((option) => option.setName("webhook").setDescription("The webhook to change to").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(client, interaction) {
  const webhook = interaction.options.getString("webhook");
  const isSet = await db.setWebhook(interaction.guild.id, webhook);
  if (isSet) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Success")
      .setDescription("Your webhook has been successfully changed.");
    await interaction.reply({ ephemeral: true, embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("❌ Error")
      .setDescription("Something went wrong. Please contact an administrator.");
    await interaction.reply({ ephemeral: true, embeds: [embed] });
  }
}
