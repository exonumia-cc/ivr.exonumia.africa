const express = require("express")
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const path = require("path")
const fs = require("fs")

const rootDirectory = path.resolve("server/static/audio")
// const rootDirectoryContent = fs.readdirSync(path.join(rootDirectory, "/why-bitcoin"))

const twilioVoiceResponse = (request, contentPath, voiceResponse, subDirectory = "") => {
    const contentPathFiles = fs.readdirSync(contentPath)
    const indexFile = contentPathFiles.find(f => f.startsWith("index"))
                        
    if (indexFile) {
        if (contentPathFiles.length > 1) {
            // We should gather content if we have multiple files
            const gather = voiceResponse.gather({
                timeout: 20,
                action: `https://ivs.exonumia.africa/twilio${request.path}${subDirectory}`,
                numDigits: 1,
            })

            indexResponse(
                request,
                indexFile,
                contentPath,
                gather,
                subDirectory
            )

            voiceResponse.say(`We didn't receive any input. Goodbye!`);
        } else {
            indexResponse(
                request,
                indexFile,
                contentPath,
                voiceResponse,
                subDirectory
            )
        }   
    } else {
        voiceResponse.say('File not found');
    }
}

const indexResponse = (request, indexFile, contentPath, twilioResponse, subDirectory = "") => {
    if (indexFile.endsWith(".txt")) {
        // TODO: Read Speak index
        const indexText = fs.readFileSync(path.join(contentPath, indexFile)) 
        twilioResponse.say(indexText);
    } else {
        // Play index 
        twilioResponse.play(
            {
                loop: 2,
            }, 
            `https://ivs.exonumia.africa/static/audio${request.path}${subDirectory}/${indexFile}`
        )
    }
}

module.exports = function () {
    var router = express.Router();

    router.use((request, response, next) => {
        
        if (request.method == "POST") {
            const voiceResponse = new VoiceResponse();
            const contentPath = path.join(rootDirectory, request.path)

            if (fs.existsSync(contentPath)) {
                // file or directory exists... produce content
                if (fs.statSync(contentPath).isDirectory()) {
                    const contentPathFiles = fs.readdirSync(contentPath)

                    console.log("Digits: ", request.body.Digits)
                    if (request.body.Digits) {
                        const contentPathFileExcludingIndex = contentPathFiles.filter(f => !f.startsWith("index"))
                        // We have gathered an input
                        const selectedDirectoryIndex = Number(request.body.Digits - 1)
                        const selectedDirectory = contentPathFileExcludingIndex.at(selectedDirectoryIndex) 

                        if (selectedDirectory) {
                            twilioVoiceResponse(
                                request,
                                path.join(contentPath, selectedDirectory),
                                voiceResponse,
                                `/${selectedDirectory}`
                            )
                        } else {
                            voiceResponse.say('Internal selection error');
                        }
                    } else {                        
                        // Play index.mp3 or speak index.txt
                        twilioVoiceResponse(
                            request,
                            contentPath,
                            voiceResponse,
                            ""
                        )
                    }
                } else {
                    // Play or speak file...                    
                    indexResponse(
                        request,
                        "",
                        contentPath,
                        voiceResponse
                    )
                }
            } else {
                // file or directory doesn't exist
                voiceResponse.say('Lost in the sauce');
            }

            response.setHeader("Content-Type", "text/xml");
            response.send(
                voiceResponse.toString()
            )
            response.end()
        } else {
            next()
        }
    });


    return router;
};