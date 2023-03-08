const express = require('express');
const bodyParser = require("body-parser");

module.exports = function () {
    var server = {}; 

    server.run = (db) => {
        console.log("Starting Server")
        return new Promise(async (resolve, reject) => {
            const app = express();
            
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(bodyParser.json());
            
            app.use('/static', express.static("server/static"));
            // app.use('/static', express.static("node_modules/machankura-website/build/static"));
            
            // TODO: check that user has an individualEntityUser....
            var router = require('./router/index.js')();
            app.use('/', router);
            

            // TODO: Handle authentication and confirm this isn't being spoofed
            const port = process.env.PORT || 5656;

            server.instance = app.listen(port);

            resolve(port);
        });
    }
    
    return server;
};