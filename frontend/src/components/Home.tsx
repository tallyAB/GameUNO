import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";
import Game from "./Game";
import LoadingScreen from "./Loading";

//create an interface for the props that you want to pass to this component
interface HomePageProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
    //you can always add more functions/objects that you would like as props for this component
}

function HomePage({ socket }: HomePageProps) {
    const [name, setName] = useState("");
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false); // new state variable to track loading status
    const [myPlayers, setMyPlayers] = useState([]);
    const [myDeck, setMyDeck] = useState([]);
    const [myHand, setMyHand] = useState([]);
    const [myMsgs, setMyMsgs] = useState([]);

    useEffect(() => {
        socket.on("handshakeStart", () => {
            if (!window.sessionStorage.getItem("userID")) {
                socket.emit("newClient");
            } else {
                socket.emit("handshakeComplete", {
                    id: window.sessionStorage.getItem("userID"),
                });
                setStarted(true);
            }
        });

        socket.on("setID", (myData) => {
            window.sessionStorage.setItem("userID", myData.id);
            socket.emit("handshakeComplete", { id: myData.id });
        });

        socket.on("started", ({ players, deck, hand, msgs }) => {
            setMyPlayers(players);
            setMyDeck(deck);
            setMyHand(hand);
            setMyMsgs(msgs);
            setStarted(true);
            setLoading(false);
        });
    }, [socket]);

    //click handler
    const handleClick = (socket: Socket) => {
        setLoading(true);
        socket.emit("joined", { data: name });
    };

    if (!started) {
        return (
            <>
                <div className="sampleHomePage">
                    <h1 className="sampleTitle">UNO</h1>
                    <div className="sampleMessage">
                        <label>
                            Name:
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                }}
                            />
                        </label>
                        <button onClick={() => handleClick(socket)}>
                            Submit
                        </button>
                    </div>
                </div>
                {loading && <LoadingScreen />}
            </>
        );
    } else {
        return (
            <Game
                socket={socket}
                myPlayers={myPlayers}
                myDeck={myDeck}
                myMsgs={myMsgs}
            />
        );
    }
}
export default HomePage;
