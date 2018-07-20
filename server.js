let Express = require('express');
let Http = require('http');
let Https = require('https');
let SocketIO = require('socket.io');
let fs = require("fs");
let config = require('./config');

function Server() {
    this.app = new Express();
    if (config.server.https.enable) {
        let options = {
            key: fs.readFileSync(config.server.https.key),
            cert: fs.readFileSync(config.server.https.cert)
        };
        this.webServer = new Https.createServer(options, this.app);
    } else {
        this.webServer = new Http.Server(this.app);
    }
    this.io = new SocketIO(this.webServer);
}

// 启动服务
Server.prototype.run = function() {
    this.webServer.listen(config.server.port, () => {
        console.log('Signaling server listening on *:%d', config.server.port);
    });
    this.io.on('connection', (socket) => {
        console.log('a client is connected, id:' + socket.id);
        if (this.socketHandle) {
            this.socketHandle.invoke(this.io, socket);
        }
    });
    if (this.httpHandle) {
        this.httpHandle.invoke(this.app);
    }
};

// 注册socket中间件
Server.prototype.socketUse = function(middleware) {
    this.io.use((socket, next) => { new middleware(socket, next) });
    return this;
}

// 注册http中间件
Server.prototype.httpUse = function(middleware) {
    this.app.use((request, response, next) => { new middleware(request, response, next) });
    return this;
}

// 注册websocket消息监听
Server.prototype.socketHandle = function(handle) {
    this.socketHandle = new handle();
    return this;
};

// 注册http消息监听
Server.prototype.httpHandle = function(handle) {
    this.httpHandle = new handle();
    return this;
};

module.exports = Server;