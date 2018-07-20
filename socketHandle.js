let database = require('./database');
let crypto = require('crypto');
let config = require('./config');

function socketHandle() {
    this.db = new database();
    this.room = 0;
}

// 处理客户端消息
socketHandle.prototype.invoke = function(io, socket) {
    // 根据连接类型创建/加入房间
    let type = socket.handshake.query.type;
    console.log(type);
    switch (type) {
        case 'teacher':
            this.createRoom(socket);
            break;
        case 'student':
            this.joinRoom(socket);
            break;
    }

    // 掉线
    socket.on('disconnect', reason => {
        io.in(this.room).emit('disconnect');
    });
    // 聊天信息
    socket.on('chat', data => {
        socket.to(this.room).emit('chat', data);
    });
    // 绘图
    socket.on('draw', data => {
        socket.to(this.room).emit('draw', data);
    });
    // 自定义
    socket.on('event', data => {
        socket.to(this.room).emit('event', data);
    });
    // 信令交换
    socket.on('data', data => {
        socket.to(this.room).emit('data', data);
    });
    // ready
    socket.on('ready', data => {
        io.in(this.room).emit('ready');
    });
};

// 创建房间
socketHandle.prototype.createRoom = function(socket) {
    this.roomIsExist(socket).then(id => {
        let room_id;

        if (id) {
            // 房间已存在
            room_id = id;
        } else {
            // 房间不存在
            let time = Math.floor(Date.now() / 1000);
            let course_id = socket.handshake.query.course_id;
            let teacher_id = socket.handshake.query.teacher_id;
            let student_id = socket.handshake.query.student_id;
            let sql = 'insert into sc_room (room_id, teacher_id, student_id, course_id, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?)';
            let values = [time, teacher_id, student_id, course_id, time, time];
            this.db.query(sql, values).then(result => {
                room_id = time;
            }).catch(error => {
                socket.emit('create_room_error', error);
            });
        }

        this.room = this.getRoomName(room_id);
        let data = {
            room_id: room_id,
            iceServers: this.getICE(socket)
        };
        // 给当前连接的客户端返回config信息
        socket.emit('config', data);
        // 进入房间
        socket.join(this.room, () => {
            socket.to(this.room).emit('join');
        });
    }).catch(error => {
        socket.emit('create_room_error', error);
    });
}

// 加入房间
socketHandle.prototype.joinRoom = function(socket) {
    this.roomIsExist(socket).then(id => {
        // 房间存在则进入
        this.room = this.getRoomName(id);
        let data = {
            room_id: id,
            iceServers: this.getICE(socket)
        };
        // 给当前连接的客户端返回config信息
        socket.emit('config', data);
        // 进入房间
        socket.join(this.room, () => {
            socket.to(this.room).emit('join');
        });
    }).catch(error => {
        // 房间不存在
        socket.emit('room_not_exist', error);
    });
}

// 判断房间是否存在
socketHandle.prototype.roomIsExist = function(socket) {
    let course_id = socket.handshake.query.course_id;
    let teacher_id = socket.handshake.query.teacher_id;
    let student_id = socket.handshake.query.student_id;

    let sql = 'select room_id from sc_room where course_id = ' + course_id + ' and teacher_id = ' + teacher_id + ' and student_id = ' + student_id + ' and end_time = 0 order by start_time desc';

    return new Promise((resolve, reject) => {
        this.db.query(sql).then(result => {
            if (result.length > 0) {
                resolve(result[0].room_id);
            } else {
                resolve(false);
            }
        }).catch(error => {
            reject(error);
        });
    });
}

// 获取房间名称
socketHandle.prototype.getRoomName = function(id) {
    return 'room_' + id;
}

// 获取iceServers信息(coturn rest api)
socketHandle.prototype.getICE = function(socket) {
    let timestamp = Math.floor(Date.now() / 1000) + config.coturn.lifecycle;
    let username = timestamp + ':' + socket.handshake.query.token;
    let password = this.hmac(config.coturn.auth_secret, username);
    return [
        {
            urls: [
                'stun:' + config.coturn.server
            ]
        },
        {
            urls: 'turn:' + config.coturn.server,
            username: username,
            credential: password
        }
    ];
}

// sha1
socketHandle.prototype.hmac = function(key, content) {
    let hmac = crypto.createHmac('sha1', key);
    hmac.setEncoding('base64');
    hmac.write(content);
    hmac.end();
    return hmac.read();
}

module.exports = socketHandle;