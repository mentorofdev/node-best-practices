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