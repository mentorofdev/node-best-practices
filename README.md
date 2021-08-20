Nodejs Best Practices Restful API With Authenticator

Chào AE hôm này mình lại tiếp tục chia sẻ bài viết về một lĩnh vực khá phổ biến trong những năm gần đây đó là làm sao để thiết kế một hệ thống Back-End (API Rest) chuẩn cho việc phát triển hệ thống lớn?

Câu hỏi đặt ra là :

Như thế nào là chuẩn?
Làm sao biết được cấu trúc dự án là phù hợp?
Đặt tên class, tên biến đúng hết chưa? và hàng trăm câu hỏi nữa đặt ra từ những bạn thực tập sinh, nhân viên mới đi làm và kể cả những bạn đã làm một thời gian.
Hôm này mình xin chia sẻ 1 chút kinh nghiệm của bản thân khi làm dự án tương đối lớn kết hợp rất nhiều Service(API) viết bằng nhiều ngôn ngữ khác nhau như: Python, Java, Node, Ruby, PHP… Cụ thể trong bài viết này mình chia sẻ dựa trên việc thiết kế một Module nhỏ trong hệ thống MicroService dựa trên NodeJS để triển khai.

Project structure

Router/
| authRoutes.js
| deviceRoutes.js
| index.js
| userRoutes.js
middleware/
| auth-api.js
| password-hash.js
Controller/
| authController.js
| deviceController.js
| index.js
| userController.js
Config/
| config.js
| database.js
| logger.js
| logs/
| error.log

package.json
server.js
.env
Ok, Tới đây thì AE thấy khá rõ về cấu trúc của một project mà mình đã lên rồi, giờ mình sẽ đi chi tiết từng phần của project để AE có cái nhìn rõ hơn về project này.

2. Config

Trong folder Config sẽ chứa những tập tin về cấu hình hệ thống, kết nối database, ghi logs …

Đầu tiên là folder logs -> error.log : Tập tin này sẽ ghi lại toàn bộ những logs của project trong quá trình chạy .

2020-04-16 15:24:23 error : Successfully connected to postgre :postgre.database.mentorofdev.com
2020-04-16 16:46:54 error : Error in connecting Db
2020-04-16 19:41:19 error : Error occured in DB Error: read ECONNRESET
2020-04-16 19:41:19 error : Error occured in DB Error: Connection terminated unexpectedly
2020-04-16 23:39:17 error : Error in connecting Db
2020-04-16 23:39:36 error : Error in connecting Db
2020-04-17 00:29:54 error : Error in connecting Db :Error: read ECONNRESET
2020-04-18 11:33:49 error : undefined
2020-04-18 11:36:49 error : undefined
2020-04-18 11:36:50 error : undefined
2020-04-18 11:39:29 error : Failing row contains (4, tuan@aloapp.vn , null, ADMIN).
2020-04-18 11:42:44 error : Failing row contains (5, tuan@aloapp.vn , null, ADMIN).
2020-04-18 11:59:05 error : undefined
2020-04-18 11:59:40 error : undefined
2020-04-18 12:00:21 error : {"name":"error","length":89,"severity":"ERROR","code":"22001","file":"varchar.c","line":"309","routine":"bpchar"}
2020-04-18 12:01:57 error : {}
2020-04-18 12:05:46 error : {}
2020-04-18 12:28:35 error : {}
2020-04-18 12:34:07 error : {}
2020-04-18 12:41:34 error : {}
2020-04-18 12:43:23 error : {}
2020-04-18 12:45:37 error : {}
2020-04-18 12:50:04 error : undefined
2020-04-18 12:51:36 error : undefined
2020-04-18 12:52:54 error : undefined
2020-04-18 12:53:54 error : undefined
2020-04-18 12:58:54 error : undefined
2020-04-18 13:03:57 error : undefined
2020-04-18 13:04:47 error : undefined
2020-04-18 13:07:45 error : undefined
2020-04-18 13:11:39 error : {"name":"error","length":91,"severity":"ERROR","code":"42601","position":"73","file":"scan.l","line":"1126","routine":"scanner_yyerror"}
2020-04-20 12:04:45 error : Error in connecting Db :Error: getaddrinfo ENOTFOUND swt-psql-server.postgres.database.azure.com swt-psql-server.postgres.database.azure.com:5432
2020-04-20 12:05:26 error : Error in connecting Db :Error: read ECONNRESET
2020-04-20 12:08:49 error : Error in connecting Db :Error: Connection terminated due to connection timeout
2020-04-20 17:39:08 error : Error in connecting Db :Error: read ECONNRESET
2020-04-21 19:37:01 error : {"name":"error","length":238,"severity":"ERROR","code":"23503","detail":"Key (client_id)=(15) is not present in table \"client_tbl\".","schema":"public","table":"cust_tbl","constraint":"client_id","file":"ri_triggers.c","line":"2784","routine":"ri_ReportViolation"}
config.js :

