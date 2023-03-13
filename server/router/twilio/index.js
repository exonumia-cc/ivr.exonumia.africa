const express = require("express")

const ivr = require("../../../lib/ivr")

module.exports = function () {
    var router = express.Router();

    router.use((request, response, next) => {
        if (request.method == "POST") {
            const ivrVoiceResponse = ivr.produceIVRVoiceResponse(request)
            
            if (ivrVoiceResponse) {
                response.setHeader("Content-Type", "text/xml");
                response.send(
                    ivrVoiceResponse
                )
                response.end()
            } else {
                next()
            }
        } else {
            next()
        }
    });


    return router;
};