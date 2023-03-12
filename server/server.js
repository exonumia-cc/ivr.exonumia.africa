const config = require("config");
const express = require('express');
const bodyParser = require("body-parser");

module.exports = function () {
    var server = {}; 

    server.run = () => {
        console.log("Starting Server to host IVR content:")
        return new Promise(async (resolve, reject) => {
            const app = express();
            
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(bodyParser.json());
            
            app.use('/static', express.static("server/static"));
            
            var router = require('./router/index.js')();
            app.use('/', router);
            
            const port = process.env.PORT || config.get("server.port");

            server.instance = app.listen(port);

            resolve(server.instance);
        });
    }
    
    return server;
};