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

import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

export default connection;

