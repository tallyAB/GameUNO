const { Socket } = require("socket.io");

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

server.listen(3001, () => {
    console.log("SERVER IS LISTENING ON PORT 3001");
});

const NUM_PLAYERS = 2;
const clients: any = new Map();
const players = new Map();
const player_hand: any = [];
let turnOf = 0;
let turnNumber = 0;

let discardTop: any = {};
let deck: any = [];

let reversed = false;

const actions = ["S", "R", "D"];
const colors = ["red", "blue", "green", "yellow"];

deck.push({ number: 0, color: colors[0] });
deck.push({ number: 0, color: colors[1] });
deck.push({ number: 0, color: colors[2] });
deck.push({ number: 0, color: colors[3] });

for (let i = 1; i <= 9; i++) {
    for (let j = 0; j < 2; j++) {
        deck.push({ number: i, color: colors[0] });
        deck.push({ number: i, color: colors[1] });
        deck.push({ number: i, color: colors[2] });
        deck.push({ number: i, color: colors[3] });
    }
}

for (let i = 0; i < actions.length; i++) {
    for (let j = 0; j < colors.length; j++) {
        for (let k = 0; k < 2; k++) {
            deck.push({ number: actions[i], color: colors[j] });
        }
    }
}

for (let i = 0; i < 4; i++) {
    deck.push({ number: "W", color: "black" });
    deck.push({ number: "W4", color: "black" });
}

// Shuffle the deck
deck.sort(() => Math.random() - 0.5);

// Deal hands of 7 cards to each player
for (let i = 0; i < NUM_PLAYERS; i++) {
    const hand: any = [];
    for (let j = 0; j < 7; j++) {
        const card = deck.pop();
        hand.push(card);
    }
    player_hand.push(hand);
}

const validCard = (socket: any, card: any, idx: any) => {
    discardTop = card;
    for (let player of players.keys()) {
        player.emit("updateDiscard", { discardTop: discardTop });
        player.emit("msg", {
            msg: `Player ${clients.get(socket)} played a ${card.number} of ${
                card.color
            }`,
        });
    }
    socket.emit("valid", { idx: idx });
};

