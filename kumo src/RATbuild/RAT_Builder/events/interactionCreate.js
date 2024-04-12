import { Events } from "discord.js";

export const name = Events.InteractionCreate;
export async function execute(client, interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  const commandExists = await doesCommandExists(client, interaction, command);
  if (!commandExists) return;

  const onCooldown = await isOnCooldown(client, interaction, command);
  if (onCooldown) return;

  const rightTier = await isRightTier(client, interaction, command);
  if (!rightTier) return;

  try {
    await command.execute(client, interaction);
  } catch (error) {
    const timestamps = client.cooldowns.get(command.data.name);
    timestamps.delete(interaction.user.id);

    await client.logError(error);
    await client.sendErrorEmbed(interaction, "There was an error while executing this command!");

    if (interaction.commandName == "build") {
      client.isBuilding = false;
    }
  }
}

async function sendNotAllowed(client, interaction, tier) {
  if (typeof tier == "number") {
    var role = `<@&${client.config.tiers[tier]}>`;
  } else if (Array.isArray(tier)) {
    const roles = tier.map((tierNumber) => `<@&${client.config.tiers[tierNumber]}>`);
    var role = formatString(roles);
  }
  await client.sendErrorEmbed(interaction, `This command is only available to ${role}!`);
}

function formatString(arr) {
  if (arr.length == 0) {
    return "";
  } else if (arr.length == 1) {
    return arr[0];
  } else if (arr.length == 2) {
    return `${arr[0]} and ${arr[1]}`;
  } else {
    const lastVar = arr.pop();
    return `${arr.join(", ")} and ${lastVar}`;
  }
}

async function doesCommandExists(client, interaction, command) {
  if (!command) {
    await client.sendErrorEmbed(interaction, `\`\`\`No command matching ${interaction.commandName} was found.\`\`\``);
    await client.logError(`No command matching ${interaction.commandName} was found.`);
    return false;
  }
  return true;
}

async function isOnCooldown(client, interaction, command) {
  if (!client.config.devs.includes(interaction.user.id)) {
    const timestamps = client.cooldowns.get(command.data.name);
    const now = Date.now();

    if (typeof command.cooldown == "object" && !Array.isArray(command.cooldown)) {
      const planType = await client.db.getPlan(interaction, interaction.user.id);
      var cooldown = command.cooldown[planType];
    } else {
      var cooldown = command.cooldown;
    }
    cooldown = (cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id) + cooldown;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        await client.sendErrorEmbed(interaction, `You are on cooldown. You can use it again <t:${expiredTimestamp}:R>`);
        return true;
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldown);
    return false;
  }
  return false;
}

async function isRightTier(client, interaction, command) {
  if (command.tier) {
    const planType = await client.db.getPlan(interaction, interaction.user.id);
    const planNumber =
      planType == client.TIER_3 ? 3 : planType == client.TIER_2 ? 2 : planType == client.TIER_1 ? 1 : 0;

    if (typeof command.tier == "number") {
      if (command.tier !== planNumber) {
        await sendNotAllowed(client, interaction, command.tier);
        return false;
      }
      return true;
    } else if (Array.isArray(command.tier)) {
      if (!command.tier.includes(planNumber)) {
        await sendNotAllowed(client, interaction, command.tier);
        return false;
      }
      return true;
    } else if (typeof command.tier == "object" && !Array.isArray(command.tier)) {
      const subcommand = interaction.options.getSubcommand();
      const tier = command.tier[subcommand];

      if (typeof tier == "number") {
        if (tier !== planNumber) {
          await sendNotAllowed(client, interaction, tier);
          return false;
        }
        return true;
      } else if (Array.isArray(tier)) {
        if (!tier.includes(planNumber)) {
          await sendNotAllowed(client, interaction, tier);
          return false;
        }
        return true;
      }
    }
  } else {
    return true;
  }
  return false;
}
