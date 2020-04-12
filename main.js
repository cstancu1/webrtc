var socket = io();
let remoteUser

var config = {
    iceServers: [{
        urls: [ "stun:eu-turn2.xirsys.com" ]
     }, {
        username: "1y5PnM-Kq4oVeAZlEoHqkImEcnRv7vkyKkKYuvypotu94OmARzwXwEIX0EmUAeC1AAAAAF6Qa-hjc3RhbmN1MQ==",
        credential: "0cc95cc8-7b2a-11ea-a926-4a049da423ff",
        urls: [
            "turn:ss-turn1.xirsys.com:80?transport=udp",
            "turn:ss-turn1.xirsys.com:3478?transport=udp",
            "turn:ss-turn1.xirsys.com:80?transport=tcp",
            "turn:ss-turn1.xirsys.com:3478?transport=tcp",
            "turns:ss-turn1.xirsys.com:443?transport=tcp",
            "turns:ss-turn1.xirsys.com:5349?transport=tcp"
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
      console.log(event)
    document.getElementById("videoStream").srcObject = event.streams[0];
  };

pc.ondatachannel =function (e) {
    console.log('Received data channel')
    console.log(e)

    e.channel.onopen = function(){
        console.log('<=== REAL TIME COMMUNICATION STARTED ===>')
    }
    e.channel.onmessage = function(msg){
        document.getElementById('receivedMessage').innerHTML = msg.data
    }
}



socket.on('signal',async  data => {
    try {
        if(data.data.type=='offer'){
           offerReceived(data.data)
           
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
