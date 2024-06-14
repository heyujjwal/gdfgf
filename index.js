//- Import: express, http, socket.io, chess.js

const express= require('express')
const socket= require('socket.io')
const http =require('http')
const {Chess}= require('chess.js')
const path= require("path")
const { log } = require('console')

//Create Express app instance

const app = express()

//Initialize HTTP server with Express
const server = http.createServer(app)

//Instantiate Socket.io on HTTP server
const io= socket(server)

//Create Chess object instance (chess.js)
const chess = new Chess()

// Initialize:
//Players object: track socket IDs, roles (white/black)


let players= {

}
//CurrentPlayer: track current turn
let currentPlayer="w"

// Configure Express app:
// - Use EJS templating engine

app.set("view engine", "ejs")

//  Serve static files from 'public' directory
app.use(express.static(path.join(__dirname,"public")))

// Define route for root URL
app.get("/" , (req,res)=>{

    //Render EJS template "index"
    //title: "Custom Chess Game"
    res.render("index" , {title:"Not Your Move"})
})

//Socket.io handles connection event  
//Callback executed on client connect

io.on("connection",function(uniqueSocket){
    console.log("Player Connected")

    //assigns role based on availability
    if(!players.white){
        players.white=uniqueSocket.id
        uniqueSocket.emit("playerRole","w")
    }
    else if(!players.black){
        players.black =uniqueSocket.id
        uniqueSocket.emit("playerRole","b")
    }
    // If both slots filled, designate as spectator
    else{
        uniqueSocket.emit("spectatorRole")
    }

    // Client disconnection:
    // - Remove assigned role from players object
    uniqueSocket.on("disconnect", function(){
        console.log("Player Disconnected")
        if(uniqueSocket.id === players.white){
            delete players.white
        }
        else if(uniqueSocket.id === players.black){
            delete players.black
        }
    })

    // Listen for "move" events:
    // - Validate correct player's turn
    uniqueSocket.on("move",(move)=>{
        try {
            if(chess.turn()=="w" && uniqueSocket.id!== players.white)
            return 
            if(chess.turn()=="b" && uniqueSocket.id!== players.black)
            return 
            //Broadcast move via "move" event
            // - Send updated board state via "boardState" event
            const result= chess.move(move)
            if(result){
                currentPlayer=chess.turn()
                io.emit("move",move)
                io.emit("boardState" , chess.fen())
            }
            else{
                console.log("Invalid move: ",move );
                uniqueSocket.emit("invalidMove", move)
            }
        } catch (error) {
            console.log("Error in handling move",error);
            uniqueSocket.emit("Invalid Move: ", move)
            
        }
    })
    
})

server.listen(3000,function(){
    console.log("Server running on port 3000")
})