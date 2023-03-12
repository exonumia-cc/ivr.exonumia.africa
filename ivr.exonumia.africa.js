const server = require('./server/server.js')();

server.run().then(instance => {
    console.log("Running: ", instance._connectionKey)
}).catch(error => {
    console.error("Error: ", error)
})