const env = require('dotenv');
env.config();
module.exports = {
port: process.env.port,
db_config: {

        host: process.env.host,

        user: process.env.user,

        password: process.env.password,

        database: process.env.database,

        ssl: true,

    },
    roles: {
        ADMIN: 'ADMIN',
        CLIENT: 'CLIENT',
        CUSTOMER: 'CUSTOMER'
    },
    jwt_secret: "Diatoz@123"

};
database.js:

const { Pool } = require("pg");
const { db_config } = require("./config");
const logger = require("./logger")(module);

const pool = new Pool(
db_config
);
pool.connect((err, res) => {
if (err) {
logger.error(`Error in connecting Db :${err}`);
} else {
logger.info(`Successfully connected to postgre :${db_config.host}`)
}
});

pool.on("error", (err) => {
logger.error(`Error occured in DB ${err}`)
})

const query = (query, param) => {
logger.info(`TO execute ${query}`)
return new Promise((resolve, reject) => {
pool.query(query, param).then(res => {
resolve(res);
}).catch(err => {
reject(err)
})
})
}

module.exports.query = query;
logger.js

const { format, transports, createLogger,addColors } = require("winston");
const path = require("path");
const fileDir = path.join(\_\_dirname, "logs/error.log");
const colors = {
error: 'red',
warn: 'yellow',
info: 'green',
http: 'blue',
debug: 'white',
}

const Logger = (...args) => {
addColors(colors);
return createLogger({
format: format.combine(
format.prettyPrint(),
format.label({ label: getLabel(args[0]) }),
format.timestamp({
format: 'YYYY-MM-DD HH:mm:ss'
})),
level: 'http',
transports: [
new transports.Console({
format: format.combine(format.colorize({
all:true
}),
format.splat(),
format.printf(({timestamp,level,label,message,...meta}) => `${timestamp} ${level} [${label?label:""}]: ${message}, ${(Object.keys(meta).length!=0)?JSON.stringify(meta):''}`)
)
}),
new transports.File({
filename: `${fileDir}`,
level: 'error',
format: format.combine(format.printf(info => `${info.timestamp} ${info.level} : ${info.message}`))
})
]
})
}

const getLabel = (directory) => {
if(directory){
const parts = directory.filename.split(path.sep);
return path.join(parts[parts.length - 2], parts.pop());
}else{
return null;
}
}

module.exports = Logger; 3. Controller

Đây là nơi chứa những class liên quan tới logic hệ thống, query database nhận request từ router và trả response lại cho client

authController.js

const logger = require("../Config/logger")(module);

const authenticate = (req, res) => {
logger.info("to autheticate");
}

module.exports = {
authenticate
}
userController.js

class này dùng để xử lý việc thêm nhân viên mới vào database

const logger = require("../Config/logger")(module);
const { roles } = require("../Config/config");
const db = require("../Config/database");
const { passwordHash } = require("../middleware/password-hash");
const saveClient = async (req, res) => {
logger.info("REST request to save Client details");
var adminDetails = req.body;
var hashPassword = await passwordHash.generateHashPwd(adminDetails.password);
try {
await db.query("BEGIN");
var userInsert = 'INSERT INTO user_tbl(user_name,password,role) VALUES($1,$2,$3)';
await db.query(userInsert, [adminDetails.userName,
hashPassword, roles.CLIENT]);
var clientInsert = 'INSERT INTO client_tbl(user_name,name) VALUES($1,$2)';
await db.query(clientInsert, [adminDetails.userName,
adminDetails.name])
await db.query("COMMIT");

        res.status(200).json({
            message: "Client Registered successfully"
        });
    } catch (error) {
        logger.error(JSON.stringify(error));
        await db.query("ROLLBACK");
        res.status(500).json({
            message: error
        });
    }

}

const saveCustomer = async (req, res) => {
logger.info("REST request to save Customer details");
var adminDetails = req.body;
var hashPassword = await passwordHash.generateHashPwd(adminDetails.password);
try {
await db.query("BEGIN");
var userInsert = 'INSERT INTO user_tbl(user_name,password,role) VALUES($1,$2,$3)';
await db.query(userInsert, [adminDetails.userName,
hashPassword, roles.CUSTOMER]);
var customerInsert = 'INSERT INTO cust_tbl(name,address,client_id) VALUES($1,$2,$3)';
await db.query(customerInsert, [adminDetails.name,
adminDetails.address, adminDetails.clientId])
await db.query("COMMIT");

        res.status(200).json({
            message: "Customer Registered successfully"
        });
    } catch (error) {
        logger.error(JSON.stringify(error));
        await db.query("ROLLBACK");
        res.status(500).json({
            message: error
        });
    }

}

