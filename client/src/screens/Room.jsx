
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
    <div style={{ position: 'relative', height: '100vh', width: '100vw', backgroundColor: '#000' }}>
      <h1 style={{ color: '#fff' }}>Room Page</h1>
      <h4 style={{ color: '#fff' }}>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {!streamSent && (
        <>
          {myStream && <button onClick={sendStreams} style={{ position: 'absolute', top: 20, left: 20, zIndex: 3 }}>Send Stream</button>}
          {remoteSocketId && <button onClick={handleCallUser} style={{ position: 'absolute', top: 60, left: 20, zIndex: 3 }}>CALL</button>}
        </>
      )}
      {myStream && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: '150px',
          height: '150px',
          zIndex: 2,
          border: '2px solid #fff',
          borderRadius: '10px',
          backgroundColor: '#000'
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
          backgroundColor: '#000'
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
