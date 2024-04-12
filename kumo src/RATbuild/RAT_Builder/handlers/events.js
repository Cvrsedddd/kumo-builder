import { Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ascii from "ascii-table";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const table = new ascii().setHeading("Event", "Load Status");

export default async (client) => {
  client.events = new Collection();
  const eventsPath = path.join(__dirname, "/../events");
  const eventsFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

  for (const file of eventsFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);
    if ("name" in event && "execute" in event) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }
      table.addRow(file, "✅");
    } else {
      table.addRow(file, "❌ -> missing 'name' or 'execute'!");
    }
  }
  console.log(table.toString());

  return true;
};