io.on("connection", (socket: any) => {
    socket.emit("handshakeStart");

    socket.on("newClient", () => {
        let latestClientID = 1;
        if (clients.size == 0) latestClientID = 1;
        else {
            while (Array.from(clients.values()).includes(latestClientID)) {
                latestClientID++;
            }
        }

        socket.emit("setID", { id: latestClientID });
    });

    socket.on("handshakeComplete", (myData: any) => {
        let id = myData.id;
        // Check for repetitive emits
        if (!Array.from(clients.values()).includes(id)) {
            clients.set(socket, parseInt(id));
            console.log(`Client ${id} connected with socket id ${socket.id}`);
        }
    });

    socket.on("joined", (myData: any) => {
        players.set(socket, [clients.get(socket), myData.data]);
        if (players.size == NUM_PLAYERS) {
            let i = 0;
            for (let player of players.entries()) {
                player[0].emit("started", {
                    players: Array.from(players.values()).map((arr) => arr[1]),
                    deck: deck,
                    hand: player_hand[i],
                    msgs: ["Game Starting. Player 1's turn."],
                });
                i++;
            }
        }
    });

    socket.on("onBoard", () => {
        if (clients.get(socket) === 1) {
            socket.emit("turnOne");
            turnOf = 1;
            turnNumber = 1;
        }
    });

    socket.on("updateDeck", (myData: any) => {
        deck = myData.deck;
        for (let player of players.keys()) {
            if (player !== socket) {
                player.emit("updateDeck", { deck: deck });
            }
        }
    });

    socket.on("updateDiscard", (myData: any) => {
        discardTop = myData.discardTop;
        for (let player of players.keys()) {
            if (player !== socket) {
                player.emit("updateDiscard", { discardTop: discardTop });
            }
        }
    });

    socket.on("wantToPlay", (myData: any) => {
        let card = myData.card;
        let index = myData.idx;
        if (turnNumber === 1) {
            if (
                actions.includes(discardTop.number) ||
                discardTop.number == "W" ||
                discardTop.number == "W4"
            ) {
                // Player 1 can play any card they want
                validCard(socket, card, index);
                return;
            }
        }
        if (card.number === "W") {
            if (discardTop.number !== "D" && discardTop.number !== "W4") {
                validCard(socket, card, index);
                return;
            }
        }
        if (card.number === "W4") {
            if (discardTop.number !== "D" && discardTop.number !== "W4") {
                socket.emit("sendHandForValidation", {
                    card: card,
                    idx: myData.idx,
                });
                return;
            }
        }
        if (discardTop.number === "W4") {
            // Allow player to throw any card (after upper conditions filtered)
            validCard(socket, card, index);
        }
        if (discardTop.number === "W") {
            // Allow player to throw any card (after upper conditions filtered)
            validCard(socket, card, index);
        }
        if (
            card.number !== discardTop.number &&
            card.color !== discardTop.color
        ) {
            socket.emit("msg", { msg: "Invalid Move. Please try again" });
            return;
        }
        validCard(socket, card, index);
        return;
    });

    socket.on("nextTurn", (myData: any) => {
        turnNumber += 1;
        let cardPlayed = myData.cardPlayed;
        if (cardPlayed.number === "S") {
            if (!reversed) turnOf = (turnOf + 2) % NUM_PLAYERS || NUM_PLAYERS;
            else turnOf = (turnOf - 1) % NUM_PLAYERS || NUM_PLAYERS;
        } else if (cardPlayed.number === "R") {
            if (!reversed) {
                reversed = true;
                turnOf = (turnOf - 1) % NUM_PLAYERS || NUM_PLAYERS;
            } else {
                reversed = false;
                turnOf = (turnOf % NUM_PLAYERS) + 1;
            }
        } else if (cardPlayed.number === "D") {
            if (!reversed) turnOf = (turnOf % NUM_PLAYERS) + 1;
            else turnOf = (turnOf - 1) % NUM_PLAYERS || NUM_PLAYERS;
            if (deck.size <= 2) {
                for (let player of clients.keys()) {
                    player.emit("draw");
                }
                return;
            }
            let card1 = deck.pop();
            let card2 = deck.pop();
            // Get socket of next player and update their hand
            for (let player of clients.keys()) {
                if (clients.get(player) === turnOf) {
                    player.emit("addToHand", { cards: [card1, card2] });
                }
            }
            for (let player of players.keys()) {
                player.emit("msg", { msg: `Player ${turnOf} drew 2 cards` });
                player.emit("updateDeck", { deck: deck });
            }
        } else if (cardPlayed.number === "W4") {
            if (!reversed) turnOf = (turnOf % NUM_PLAYERS) + 1;
            else turnOf = (turnOf - 1) % NUM_PLAYERS || NUM_PLAYERS;
            if (deck.size <= 4) {
                for (let player of clients.keys()) {
                    player.emit("draw");
                }
                return;
            }
            let card1 = deck.pop();
            let card2 = deck.pop();
            let card3 = deck.pop();
            let card4 = deck.pop();
            // Get socket of next player and update their hand
            for (let player of clients.keys()) {
                if (clients.get(player) === turnOf) {
                    player.emit("addToHand", {
                        cards: [card1, card2, card3, card4],
                    });
                }
            }
            for (let player of players.keys()) {
                player.emit("msg", { msg: `Player ${turnOf} drew 4 cards` });
                player.emit("updateDeck", { deck: deck });
            }
            // Skip their turn
            if (!reversed) turnOf = (turnOf % NUM_PLAYERS) + 1;
            else turnOf = (turnOf - 1) % NUM_PLAYERS || NUM_PLAYERS;
        } else if (cardPlayed.number === "W") {
            // Same player's turn again, pass
        } else {
            // Normal card
            if (!reversed) {
                turnOf = (turnOf % NUM_PLAYERS) + 1;
            } else turnOf = (turnOf - 1) % NUM_PLAYERS || NUM_PLAYERS;
        }
        // Update everyone with the next player's turn
        for (let player of players.keys()) {
            player.emit("msg", { msg: `It is Player ${turnOf}'s turn now.` });
        }
    });

    socket.on("validateHand", (myData: any) => {
        // Check if player wanting to play W4 could have played some other card
        let handToValidate = myData.hand;
        let valid = true;
        for (let card of handToValidate) {
            if (
                card.number === discardTop.number ||
                card.number === discardTop.color
            ) {
                valid = false;
                break;
            }
        }
        if (valid) {
            validCard(socket, myData.card, myData.idx);
        } else {
            socket.emit("msg", {
                msg: "Invalid Move. Wild 4 can only be played if no other card is playable and only if the top of the discard pile does not have a Draw 2 or Wild card",
            });
        }
    });

    socket.on("iAmUnoMaster", () => {
        for (let player of players.keys()) {
            player.emit("won", { winner: players.get(socket)[1] });
        }
    });

    socket.on("notDrawnPass", () => {
        socket.emit("msg", { msg: "You must draw a card before passing" });
    });

    socket.on("pass", () => {
        if (!reversed) turnOf = (turnOf % NUM_PLAYERS) + 1;
        else turnOf = (turnOf - 1) % NUM_PLAYERS || NUM_PLAYERS;
        for (let player of players.keys()) {
            player.emit("msg", {
                msg: `Player ${clients.get(
                    socket
                )} passed their turn. It is now Player ${turnOf}'s turn.`,
            });
        }
    });

    socket.on("alreadyDrawn", () => {
        socket.emit("msg", { msg: "You can only draw one card per round" });
    });

    socket.on("emitDraw", () => {
        for (let player of clients.keys()) {
            player.emit("draw");
        }
    });

    socket.on("addToMyHand", (myData: any) => {
        console.log("In add to hand server side");
        let card = myData.card;
        socket.emit("heDrew");
        socket.emit("addToHand", { cards: [card] });
    });

    socket.on("setDrawnFalse", () => {
        socket.emit("setDrawFalse");
    });

    socket.on("initializeHand", () => {
        socket.emit("initialHand", {
            hand: player_hand[clients.get(socket) - 1],
        });
    });

    socket.on("disconnect", () => {
        let id = clients.get(socket);
        console.log(`Client ${id} disconnected with socket id ${socket.id}`);
        clients.delete(socket);
        if (players.get(socket)) players.delete(socket);
    });
});