const saveAdmin = async (req, res) => {
logger.info("REST request to save admin details");
var adminDetails = req.body;
var hashPassword = await passwordHash.generateHashPwd(adminDetails.password);
try {
await db.query("BEGIN");
var userInsert = 'INSERT INTO user_tbl(user_name,password,role) VALUES($1,$2,$3)';
await db.query(userInsert, [adminDetails.userName,
hashPassword, roles.ADMIN]);
var clientInsert = 'INSERT INTO client_tbl(user_name,name) VALUES($1,$2)';
await db.query(clientInsert, [adminDetails.userName,
adminDetails.name])
await db.query("COMMIT");

        res.status(200).json({
            message: "Admin Registered successfully"
        });
    } catch (error) {
        logger.error(JSON.stringify(error));
        await db.query("ROLLBACK");
        res.status(500).json({
            message: error
        });
    }

}

module.exports = {
saveClient,
saveCustomer,
saveAdmin
}
deviceController.js -> Xử lý lấy thông tin của các thiết bị được lưu trong database

const logger = require("../Config/logger")(module);
const db = require("../Config/database");
const getAllDevice = (req, res) => {
logger.debug("Rest request to retrieve all Details");
db.query("SELECT \* FROM dev_tbl", null).then(res => {
console.log(res)
}).catch(err => {
console.log(err)
})
}

module.exports = {
getAllDevice
}
index.js

Đây là class dùng để public ra các client gọi tới để try cập các api của hệ thống

module.exports = {

    authController: require("./authController"),

    userController: require("./userController"),

    deviceController: require("./deviceController"),

    authApi: require("../middleware/auth-api")

}
Như vậy chúng ta vừa đi qua folder Controller để nhận request xử lý và trả response về cho client . Tiếp theo chung ta sẽ ngó xuống tí dưới Controller nào nào …… Woa … middleware .

Middleware là cái oái gì vậy trời ???

4. Middleware

middleware là lớp trung gian để bảo mật hệ thống, Nó controll mọi api request vào hệ thống và quyết đinh có cho phép truy vào hay tống cổ ra khỏi nhà thông qua 1 cái chìa khoá được gian hồ truyền tai nhau có tên là anh hai Token .

Như vậy anh hai Token này ở đâu ra mà quyền lực dzữ vậy? Xin thưa anh ấy được tạo ra khi lần đầu client muốn vào hệ thống cần phải chứng thực thông qua api login ( api này phải cấu hình router không cần chặng) . Sau khi login thành công sẽ trả về cho client anh hai Token này và từ đó về sau mỗi lần gọi api thì client phải gửi kèm theo anh hai này thông qua header .

Chúng ta thấy ở trong folder middleware có 2 file :

auth-api.js

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const logger = require("../Config/logger")(module);
const { passwordHash } = require("./password-hash");
const db = require("../Config/database");
const jwt = require("jsonwebtoken");
const { jwt_secret } = require("../Config/config");

passport.use(new LocalStrategy(function (username, password, done) {
const select = 'Select _ from user_tbl where user_name = $1';
var result = {}
db.query(select, [username]).then(async res => {
try {
if (res.rows.length > 0) {
var userDetails = res.rows[0];
var userPassword = userDetails.password.trim();
var isValid = await passwordHash.validatePassword(password, userPassword);
if (isValid) {
logger.info("generating JWT Token ");
var issuedDate = Date.now();
var expiryDate = new Date(issuedDate);
expiryDate.setDate(issuedDate.getDate + 60);
var bearerToken = jwt.sign({
userId: userDetails.user_id,
userName: userDetails.user_name,
role: userDetails.role,
exp: Math.floor(expiryDate / 1000) + 24 _ (60 \* 60)
}, jwt_secret);
result.status = 200;
result.bearerToken = bearerToken;
done(null, result);
} else {
logger.info("Invalid password");
result.status = 401;
result.message = "Invalid password";
done(null, result);
}
} else {
logger.info("invalid username");
result.status = 401;
result.message = "invalid username";
done(null, result);
}
} catch (err) {
result.status = 500;
result.message = err;
done(null, result);
}
}).catch(err => {
result.status = 500;
result.message = err;
done(null, result);
})
}));
Nội dung file auth-api.js là dùng để khi client gọi tới login và chứng thực với database xem user này hợp lệ không? có giấy phép đi đường ( Mùa covid-19) không ? Nếu có thì lấy thông tin user để tạo ra anh hai token. Token được tạo ra dựa vào file thứ 2 đó là:

