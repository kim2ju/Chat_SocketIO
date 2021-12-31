import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function RoomList() {
  const {
    sockets: {
      adapter: { sids, rooms }
    }
  } = wsServer;
  const RoomList = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      RoomList.push(key);
    }
  });
  return RoomList;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "익명";
  wsServer.sockets.emit("room_change", RoomList());
  socket.on("edit_nickname", (nickname) => (socket["nickname"] = nickname));
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("hi", socket.nickname, countRoom(roomName));
    socket.emit("hi", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", RoomList());
  });
  socket.on("exit_room", (roomName, done) => {
    socket.rooms.forEach((roomName) =>
      socket.to(roomName).emit("bye", socket.nickname, countRoom(roomName) - 1)
    );
    socket.leave(roomName);
    done();
    wsServer.sockets.emit("room_change", RoomList());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomName) =>
      socket.to(roomName).emit("bye", socket.nickname, countRoom(roomName) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", RoomList());
  });
  socket.on("new_message", (msg, roomName, done) => {
    socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`, "you");
    done();
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
