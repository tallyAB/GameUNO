import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface GamePageProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
    //you can always add more functions/objects that you would like as props for this component
    myMsgs: any;
}

function Messages({ socket, myMsgs }: GamePageProps) {
    const [msgs, setMessages]: any = useState(myMsgs);
    useEffect(() => {
        socket.on("msg", (myData: any) => {
            setMessages((msgs: any) => [...msgs, myData.msg]);
        });
    }, []);

    return (
        <div className="right-side-container messages-container">
            <h1>Messages</h1>
            <div className="message-box">
                {msgs.map((msg: any) => (
                    <div className="message-content-container">{msg}</div>
                ))}
            </div>
        </div>
    );
}

export default Messages;
