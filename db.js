// npm i mysql2
const mysql = require("mysql2/promise")
require("dotenv").config()

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE, // colocar o nome do seu BD
    multipleStatements: true,
})

module.exports = Object.freeze({
    pool: pool
})
