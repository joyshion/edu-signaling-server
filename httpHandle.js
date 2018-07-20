let crypto = require('crypto');

function HttpHandle() {}

// 处理客户端消息
HttpHandle.prototype.invoke = function(app) {
    app.get('/admin', (request, response) => {
        // some response
        return response.status(403).send({'status': false, 'message': 'Forbidden'});
    });
};

module.exports = HttpHandle;