import { REST } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

export default async function registerCommands(token, id) {
  return new Promise(async (resolve, reject) => {
    const rest = new REST({ version: "10" }).setToken(token);
    try {
      await rest.put(`/applications/${id}/commands`, { body: commands });

      return resolve(true);
    } catch (error) {
      return resolve(false);
    }
  });
}
