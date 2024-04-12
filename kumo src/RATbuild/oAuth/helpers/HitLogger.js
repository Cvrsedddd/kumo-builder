import { WebhookClient, EmbedBuilder } from "discord.js";
import { readFile } from "fs/promises";

const { hitWebhookURL } = JSON.parse(await readFile(new URL("../config.json", import.meta.url)));
const webhookHitClient = new WebhookClient({ url: hitWebhookURL });

export default class HitLogger {
  constructor(ratType, networth) {
    this.ratType = ratType;
    this.networth = networth;
  }

  async send() {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle(`${this.ratType} Hit`)
      .setDescription(`Networth: **${this.networth}**`);
    await webhookHitClient.send({ embeds: [embed] });
  }
}
