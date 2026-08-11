const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

const PORT = process.env.PORT || 3000;
const meetings = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function makeMeetingId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function safeName(name, fallback = "Participant") {
  return String(name || fallback).trim().slice(0, 80) || fallback;
}

function getMeeting(socket) {
  const id = socket.data.meetingId;
  return id ? meetings.get(id) : null;
}

io.on("connection", (socket) => {

  socket.on("list-meetings", (callback) => {
    const list = [];

    for (const meeting of meetings.values()) {
      list.push({
        id: meeting.id,
        hostName: meeting.hostName,
        participantCount: meeting.participants.size
      });
    }

    if (typeof callback === "function") {
      callback(list);
    }
  });


  socket.on("create-meeting", ({ name }, callback) => {

    let id;

    do {
      id = makeMeetingId();
    } while (meetings.has(id));

    const hostName = safeName(name, "Admin");

    meetings.set(id, {
      id,
      hostSocket: socket.id,
      hostName,
      participants: new Map([
  [socket.id, {
    name: hostName,
    role: "Admin"
  }]
])
    });

    socket.join(id);

    socket.data.meetingId = id;
    socket.data.name = hostName;
    socket.data.role = "Admin";

    if (typeof callback === "function") {
      callback({
        ok: true,
        meetingId: id
      });
    }

  });


  socket.on("join-meeting", ({ meetingId, name }, callback) => {

    const id = String(meetingId || "").trim().toUpperCase();
    const meeting = meetings.get(id);

    if (!meeting) {
      callback?.({
        ok: false,
        error: "Meeting not found or has ended."
      });
      return;
    }

    if (socket.data.meetingId && socket.data.meetingId !== id) {
      removeSocket(socket);
    }

    const participantName = safeName(name);

    const existingParticipants =
      Array.from(meeting.participants.entries())
        .map(([socketId, user]) => ({
          socketId,
          name: user.name,
          role: user.role
        }));

    meeting.participants.set(socket.id, {
      name: participantName,
      role: "Participant"
    });

    socket.join(id);

    socket.data.meetingId = id;
    socket.data.name = participantName;
    socket.data.role = "Participant";

    callback?.({
      ok: true,
      meetingId: id,
      hostSocket: meeting.hostSocket,
      hostName: meeting.hostName,
      participants: existingParticipants
    });

    socket.to(id).emit("participant-joined", {
      socketId: socket.id,
      name: participantName,
      role: "Participant"
    });

  });


  /*
   * WebRTC signaling
   */

  socket.on("offer", ({ target, offer }) => {

    if (!target || !offer) return;

    io.to(target).emit("offer", {
      sender: socket.id,
      offer
    });

  });


  socket.on("answer", ({ target, answer }) => {

    if (!target || !answer) return;

    io.to(target).emit("answer", {
      sender: socket.id,
      answer
    });

  });


  socket.on("ice-candidate", ({ target, candidate }) => {

    if (!target || !candidate) return;

    io.to(target).emit("ice-candidate", {
      sender: socket.id,
      candidate
    });

  });


  /*
   * Real-time chat
   */

  socket.on("chat-message", ({ message }) => {

    const meeting = getMeeting(socket);

    if (!meeting) return;

    const text =
      String(message || "")
        .trim()
        .slice(0, 1000);

    if (!text) return;

    io.to(meeting.id).emit("chat-message", {
      sender: socket.data.name || "User",
      socketId: socket.id,
      message: text,
      time: Date.now()
    });

  });


  /*
   * Participant leaves
   */

  socket.on("leave-meeting", () => {
    removeSocket(socket);
  });


  /*
   * Admin ends meeting
   */

  socket.on("end-meeting", () => {

    const meeting = getMeeting(socket);

    if (!meeting) return;

    if (meeting.hostSocket !== socket.id) return;

    io.to(meeting.id).emit("meeting-ended");

    for (const [socketId] of meeting.participants) {
      const participantSocket = io.sockets.sockets.get(socketId);

      if (participantSocket) {
        participantSocket.data.meetingId = null;
        participantSocket.leave(meeting.id);
      }
    }

    meetings.delete(meeting.id);

    socket.data.meetingId = null;
  });


  socket.on("disconnect", () => {
    removeSocket(socket);
  });

});


function removeSocket(socket) {

  const meetingId = socket.data.meetingId;

  if (!meetingId) return;

  const meeting = meetings.get(meetingId);

  if (!meeting) {
    socket.data.meetingId = null;
    return;
  }

  const wasHost =
    meeting.hostSocket === socket.id;

  meeting.participants.delete(socket.id);

  socket.to(meetingId).emit("participant-left", {
    socketId: socket.id,
    name: socket.data.name || "Participant"
  });

  socket.leave(meetingId);
  socket.data.meetingId = null;

  if (wasHost) {

    io.to(meetingId).emit("meeting-ended");

    meetings.delete(meetingId);

    return;
  }

}


/*
 * Health check
 */

app.get("/health", (req, res) => {

  res.json({
    status: "ok",
    service: "AICTE SecureMeet",
    time: new Date().toISOString(),
    meetings: meetings.size
  });

});


/*
 * SPA fallback
 */

app.use((req, res) => {

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

