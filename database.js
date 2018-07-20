let mysql = require('mysql');
let config = require('./config');

function Database() {
    this.pool = mysql.createPool(config.database);
    return this;
}

Database.prototype.query = function(sql, values) {
    // 返回Promise对象
    return new Promise((resolve, reject) => {
        this.pool.getConnection((error, conn) => {
            if (error) reject(error);
            conn.query(sql, values, (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
                conn.release();
            });
        });
    });
}

module.exports = Database;