const socket = io();

const nickname = document.getElementById("nickname");
const nicknameInput = nickname.querySelector("input");

const enter = document.getElementById("enter");
const join = document.getElementById("join");
const joinInput = join.querySelector("input");
const rooms = enter.querySelector("h4");

const room = document.getElementById("room");
const roomTitle = room.querySelector("h3");
const exitBtn = document.getElementById("exit");
const messages = room.querySelector("ul");
const messageForm = room.querySelector("#message");
const messageInput = messageForm.querySelector("input");

room.hidden = true;

let roomName;

function handleNicknameSubmit(event) {
  event.preventDefault();
  socket.emit("edit_nickname", nicknameInput.value);
}

nickname.addEventListener("submit", handleNicknameSubmit);

function showRoom() {
  enter.hidden = true;
  room.hidden = false; 
  messageForm.addEventListener("submit", handleMessageSubmit);
}

function handleEnterRoomSubmit(event) {
  event.preventDefault();
  socket.emit("enter_room", joinInput.value, showRoom);
  roomName = joinInput.value;
}

join.addEventListener("submit", handleEnterRoomSubmit);

function addMessage(message, type) {
  const li = document.createElement("li");
  li.innerText = message;
  li.className = type
  messages.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const message = messageInput.value;
  socket.emit("new_message", message, roomName, () => {
    addMessage(`${message}`, "me");
  });
  messageInput.value = "";
}

function hiddenRoom() {
  enter.hidden = false;
  room.hidden = true; 
}

function handleExitBtn(event) {
  event.preventDefault();
  socket.emit("exit_room", roomName, hiddenRoom);
}

exitBtn.addEventListener("click", handleExitBtn);

socket.on("hi", (user, newCount) => {
  roomTitle.innerText = `${roomName} (${newCount}명)`;
  addMessage(`${user}이(가) 접속했습니다.`, "notice");
});

socket.on("bye", (user, newCount) => {
  roomTitle.innerText = `${roomName} (${newCount}명)`;
  addMessage(`${user}이(가) 나갔습니다.`, "notice");
});

socket.on("new_message", addMessage);

socket.on("room_change", (roomList) => {
  rooms.innerText = "";
  roomList.forEach((room) => {
    rooms.innerText = `${rooms.innerText} ${room}`
  });
})
