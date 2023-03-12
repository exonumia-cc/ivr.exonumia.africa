const express = require("express")

module.exports = function () {
    var router = express.Router();

    var twilioRouter = require('./twilio/index.js')();
    router.use('/twilio', twilioRouter);
    
    // // 404 pages...
    router.use((request, response, next) => {
        if (!response.headersSent) {
            response.status(404);

            response.type('txt').send('Resource Not found');
        }
    });

    // 500 pages... 
    router.use((error, request, response, next) => {
        
        if(error && !response.headersSent) {
            console.error("We have an error: ", error)
            response.status(500);
            
            response.type('txt').send('Internal server error');
        }
    });


    return router;
};