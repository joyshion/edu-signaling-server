let Server = require('./server');
let middleware = require('./middleware');
let socketHandle = require('./socketHandle');
let httpHandle = require('./httpHandle');

new Server()
    .socketUse(middleware)
    .httpHandle(httpHandle)
    .socketHandle(socketHandle)
    .run();