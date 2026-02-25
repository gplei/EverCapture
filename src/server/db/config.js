export const dbType = process.env.DB_TYPE || 'mysql';
// export const dbType = 'sqlite';
export const mysql = {
  host: process.env.DB_HOST || 'localhost', // mysql only allow localhost to access
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ever_capture',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
export const sqlite = {
  filename: process.env.SQLITE_FILE || './server/db/EverCapture.db'
};
