import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface GamePageProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
    //you can always add more functions/objects that you would like as props for this component
}

function Hand({ socket }: GamePageProps) {
    const [hand, setHand]: any = useState([{ number: 3, color: "yellow" }]);
    const [drew, setDrew]: any = useState(false);

    const cardPlayed: any = (card: any, cardIdx: any) => {
        socket.emit("wantToPlay", { card: card, idx: cardIdx });
    };

    useEffect(() => {
        socket.emit("initializeHand");
        socket.on("initialHand", (myData: any) => {
            let new_hand = myData.hand;
            setHand(new_hand);
        });
    }, [socket]);

    useEffect(() => {
        socket.on("addToHand", (myData: any) => {
            setHand((prevHand: any) => {
                console.log("In add to hand client side.");
                const new_hand = prevHand.concat(myData.cards);
                return new_hand;
            });
        });

        return () => {
            socket.off("addToHand");
        };
    }, [hand]);

    useEffect(() => {
        socket.on("valid", (myData: any) => {
            setHand((prevHand: any) => {
                const card_played = prevHand[myData.idx];
                console.log("Hand:", prevHand);
                const newHand = prevHand.filter(
                    (card: any, index: any) => index !== myData.idx
                );
                console.log("Hand after:", newHand);
                console.log(newHand);
                // If newHand empty, I won
                if (newHand.length === 0) socket.emit("iAmUnoMaster");

                // Tell server turn is over
                if (drew) {
                    socket.emit("setDrawnFalse");
                    setDrew(false);
                }
                socket.emit("nextTurn", { cardPlayed: card_played });
                return newHand;
            });
        });
    }, [drew]);

    useEffect(() => {
        socket.on("sendHandForValidation", (myData: any) => {
            socket.emit("validateHand", {
                hand: hand,
                idx: myData.idx,
                card: myData.card,
            });
        });
    }, [hand]);

    useEffect(() => {
        socket.on("heDrew", () => {
            setDrew(true);
        });
    }, []);

    return (
        <div className="right-side-container my-cards-container">
            <h1>My Cards</h1>
            <div className="my-cards-inner-container">
                {hand.map((card: any, cardNum: any) => (
                    <div
                        className={`card num-${card.number} ${card.color}`}
                        onClick={() => cardPlayed(card, cardNum)}
                    >
                        <span className="inner">
                            <span className="mark">{card.number}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Hand;
