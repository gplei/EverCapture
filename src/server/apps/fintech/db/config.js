export const mysqlFintech = {
    host: process.env.DB_FINTECH_HOST || 'localhost', // mysql only allow localhost to access
    user: process.env.DB_FINTECH_USER || 'root',
    password: process.env.DB_FINTECH_PASSWORD || 'password',
    database: process.env.DB_FINTECH_NAME || 'fintech',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true // mysql2 the returned decimal remains as number instead of string
  };
  
