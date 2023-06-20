import pgp from "pg-promise";

const connections = [];

export default class DataBase {
  static async getConnection() {
    const dbName = process.env.DB_NAME;

    if (!connections[dbName]) {
      const dbUser = process.env.DB_USER;
      const dbPassword = process.env.DB_PASS;
      const dbHost = process.env.DB_HOST;
      const dbPort = process.env.DB_PORT;

      const dbc = pgp({ capSQL: true });
      console.log(`Opening connection to: ${dbName}, host is: ${dbHost}`);

      const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
      connections[dbName] = dbc(connectionString);
    }

    return connections[dbName];
  }

  static async executeQuery(query, params) {
    try {
      const date1 = new Date().getTime();
      const connection = await this.getConnection();
      const result = await connection.any(query, params);

      const date2 = new Date().getTime();
      const durationMs = date2 - date1;
      const durationSeconds = Math.round(durationMs / 1000);
      let dataLength = 0;

      if (result && result.length) dataLength = result.length;

      console.log(
        `[Redshift] [${durationMs}ms] [${durationSeconds}s] [${dataLength.toLocaleString()} records] ${query}`
      );

      return result;
    } catch (e) {
      console.error(`Error executing query: ${query} Error: ${e.message}`);
      throw e;
    }
  }
}
 