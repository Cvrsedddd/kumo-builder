import { Events, ActivityType, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

const staffBanLast15Mins = [];

export const name = Events.ClientReady;
export const once = true;
export async function execute(client, event) {
  await setActivity(client);
  setInterval(() => setActivity(client), 3600000);

  await setupBanWaveDetector(client);

  console.log(`[RAT Builder] ${event.user.tag} is ready to build some RATs!`);
}

const setActivity = async (client) => {
  client.user.setPresence({
    activities: [{ name: `/build | by @bmrmr`, type: ActivityType.Playing }],
    status: "online",
  });
};

const setupBanWaveDetector = async (client) => {
  const channel = await client.channels.fetch(client.config.banWaveDetector);
  await channel.bulkDelete(50);

  const msg = await checkBans(client, channel, null, true);
  setInterval(checkBans, 60000, client, channel, msg);
};

const getBanDiff = async () => {
  return staffBanLast15Mins.length > 1
    ? Math.abs(staffBanLast15Mins[staffBanLast15Mins.length - 1] - staffBanLast15Mins[0])
    : 0;
};

const getBanTimeDiff = async () => {
  return staffBanLast15Mins.length > 1 ? staffBanLast15Mins.length - 1 : 0;
};

const checkBans = async (client, channel, msg, send) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch("https://api.plancke.io/hypixel/v1/punishmentStats");
      const data = await response.json();

      staffBanLast15Mins.push(data.record.staff_total);
      if (staffBanLast15Mins.length == 17) staffBanLast15Mins.shift();

      const banTimeDiff = await getBanTimeDiff();
      const banDiff = await getBanDiff();

      const embed = new EmbedBuilder().setTitle("Ban Wave Detector").setTimestamp();

      if (banDiff / banTimeDiff >= 30 / 15) {
        embed.setColor("Red");
        embed.addFields(
          {
            name: "❗ Status ❗",
            value: "Ban-Wave detected",
            inline: false,
          },
          {
            name: "🔨 Banned Count",
            value: `${await getBanDiff()} players have been banned in the past ${await getBanTimeDiff()} minutes`,
            inline: false,
          }
        );
      } else if (banDiff / banTimeDiff >= 15 / 15) {
        embed.setColor("Yellow");
        embed.addFields(
          {
            name: "⚠️ Status ⚠️",
            value: "Be Careful",
            inline: false,
          },
          {
            name: "🔨 Banned Count",
            value: `${await getBanDiff()} players have been banned in the past ${await getBanTimeDiff()} minutes`,
            inline: false,
          }
        );
      } else {
        embed.setColor("Green");
        embed.addFields(
          {
            name: "✅ Status ✅",
            value: "No Ban-Wave detected",
            inline: false,
          },
          {
            name: "🔨 Banned Count",
            value: `${await getBanDiff()} players have been banned in the past ${await getBanTimeDiff()} minutes`,
            inline: false,
          }
        );
      }

      if (send) {
        const message = await channel.send({ embeds: [embed] });
        return resolve(message);
      } else if (msg) {
        await msg.edit({ embeds: [embed] });
        return resolve();
      }
    } catch (e) {
      client.logError(e);
      return resolve();
    }
  });
};
