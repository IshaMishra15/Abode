import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="room">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <br />
        <button className="primary my-4 ">Join</button>
      </form>
    </div>
  );
};

export default LobbyScreen;




// import React, { useState, useCallback, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSocket } from "../context/SocketProvider";

// const LobbyScreen = () => {
//   const [email, setEmail] = useState("");
//   const [room, setRoom] = useState("");

//   const socket = useSocket();
//   const navigate = useNavigate();

//   // Handle form submission
//   const handleSubmitForm = useCallback(
//     (e) => {
//       e.preventDefault();
//       if (email && room) {
//         console.log("Emitting room:join with:", { email, room }); // Debugging log
//         socket.emit("room:join", { email, room });
//       } else {
//         alert("Please enter both email and room number.");
//       }
//     },
//     [email, room, socket]
//   );

//   // Handle successful room join
//   const handleJoinRoom = useCallback(
//     (data) => {
//       console.log("Received data on join:", data); // Debugging log
//       const { room } = data;
//       if (room) {
//         navigate(`/room/${room}`);
//       } else {
//         console.error("Room ID is undefined");
//         alert("Failed to join room. Please try again.");
//       }
//     },
//     [navigate]
//   );

//   useEffect(() => {
//     // Listen for successful room join
//     socket.on("room:join", handleJoinRoom);
//     return () => {
//       socket.off("room:join", handleJoinRoom);
//     };
//   }, [socket, handleJoinRoom]);

//   return (
//     <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
//       <h1 className="text-3xl font-bold mb-6">Join a Room</h1>
//       <form onSubmit={handleSubmitForm} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
//         <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email ID</label>
//         <input
//           type="email"
//           id="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="w-full p-2 border border-gray-300 rounded mb-4"
//         />
//         <label htmlFor="room" className="block text-gray-700 font-medium mb-2">Room Number</label>
//         <input
//           type="text"
//           id="room"
//           value={room}
//           onChange={(e) => setRoom(e.target.value)}
//           className="w-full p-2 border border-gray-300 rounded mb-4"
//         />
//         <button
//           type="submit"
//           className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"
//         >
//           Join Room
//         </button>
//       </form>
//     </div>
//   );
// };

// export default LobbyScreen;
