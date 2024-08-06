import  React,{ useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import axios from "axios";

const LobbyScreen = () => {
  const [place, setPlace] = useState(null);
  const [email, setEmail] = useState("");
  const [ownerId, setOwnerId] = useState(""); // State to store owner's ID
  const { placeId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!placeId) {
      console.error("No place ID provided");
      return;
    }

    axios.get(`/places/${placeId}`)
      .then(response => {
        setPlace(response.data);
        setOwnerId(response.data.ownerId); // Assuming ownerId is in the response
      })
      .catch(error => {
        console.error("Error fetching place data:", error);
      });
  }, [placeId]);

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      if (!email) {
        alert("Please fill out all fields");
        return;
      }
      navigate(`/room/${placeId}`);
      // Emit room join event with ownerId included
      socket.emit("room:join", { email, room: placeId, ownerId });
    },
    [email, socket, placeId, ownerId]
  );

  if (!place) {
    return (
      <div>
        <h1>Loading...</h1>
        {/* Optionally display an error message */}
      </div>
    );
  }

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
        <button className="primary my-4">Join</button>
      </form>
    </div>
  );
};

export default LobbyScreen;