password-hash.js

const bcrypt = require("bcrypt");

const saltRounds = 10;

const generateHashPwd = (password) => {
return new Promise((resolve, reject) => {
bcrypt.hash(password, saltRounds, function (err, hash) {
console.log("Hashed ", hash)
return resolve(hash)
});
});
};

const validatePassword = (enteredPwd, hashedPwd) => {
return new Promise((resolve, reject) => {
bcrypt.compare(enteredPwd, hashedPwd, function (err, res) {
console.log(err, res);
if (err) {
resolve(false);
} else {
resolve(res);
}
})
});
};

module.exports.passwordHash = {
generateHashPwd,
validatePassword
}
Trong file này mình sử dụng thư viện “bcrypt” để mã hoá password và tạo ra chuỗi token từ thông tin client login .

Ok——Tê…..tê….tê….

Tới đây thì mọi thứ gần như ok rồi chỉ còn giai đoạn cuối thôi là show hàng cho client thấy mà gọi

5. Router

Router là nơi để viết các api publish ra cho client có thể gọi tới

authRoutes.js

var jwt = require("jsonwebtoken");

module.exports = (app, passport) => {

    app.get("/auth/login", passport.authenticate('local', { session: false }), (req, res) => {
        res.status(req.user.status).send(req.user);
    });

}
Class này là để publish api login , refresh-token … cho client gọi vào để tạo ra anh hai

userRoutes.js

const { userController } = require("../Controller/index")

module.exports = (app) => {

    app.route("/user/clients")
        .post(userController.saveClient);





    app.route("/user/customers")
        .post(userController.saveCustomer);


    app.route("/user/admin")
        .post(userController.saveAdmin);

}
Đây là nới get danh sách của user ( Hệ thống Demo này có 3 roles : clients, customers, admin)

devicesRoutes.js

const{deviceController}=require("../Controller/index")

module.exports=(app)=>{
app.route("/devices")
.get(deviceController.getAllDevice)
}
Cái file này chắc không cần nói thì anh em cũng đủ hiểu nó là chỗ để tương tác lấy danh sách các thiết bị trong database hay nói cách khác muốn làm gì với bảng devices trong database ( thêm, xoá, sửa, lấy danh sách… ) thì vào anh này viết :p :p :p

và cuối cùng là file index.js

Đây là class để export các router ra để client có thể gọi nè .

const authenticate = require("./authRoutes");
const user = require("./userRoutes");
const device = require("./deviceRoutes");
const express = require("express");
const routes = express.Router();
const passport = require("passport");

module.exports = function (app) {

    app.use(passport.initialize());

    app.use("/api", routes);

    authenticate(routes, passport);

    user(routes);

    device(routes);

}
Ok… Tới đây cũng mệt người luôn rồi.

À chà quên còn mấy file rất qua trọng nữa là .env đây là nơi khai báo cái port, các thông tin kết nối database

port=2600

host=postgre.database.mentorofdev.com

user=node_best_practices

password:mentorofdev2021root\*

database=node_best_practices_database
Một class cực kỳ quan trọng mà mình quên nói tới có thể nói nếu không có em này thì coi như đang dương tính cô vy mà không có Oxy vậy đó:

server.js đây là class dùng để start server lên chỉ định port để server chạy đúng port mình cần.

const express = require('express');
const { port } = require('./Config/config');
const app = express();
const router = require("./Router");
const logger = require("./Config/logger")(module);
const bodyparser = require("body-parser");

var initalLogging = (req, res, next) => {
logger.info(`[${req.method}]: ${req.originalUrl}`);
next();
}

const morgan = require("morgan")

app.use(morgan(
":method :url :status :res[content-length] - :response-time ms",
{stream:{
write: (message) => Logger.http(message),
}}
));

app.use(initalLogging);

app.use(bodyparser.json());

app.use(bodyparser.urlencoded({ extended: true }));

router(app);

app.listen(port, () => {
console.log("Server is up and listening in the port ", port)
})

Ok… giờ thì có vẻ mọi thứ ok rồi.

node server.js run thôi…..

Thanks for watching………

Hú hồn zên gửi link source code nữa chứ việc này hok làm là dễ bị chưỡi lắm nè :

Repository: Source Code
