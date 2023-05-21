import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import Board from "./Board";
import Sidebar from "./Sidebar";
import Draw from "./Draw";
import Won from "./Won";

interface GamePageProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
    //you can always add more functions/objects that you would like as props for this component
    myPlayers: any;
    myDeck: any;
    myMsgs: any;
}

function Game({ socket, myPlayers, myDeck, myMsgs }: GamePageProps) {
    const [isDraw, setIsDraw] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [winner, setWinner] = useState(false);

    useEffect(() => {
        socket.on("draw", () => {
            setIsDraw(true);
        });
        socket.on("won", (myData) => {
            setWinner(myData.winner);
            setIsWon(true);
        });
    }, []);

    return (
        <>
            <div className="main-container">
                <Board socket={socket} myPlayers={myPlayers} myDeck={myDeck} />
                <Sidebar socket={socket} myMsgs={myMsgs} />
            </div>
            {isDraw && <Draw />}
            {isWon && <Won winner={winner} />}
        </>
    );
}

export default Game;
