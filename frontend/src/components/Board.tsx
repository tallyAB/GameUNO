import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface GamePageProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
    //you can always add more functions/objects that you would like as props for this component
    myPlayers: any;
    myDeck: any;
}

function Board({ socket, myPlayers, myDeck }: GamePageProps) {
    const [deck, setDeck]: any = useState(myDeck);
    const [discardTop, setDiscardTop]: any = useState({});
    const [players, setPlayers] = useState(myPlayers);
    const [inContact, setInContact] = useState(false);
    const [drawnCard, setDrawnCard] = useState(false);
    const numberToString: any = {
        1: "one",
        2: "two",
        3: "three",
        4: "four",
    };

    const pass = () => {
        if (!drawnCard) {
            socket.emit("notDrawnPass");
        } else {
            socket.emit("pass");
            setDrawnCard(false);
        }
    };

    const drawFromDeck = () => {
        console.log("I AM IN DRAW FUNCTION THIS MANY TIMES");
        if (drawnCard) {
            socket.emit("alreadyDrawn");
        } else {
            if (deck.size === 1) {
                socket.emit("emitDraw");
            } else {
                let newCard = deck.pop();
                setDeck(deck);
                socket.emit("updateDeck", { deck: deck });
                socket.emit("addToMyHand", { card: newCard });
                setDrawnCard(true);
            }
        }
    };

    useEffect(() => {
        if (!inContact) {
            socket.emit("onBoard");
        }

        socket.on("turnOne", async () => {
            // only sent to player 1
            setInContact(true);
            const card = deck.pop();
            setDiscardTop(card);
            setDeck(deck);
            socket.emit("updateDeck", { deck: deck });
            socket.emit("updateDiscard", { discardTop: card });
        });

        socket.on("updateDeck", (myData: any) => {
            setDeck(myData.deck);
        });

        socket.on("updateDiscard", (myData: any) => {
            setDiscardTop(myData.discardTop);
        });

        socket.on("setDrawFalse", () => {
            setDrawnCard(false);
        });
    }, []);

    return (
        <div className="game-container">
            <div className="heading-container">
                <h1>UNO</h1>
            </div>
            <div className="game-table-container">
                <div className="game-table">
                    <div className="card-area">
                        {deck.length !== 0 ? (
                            <div className="card discard-pile black">
                                <span className="inner">
                                    <span className="mark">U</span>
                                </span>
                            </div>
                        ) : (
                            <></>
                        )}
                        {Object.keys(discardTop).length !== 0 ? (
                            <div
                                className={`card num-${discardTop.number} ${discardTop.color}`}
                            >
                                <span className="inner">
                                    <span className="mark">
                                        {discardTop.number}
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>

                    {players.map((player: any, pNum: any) => {
                        return (
                            <div className="game-players-container">
                                <div
                                    className={`player-tag player-${
                                        numberToString[pNum + 1]
                                    }`}
                                >
                                    {player}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="select-rang-container">
                <button className="button-select-rang" onClick={drawFromDeck}>
                    Pick from deck
                </button>
                <button className="button-select-rang" onClick={pass}>
                    Pass
                </button>
            </div>
        </div>
    );
}

export default Board;
