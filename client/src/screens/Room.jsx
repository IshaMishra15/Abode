
import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [streamSent, setStreamSent] = useState(false); // New state to track if the stream has been sent

  // Stop the media tracks and clean up the peer connection
  const stopMediaAndCleanup = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    peer.peer.close();
    setRemoteSocketId(null);
  }, [myStream, remoteStream]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  // Handle hangup: stop media and redirect
  const handleHangUp = useCallback(() => {
    stopMediaAndCleanup();
    socket.emit("call:hangup", { to: remoteSocketId });
    navigate("/");
  }, [stopMediaAndCleanup, socket, remoteSocketId, navigate]);

  // Handle when another user joins the room
  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  // Handle incoming call
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  // Send local media streams
  const sendStreams = useCallback(() => {
    if (!myStream) {
      console.error('No stream available to send');
      return;
    }

    // Ensure peer connection is set up
    if (!peer.peer) {
      console.error('Peer connection is not initialized');
      return;
    }

    console.log('Sending streams...');
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }

    // Set streamSent to true after sending the stream
    setStreamSent(true);
  }, [myStream]);

  // Handle call acceptance
  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  // Handle negotiation needed
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  // Handle incoming negotiation needs
  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  // Finalize negotiation
  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    // Listen for hangup events from the server
    socket.on("call:hangup", () => {
      handleHangUp();
    });

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("call:hangup");
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
    handleHangUp
  ]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', backgroundColor: 'white' }}>
      <h1 style={{ color: 'black' }}>Room</h1>
      <h4 style={{ color: 'black' }} className="text-center text-4xl p-10">{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {!streamSent && (
        <>
          {myStream && <button onClick={sendStreams} style={{  top: '50%',
            left: '50%',position: 'absolute', zIndex: 3,backgroundColor: 'green',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',cursor: 'pointer', }}>
                
                <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0 6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
                </svg>
                <span>Answer Call...</span>
                </div>
                </button>}
          {remoteSocketId && <button onClick={handleCallUser} style={{ position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer', }}>
                <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0-6 6m3 12c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
                    </svg>
                    <span>Make a Call</span>
                </div>
                </button>}
        </>
      )}
      {myStream && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: '250px',
          height: '200px',
          zIndex: 2,
          border: '2px solid #fff',
          borderRadius: '20px',
          backgroundColor: 'white',
          
        }}>
          <ReactPlayer
            playing
            muted
            height="100%"
            width="100%"
            url={myStream}
          />
        </div>
      )}
      {remoteStream && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          backgroundColor: 'white'
        }}>
          <ReactPlayer
            playing
            muted
            height="100%"
            width="100%"
            url={remoteStream}
          />
        </div>
      )}
      {(myStream || remoteStream) && (
        <button onClick={handleHangUp} className='bg-primary text-white right-16 top-8 py-2 px-4 rounded-2xl fixed shadow shadow-black' style={{ position: 'absolute', zIndex: 3 }}>Hang Up</button>
      )}
    </div>
  );
};

export default RoomPage;






