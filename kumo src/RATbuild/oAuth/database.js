import sqlite3 from "sqlite3";

var db = new sqlite3.Database("/root/oAuth/webhooks.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err && err.code == "SQLITE_CANTOPEN") {
    createDatabase();
  } else if (err) {
    console.error("[oAuth] " + err);
  }
});

function createDatabase() {
  db = new sqlite3.Database("/root/oAuth/webhooks.db", (err) => {
    if (err) {
      console.error("[oAuth] " + err);
    }
  });
}

export async function createTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS webhooks (
        code VARCHAR(255) PRIMARY KEY NOT NULL,
        owner VARCHAR(255) NOT NULL,
        webhook VARCHAR(255) NOT NULL,
        dhooked BOOLEAN NOT NULL
      );`,
      (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }
    );
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

export async function getWebhooks(userID) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE owner = $1;`, userID, (err, rows) => {
      if (err) {
        console.error(err);
      }
      return resolve(rows);
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

export async function getCode(userID, webhook) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE owner = $1 AND webhook = $2;`, [userID, webhook], (err, rows) => {
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

export async function setWebhook(code, userID, webhook, dhooked = true) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO webhooks (code, owner, webhook, dhooked) VALUES ($1, $2, $3, $4);`,
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
      }
      return resolve();
    });
  });
}
