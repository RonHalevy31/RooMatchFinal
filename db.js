const mysql = require("mysql2");
const dbConfig = require("./db.config.js");

const connection = mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB
});

connection.connect((err) => {
    if (err) {
        console.log("Connection failed:", err);
        return;
    }

    console.log("Connected to MySQL!");
});

module.exports = connection;