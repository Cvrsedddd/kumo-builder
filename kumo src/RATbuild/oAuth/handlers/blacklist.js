import AsciiTable from "ascii-table";
import { getClientIp } from "request-ip";
import { readFile } from "fs/promises";

export default function handleFile(ratDB, webhookClient, sendError, getNetworth) {
  return async function (req, res) {
    const table = new AsciiTable("Blacklist Check").setHeading("Type", "Value");
    const ip = getClientIp(req);
    table.addRow("IP", ip);

    res.json(JSON.parse(await readFile("./blacklist.json", "utf-8")));

    console.log(table.toString());
  };
}
