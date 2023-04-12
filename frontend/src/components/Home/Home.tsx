import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import "./Home.css";
import { useEffect, useState } from "react";

//create an interface for the props that you want to pass to this component
interface HomePageProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
    //you can always add more functions/objects that you would like as props for this component
}

function HomePage({ socket }: HomePageProps) {
    useEffect(() => {
        socket.on("handshakeStart", () => {
            if (!window.sessionStorage.getItem("userID")) {
                socket.emit("newClient");
            } else {
                socket.emit("handshakeComplete", {
                    id: window.sessionStorage.getItem("userID"),
                });
            }
        });

        socket.on("setID", (myData) => {
            window.sessionStorage.setItem("userID", myData.id);
            socket.emit("handshakeComplete", { id: myData.id });
        });
    }, [socket]);

    //click handler
    const handleClick = (socket: Socket) => {
        console.log("Socket ID:", socket.id);
        // Do something with the socket object, such as emit an event
        socket.emit("myEvent", { data: "Hello, world!" });
    };

    return (
        <>
            <div className="sampleHomePage">
                <h1 className="sampleTitle">My Game</h1>
                <div className="sampleMessage">
                    <input placeholder="message"></input>
                    <button onClick={() => handleClick(socket)}>
                        Click me to send a message to server...
                    </button>
                </div>
            </div>
        </>
    );
}
export default HomePage;
