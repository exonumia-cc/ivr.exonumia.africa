const config = require("config");
const express = require("express")
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const path = require("path")
const fs = require("fs")

const ivrDomain = process.env.IVR_DOMAIN || config.get("ivr.domain") 
const MEDIA_DIRECTORY = process.env.IVR_MEDIA_DIRECTORY || config.get("ivr.dir")
const rootDirectory = path.resolve(MEDIA_DIRECTORY)

const rootMediaDirectories = fs.readdirSync(rootDirectory)

const traverseAndValidate = (mediaDirectory) => {
    const indexMedia = [
        "index.mp3",
        "index.txt"
    ]
    const mediaDirectoryContent = fs.readdirSync(mediaDirectory)

    if (mediaDirectoryContent.some(c => indexMedia.includes(c))) {
        // console.info("Media: ", mediaDirectoryContent)
        const subDirectories = mediaDirectoryContent.filter(d => fs.statSync(
            path.join(mediaDirectory, d)).isDirectory()
        )
        // Traverse subDirectories
        subDirectories.forEach(subDirectory => {
            const subDirectoryPath = path.join(mediaDirectory, subDirectory)
            traverseAndValidate(subDirectoryPath)
        })
    } else {
        console.error("No media in directory ", mediaDirectory)
    }
}

rootMediaDirectories.forEach(rootMediaDirectory => {
    // Traverse and confirm that the folder structure is valid
    traverseAndValidate(path.join(rootDirectory, rootMediaDirectory))
    console.log(`https://${ivrDomain}/twilio/${rootMediaDirectory}`)
})

const twilioVoiceResponse = (request, contentPath, voiceResponse, subDirectory = "") => {
    const contentPathFiles = fs.readdirSync(contentPath)
    const indexFile = contentPathFiles.find(f => f.startsWith("index"))
                        
    if (indexFile) {
        if (contentPathFiles.length > 1) {
            // We should gather content if we have multiple files
            const gather = voiceResponse.gather({
                timeout: 20,
                action: `https://${ivrDomain}/twilio${request.path}${subDirectory}`,
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

            if (contentPathFiles.length == 1) {
                // We should now play the previous menu...
                const gather = voiceResponse.gather({
                    timeout: 20,
                    action: `https://${ivrDomain}/twilio${request.path}`,
                    numDigits: 1,
                })

                indexResponse(
                    request,
                    indexFile,
                    contentPath,
                    gather,
                    ""
                )
            }
            
        }   
    } else {
        voiceResponse.say('File not found');
    }
}

const indexResponse = (request, indexFile, contentPath, twilioResponse, subDirectory = "") => {
    const contentPathFiles = fs.readdirSync(contentPath)
    if (indexFile.endsWith(".txt")) {
        // TODO: Read Speak index
        const indexText = fs.readFileSync(path.join(contentPath, indexFile)).toString() 
        twilioResponse.say(
            {
                loop: contentPathFiles.length > 1 ? 2 : 1,
            },
            indexText
        );
    } else {
        // Play index 
        twilioResponse.play(
            {
                loop: contentPathFiles.length > 1 ? 2 : 1,
            }, 
            `https://${ivrDomain}/static/audio${request.path}${subDirectory}/${indexFile}`
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
                    console.log("Path: ", request.path)
                    if (request.body.Digits) {
                        const contentPathFileExcludingIndex = contentPathFiles.filter(f => !f.startsWith("index"))
                        console.log("Selection: ", contentPathFileExcludingIndex)
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
            const result = voiceResponse.toString()
            console.log("Result: ", result)
            response.send(
                result
            )
            response.end()
        } else {
            next()
        }
    });


    return router;
};