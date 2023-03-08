const server = require('./server/server.js')();

server.run().then(port => {
    console.log("Running: ", port)
}).catch(error => {
    console.error("Error: ", error)
})