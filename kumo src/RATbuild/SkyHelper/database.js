import sqlite3 from "sqlite3";

var db = new sqlite3.Database("/root/SkyHelper/webhooks.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err && err.code == "SQLITE_CANTOPEN") {
    createDatabase();
  } else if (err) {
    console.error("[Error] " + err);
  }
});

export async function createTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS bots (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        owner VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        dhooked BOOLEAN NOT NULL
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
        guild_id VARCHAR(255) PRIMARY KEY NOT NULL,
        webhook VARCHAR(255) NOT NULL
      );`,
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

export async function getBots() {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM bots;`, (err, rows) => {
      if (err) {
        console.error(err);
      }
      return resolve(rows);
    });
  });
}

export async function getBotsByUserID(userID) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM bots WHERE owner = $1;`, userID, (err, rows) => {
      if (err) {
        console.error(err);
      }
      return resolve(rows);
    });
  });
}

export async function getBot(botID) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM bots WHERE id = $1;`, botID, (err, rows) => {
      if (err) {
        console.error(err);
      }
      rows.forEach((row) => {
        return resolve(row);
      });
      return resolve(null);
    });
  });
}

export async function getAllTokens() {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT token FROM bots;`, (err, rows) => {
      if (err) {
        console.error(err);
      }
      const tokens = rows.map((row) => row.token);
      return resolve(tokens);
    });
  });
}

export async function getBotID(token) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT id FROM bots WHERE token = $1;`, token, (err, rows) => {
      if (err) {
        console.error(err);
      }
      rows.forEach((row) => {
        return resolve(row.id);
      });
      return resolve(null);
    });
  });
}

export async function getGuildID(webhook) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT guild_id FROM webhooks WHERE webhook = $1;`, webhook, (err, rows) => {
      if (err) {
        console.error(err);
      }
      rows.forEach((row) => {
        return resolve(row.guild_id);
      });
      return resolve(null);
    });
  });
}

export async function getWebhook(guildID) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT webhook FROM webhooks WHERE guild_id = $1;`, guildID.toString(), (err, rows) => {
      if (err) {
        console.error(err);
      }
      rows.forEach((row) => {
        return resolve(row.webhook);
      });
      return resolve(null);
    });
  });
}

export async function setWebhook(guildID, webhook) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO webhooks (guild_id, webhook) VALUES ($1, $2);`,
      [guildID.toString(), webhook],
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

export async function setBot(id, userID, token, dhooked) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO bots (id, owner, token, dhooked) VALUES ($1, $2, $3, $4);`,
      [id, userID, token, dhooked],
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

export async function deleteBot(id) {
  return new Promise(function (resolve, reject) {
    db.run(`DELETE FROM bots WHERE id = $1;`, [id], (err) => {
      if (err) {
        console.error(err);
        return resolve(null);
      }
      return resolve(true);
    });
  });
}

function createDatabase() {
  db = new sqlite3.Database("/root/SkyHelper/webhooks.db", (err) => {
    if (err) {
      console.error("[Error] " + err);
    }
  });
}
