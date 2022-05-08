var socket = io();
let remoteUser

var config = {
    iceServers: [{
        urls: [ "stun:numb.viagenie.ca" ]
     }, {
        username: "",
        credential: "",
        urls: [
            "turn:numb.viagenie.ca"
        ]
     }],

     //FOR CHROME 
    rtcpMuxPolicy:"negotiate"
}

var pc = new RTCPeerConnection(config)

//let the "negotiationneeded" event trigger offer generation

  //CREATING DATA CHANNEL
  const dataChannel = pc.createDataChannel('channel')
  console.log('Created data channel')
  dataChannel.onmessage = function(event){
      document.getElementById('receivedMessage').innerHTML = event.data
  }

  //DETECT IF ANY DATA CHANNELS
  pc.ontrack = function(event) {
    document.getElementById('callUserMain').style.display="none"
    console.log(event)
    if(!document.getElementById("videoStream").srcObject){
        document.getElementById("videoStream").srcObject = event.streams[0];
        document.getElementById('videoStream').play()
    } 
  };

pc.ondatachannel =function (e) {
    console.log('Received data channel')
    console.log(e)

    e.channel.onopen = function(){
        document.getElementById('callUserMain').style.display="none;"
        console.log('<=== REAL TIME COMMUNICATION STARTED ===>')
        startVideoStream()
        document.getElementById('loadingOverlay').style.display = "none"
        document.getElementById('floatingCam').style.display="block"
    }
    e.channel.onmessage = function(msg){
        document.getElementById('receivedMessage').innerHTML = msg.data
    }
}



socket.on('signal',async  data => {
    try {
        if(data.data.type=='offer'){
           offerReceived(data.data)
           document.getElementById('invitestatus').innerHTML = " INVITATIE ACCEPTATA"
           
        }else if(data.data.type=='answer'){
            await pc.setRemoteDescription(data.data)
            pc.onicecandidate = ({candidate}) => {
                toSend = {
                    data:{candidate},
                    destination: remoteUser
                }
                socket.emit('candidate', toSend)
            }

            pc.onnegotiationneeded = async () => {
                try {
                  await pc.setLocalDescription(await pc.createOffer());
                  socket.emit('signal', {destination:remoteUser, data:pc.localDescription})
                } catch (err) {
                  console.error(err);
                }
              };
            
        }
    }
    finally{
        return
    }

})

socket.on('call', data => {
    document.getElementById('callerName').innerHTML = data.callerName
    $('#someonecall').modal({focus:true})
})

socket.on('candidate', data => {
    console.log(data.data.candidate)
    pc.addIceCandidate(data.data.candidate).catch(e => {console.log(e)})
})

async function offerReceived(offer){
    console.log('Received offer')
    await pc.setRemoteDescription(offer)
    pc.onicecandidate = ({candidate}) => {
        toSend = {
            data:{candidate},
            destination: remoteUser
        }
        socket.emit('candidate', toSend)
    }

    await pc.setLocalDescription(await pc.createAnswer())

    var data = {
        data: pc.localDescription,
        destination: document.getElementById('calluser').value
    }

    pc.onnegotiationneeded = async () => {
        try {
          await pc.setLocalDescription(await pc.createOffer());
          socket.emit('signal', {destination:remoteUser, data:pc.localDescription})
        } catch (err) {
          console.error(err);
        }
      };
    
    socket.emit('signal', data)
    console.log('Answer sent')

    
}
