import { EmbedBuilder } from "discord.js";

export default (client) => {
  client.getErrorEmbed = () => {
    return new EmbedBuilder().setColor("Red").setTitle("❌ Error");
  };

  client.logError = async (error) => {
    try {
      console.error(error);
      const channel = await client.channels.fetch(client.config.logs);
      const embed = new EmbedBuilder().setColor("Red").setTitle("❌ Error").setDescription(`\`\`\`${error}\`\`\``);
      channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  };

  client.sendErrorEmbed = async (interaction, error, type) => {
    try {
      const embed = client.getErrorEmbed().setDescription(`${error}`);
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
      } else {
        if (type == client.EDIT_REPLY) {
          return await interaction.editReply({
            embeds: [embed],
          });
        } else {
          return await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return true;
};
