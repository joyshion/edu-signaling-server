let config = {
    server: {
        port: 10800,
        https: {
            enable: true,
            key: './cert/domain.key',
            cert: './cert/domain.crt'
        }
    },
    database: {
        host: 'database_host_ip',
        user: 'root',
        password: '123456',
        database: 'test'
    },
    coturn: {
        auth_secret: '123456',
        lifecycle: 7200,
        server: '127.0.0.1:3478',
    }
};

module.exports = config;