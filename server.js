const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const meetings = new Map();

function makeMeetingId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

io.on("connection", (socket) => {

  socket.on("create-meeting", ({ name }, callback) => {

    let id;

    do {
      id = makeMeetingId();
    } while (meetings.has(id));

    meetings.set(id, {
      id,
      hostSocket: socket.id,
      hostName: name || "Admin",
      participants: new Map()
    });

    socket.join(id);

    socket.data.meetingId = id;
    socket.data.name = name || "Admin";
    socket.data.role = "Admin";

    callback({
      ok: true,
      meetingId: id
    });

  });


  socket.on("list-meetings", (callback) => {

    const list = [];

    for (const meeting of meetings.values()) {

      list.push({
        id: meeting.id,
        hostName: meeting.hostName,
        participantCount:
          meeting.participants.size
      });

    }

    callback(list);

  });


  socket.on("join-meeting", ({ meetingId, name }, callback) => {

    const id = String(meetingId || "").toUpperCase();

    const meeting = meetings.get(id);

    if (!meeting) {

      callback({
        ok: false,
        error: "Meeting not found."
      });

      return;
    }

    const existingParticipants =
      Array.from(
        meeting.participants.entries()
      ).map(([socketId, user]) => ({
        socketId,
        name: user.name
      }));


    meeting.participants.set(socket.id, {
      name: name || "Participant"
    });


    socket.join(id);

    socket.data.meetingId = id;
    socket.data.name = name || "Participant";
    socket.data.role = "Participant";


    callback({
      ok: true,
      meetingId: id,
      hostSocket: meeting.hostSocket,
      participants: existingParticipants
    });


    socket.to(id).emit("participant-joined", {
      socketId: socket.id,
      name: name || "Participant"
    });

  });


  /*
   * WebRTC signaling
   */

  socket.on("offer", ({ target, offer }) => {

    io.to(target).emit("offer", {
      sender: socket.id,
      offer
    });

  });


  socket.on("answer", ({ target, answer }) => {

    io.to(target).emit("answer", {
      sender: socket.id,
      answer
    });

  });


  socket.on("ice-candidate", ({ target, candidate }) => {

    io.to(target).emit("ice-candidate", {
      sender: socket.id,
      candidate
    });

  });


  socket.on("chat-message", ({ message }) => {

    const meetingId =
      socket.data.meetingId;

    if (!meetingId) return;

    io.to(meetingId).emit("chat-message", {
      sender: socket.data.name || "User",
      message: String(message).slice(0, 1000)
    });

  });


  socket.on("leave-meeting", () => {

    removeSocket(socket);

  });


  socket.on("end-meeting", () => {

    const meetingId =
      socket.data.meetingId;

    const meeting =
      meetings.get(meetingId);

    if (!meeting) return;

    if (
      meeting.hostSocket !== socket.id
    ) return;

    io.to(meetingId).emit(
      "meeting-ended"
    );

    meetings.delete(meetingId);

  });


  socket.on("disconnect", () => {

    removeSocket(socket);

  });

});


function removeSocket(socket) {

  const meetingId =
    socket.data.meetingId;

  if (!meetingId) return;

  const meeting =
    meetings.get(meetingId);

  if (!meeting) return;


  meeting.participants.delete(
    socket.id
  );


  socket.to(meetingId).emit(
    "participant-left",
    {
      socketId: socket.id
    }
  );


  if (
    meeting.hostSocket === socket.id
  ) {

    io.to(meetingId).emit(
      "meeting-ended"
    );

    meetings.delete(meetingId);

    return;

  }


  socket.leave(meetingId);

}


app.get("/health", (req, res) => {

  res.json({
    status: "ok",
    service: "AICTE SecureMeet"
  });

});


app.get("*", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});


server.listen(PORT, () => {

  console.log(
    `AICTE SecureMeet running on port ${PORT}`
  );

});
