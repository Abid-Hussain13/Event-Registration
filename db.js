// import mysql from 'mysql';

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',        
//     password: '',        
//     database: 'users'
// });

// db.connect((err) => {
//     if (err) {
//         console.error('Database connection failed:', err.stack);
//         return;
//     }
//     console.log('Connected to MySQL database.');
// });

// export default db;


/////////////////// Database Setup to Run of Railways.com ////////////////////////

// db.js

// import mysql from "mysql2";
// import dotenv from "dotenv";

// dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.MYSQLHOST,
//   user: process.env.MYSQLUSER,
//   password: process.env.MYSQLPASSWORD,
//   database: process.env.MYSQLDATABASE,
//   port: process.env.MYSQLPORT,
//   waitForConnections: true,
//   connectionLimit: 10,   // Maximum number of connections
//   queueLimit: 0          // Unlimited request queue
// });

// export default pool;


/////////////////////////// database convert to postgres for neon /////////////////////////
// db.js - Correct setup for Neon PostgreSQL
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  }
});

export default pool;