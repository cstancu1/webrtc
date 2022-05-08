const express = require('express')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
connectedUsers = []

app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
})

app.get('/main.js', (req, res) => {
    res.sendFile(__dirname+'/main.js')
})

http.listen(3000, () => {
    console.log(`Listening on port 3000`);
})

io.on('connection', (socket) => {
    socket.on('login', io =>{
        newUser = {
            username:io,
            id:socket.id
        }
        connectedUsers.push(newUser)
        console.log(connectedUsers)
    })

    socket.on('call', destination => {
        var destinationId = getUserId(destination)
        var callerName = getUserName(socket.id)
        data = {
            callerName : callerName
        }

        io.to(destinationId).emit('call', data)
    })

    socket.on('signal', data => {
        if(data.destination != null && data.destination != ''){
            var destinationId = getUserId(data.destination)
            io.to(destinationId).emit('signal', data)
        }
    })

    socket.on('candidate', data => {
            var destinationId = getUserId(data.destination)
            io.to(destinationId).emit('candidate', data)
    })

    socket.on('disconnect', io => {
        elem = getIndex(io.id)
        connectedUsers.splice(elem, 2)
        console.log(connectedUsers)
    })

})

function getUserId(username){
    user = connectedUsers.find(function(e){return e.username==username})
    if(user){
        return user.id
    }
}

function getUserName(id){
    user = connectedUsers.find(function(e){return e.id==id})
    return user.username
}

function getIndex(id){
    user = connectedUsers.find(function(e){return e.id==id})
    index = connectedUsers.indexOf(user)
    return index
}