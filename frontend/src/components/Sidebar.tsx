import React from "react";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import Messages from "./Messages";
import Hand from "./Hand";

interface GamePageProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
    //you can always add more functions/objects that you would like as props for this component
    myMsgs: any;
}

function Sidebar({ socket, myMsgs }: GamePageProps) {
    return (
        <div className="messages-and-cards-container">
            <Messages socket={socket} myMsgs={myMsgs} />
            <Hand socket={socket} />
        </div>
    );
}

export default Sidebar;
