const express = require("express")

const { XMLParser, XMLBuilder} = require("fast-xml-parser");
const ivr = require("../../../lib/ivr")

const transformPlayTag = (ivrObject) => {
    if (ivrObject.length > 0) {
        return ivrObject
    }
    const keys = Object.keys(ivrObject)
    console.log("Keys: ", keys)

    keys.forEach((key) => {
        if (!key.startsWith("?") && !key.startsWith("@") && !key.startsWith("#")) {
            if (key == "Play") {
                ivrObject[key] = {
                    "@_url": ivrObject[key]["#text"]
                }

                console.log("Play: ", ivrObject[key])
            } else {
                console.log("Traversing: ", ivrObject[key])
                transformPlayTag(ivrObject[key])
            }
            
        }
    })

    return ivrObject
}

const translateToAfricasTalking = (ivrVoiceResponse) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        transformTagName: (tagName) => {
            if (tagName === "Gather") {
                return "GetDigits"
            }
            return tagName
        },
        transformAttributeName: (attributeName) => {
            if (attributeName == "@_action") {
                return "@_callbackUrl"
            }
            return attributeName
        },
        tagValueProcessor: (tagName, tagValue, jPath, hasAttributes, isLeafNode) => {
            if (tagName === "Say") {
                return tagValue.replaceAll("\n", " ")
            }

            return tagValue
        }
    });
    let ivrObject = transformPlayTag(parser.parse(ivrVoiceResponse));

    const builder = new XMLBuilder({
        ignoreAttributes: false
    });
    const xmlContent = builder.build(ivrObject);

    console.log("Translation: ", xmlContent)
    return xmlContent
}
module.exports = function () {
    var router = express.Router();

    router.use((request, response, next) => {
        const ivrVoiceResponse = ivr.produceIVRVoiceResponse(request)
        
        if (ivrVoiceResponse) {
            const africasTalkingIVRResponse = translateToAfricasTalking(ivrVoiceResponse) 
            response.setHeader("Content-Type", "text/xml");
            response.send(
                africasTalkingIVRResponse
            )
            response.end()
        } else {
            next()
        }
    });


    return router;
};