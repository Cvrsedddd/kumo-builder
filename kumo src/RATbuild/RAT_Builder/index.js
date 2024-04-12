import { Client, GatewayIntentBits } from "discord.js";
import { token } from "./config.js";

import commandHandler from "./handlers/commands.js";
import eventHandler from "./handlers/events.js";
import errorHandler from "./handlers/errors.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.db = import("./database.js");
client.config = import("./config.js");
client.skyhelper = import("/root/SkyHelper/index.js");
client.isBuilding = false;
client.isInjecting = false;
client.isPumping = false;
client.TIER_0 = "tier_0";
client.TIER_1 = "tier_1";
client.TIER_2 = "tier_2";
client.TIER_3 = "tier_3";
client.EDIT_REPLY = "edit_reply";

async function start() {
  client.db = await client.db;
  client.config = await client.config;
  client.skyhelper = await client.skyhelper;

  client.db.createTables();
  client.skyhelper.init();

  await commandHandler(client);
  await eventHandler(client);
  await errorHandler(client);

  client.login(token);
}

start();
