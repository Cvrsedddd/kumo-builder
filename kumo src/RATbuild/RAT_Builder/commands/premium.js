import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("premium")
  .setDescription("Makes an user premium and applies the role.")
  .addUserOption((option) => option.setName("user").setDescription("The user to make premium.").setRequired(true))
  .addStringOption((option) =>
    option
      .setName("tier")
      .setDescription("The tier to apply to the user.")
      .setRequired(true)
      .addChoices(
        { name: "Tier 1", value: "tier_1" },
        { name: "Tier 2", value: "tier_2" },
        { name: "Tier 3", value: "tier_3" }
      )
  )
  .addIntegerOption((option) =>
    option.setName("months").setDescription("Amount of months to expire after.").setMinValue(1).setMaxValue(24)
  )
  .addIntegerOption((option) =>
    option.setName("weeks").setDescription("Amount of months to expire after.").setMinValue(1).setMaxValue(4)
  )
  .addIntegerOption((option) =>
    option.setName("days").setDescription("Amount of months to expire after.").setMinValue(1).setMaxValue(7)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false);

export async function execute(client, interaction) {
  const user = interaction.options.getUser("user");
  const tier = interaction.options.getString("tier");
  const userID = user.id;
  const isPremium = (await client.db.getPlan(interaction, userID)) != client.TIER_0;

  if (isPremium) {
    await client.db.deletePremium(userID);

    try {
      const member = await interaction.guild.members.fetch(userID);
      await member.roles.remove(client.config.tiers[1]);
      await member.roles.remove(client.config.tiers[2]);
      await member.roles.remove(client.config.tiers[3]);
    } catch (err) {
      client.logError(err);
    }
  } else {
    var expiration = 0;
    const months = interaction.options.getInteger("months");
    const weeks = interaction.options.getInteger("weeks");
    const days = interaction.options.getInteger("days");
    if (typeof months == "number") {
      expiration = expiration + months * 30 * 24 * 60 * 60 * 1000;
    }
    if (typeof weeks == "number") {
      expiration = expiration + weeks * 7 * 24 * 60 * 60 * 1000;
    }
    if (typeof days == "number") {
      expiration = expiration + days * 24 * 60 * 60 * 1000;
    }

    await client.db.setPremium(userID, tier, expiration == 0 ? 0 : expiration + Date.now());

    try {
      const member = await interaction.guild.members.fetch(userID);
      if (tier == client.TIER_1) await member.roles.add(client.config.tiers[1]);
      if (tier == client.TIER_2) await member.roles.add(client.config.tiers[2]);
      if (tier == client.TIER_3) await member.roles.add(client.config.tiers[3]);
    } catch (err) {
      client.logError(err);
    }
  }

  const congratzEmbed = new EmbedBuilder()
    .setColor("Yellow")
    .setTitle(":tada: Congratulations")
    .setDescription(
      `**${user.tag}** has successfully been promoted to <@&${
        tier == client.TIER_3
          ? client.config.tiers[3]
          : tier == client.TIER_2
          ? client.config.tiers[2]
          : tier == client.TIER_1
          ? client.config.tiers[1]
          : client.config.tiers[0]
      }>.`
    );

  const removedEmbed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("❌ Removed Premium")
    .setDescription(`**${user.tag}** has successfully been demoted to member.`);

  await interaction.reply({ embeds: [isPremium ? removedEmbed : congratzEmbed] });
}
