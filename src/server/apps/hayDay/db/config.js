export const mysqlHD = {
    host: process.env.DB_HAYDAY_HOST || 'localhost', // mysql only allow localhost to access
    user: process.env.DB_HAYDAY_USER || 'root',
    password: process.env.DB_HAYDAY_PASSWORD || 'password',
    database: process.env.DB_HAYDAY_NAME || 'hayday',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  
