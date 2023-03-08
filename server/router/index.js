const express = require("express")
const VoiceResponse = require('twilio').twiml.VoiceResponse;

module.exports = function () {
    var router = express.Router();

    // TODO: Process contents of server/static/audio/ or CONTENT_FOLDER
    router.route('/test-call')
        .post(function(request, response, next)  {

            const voiceResponse = new VoiceResponse();
            const gather = voiceResponse.gather({
                timeout: 20,
                action: "https://ivs.exonumia.africa/test-call/play",
                numDigits: 1,
            })

            gather.play({
                loop: 2,
            }, 'https://ivs.exonumia.africa/static/audio/bitcoin-menu-norm.mp3')
            
            voiceResponse.say('We didn\'t receive any input. Goodbye!');
            
            response.setHeader("Content-Type", "text/xml");
            response.send(
                voiceResponse.toString()
            )
            response.end()
            
        });

    router.route('/test-call/play')
        .post(function(request, response, next)  {

            const voiceResponse = new VoiceResponse();
            
            console.log("Request: ", request.body)

            if (request.body.Digits == "1") {
                voiceResponse.play({
                    loop: 1,
                    Digits: 1,
                }, 'https://ivs.exonumia.africa/static/audio/bitcoin-xhosa.mp3');
            }  else if (request.body.Digits == "2") {
                voiceResponse.play({
                    loop: 1,
                    Digits: 2,
                }, 'https://ivs.exonumia.africa/static/audio/bitcoin-sesotho-norm.mp3');
            }  else if (request.body.Digits == "3") {
                voiceResponse.play({
                    loop: 1,
                    Digits: 3,
                }, 'https://ivs.exonumia.africa/static/audio/bitcoin-zulu-norm.mp3');
            }  else {
                voiceResponse.play({
                    loop: 1,
                    Digits: 1,
                }, 'https://ivs.exonumia.africa/static/audio/bitcoin-xhosa.mp3');
            }

            response.setHeader("Content-Type", "text/xml");
            response.send(
                voiceResponse.toString()
            )
            response.end()
        });

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