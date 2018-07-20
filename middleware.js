let database = require('./database');

// 检查用户
function middleware(socket, next) {
    let type = socket.handshake.query.type;
    let token = socket.handshake.query.token;
    let course_id = socket.handshake.query.course_id;
    let teacher_id = socket.handshake.query.teacher_id;
    let student_id = socket.handshake.query.student_id;
    if (type && token && course_id && teacher_id && student_id) {
        let id;
        switch (type) {
            case 'teacher':
                id = teacher_id;
                break;
            case 'student':
                id = student_id;
                break;
        }

        if (checkToken(type, id, token)) {
            return next();
        } else {
            return next(new Error('Authentication error'));
        }
    }

    return next(new Error('Authentication error'));
}

async function checkToken(type, id, token) {
    let table = 'sc_' + type;
    let sql = 'select id from ' + table + ' where id = ' + id + ' and api_token = "' + token + '"';
    let result = await new database().query(sql);
    return result.length > 0;
}

module.exports = middleware;