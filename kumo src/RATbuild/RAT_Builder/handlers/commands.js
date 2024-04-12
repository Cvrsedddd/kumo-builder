import { Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ascii from "ascii-table";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const table = new ascii().setHeading("Command", "Load Status");

export default async (client) => {
  client.commands = new Collection();
  client.cooldowns = new Collection();
  const commandsPath = path.join(__dirname, "/../commands");
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      client.cooldowns.set(command.data.name, new Collection());
      table.addRow(file, "✅");
    } else {
      table.addRow(file, "❌ -> missing 'data' or 'execute'!");
    }
  }
  console.log(table.toString());

  return true;
};
