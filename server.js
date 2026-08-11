const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"]
});

const PORT = process.env.PORT || 3000;
const meetings = new Map();

app.use(express.json());
app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, "public")
  );
});

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

io.on("connection", socket => {
  socket.on("list-meetings", cb => {
    const list = [...meetings.values()].map(m => ({
      id: m.id, title: m.title, hostName: m.hostName,
      participantCount: m.participants.size
    }));
    if (typeof cb === "function") cb(list);
  });

  socket.on("create-meeting", ({ name, title }, cb) => {
    let id;
    do id = makeMeetingId(); while (meetings.has(id));
    const hostName = safeName(name, "Admin");
    const meeting = {
      id, title: safeName(title, "AICTE Secure Meeting"),
      hostSocket: socket.id, hostName,
      participants: new Map([[socket.id, { name: hostName, role: "Admin" }]])
    };
    meetings.set(id, meeting);
    socket.join(id);
    socket.data.meetingId = id;
    socket.data.name = hostName;
    socket.data.role = "Admin";
    cb?.({ ok: true, meetingId: id, title: meeting.title });
  });

  socket.on("join-meeting", ({ meetingId, name }, cb) => {
    const id = String(meetingId || "").trim().toUpperCase();
    const meeting = meetings.get(id);
    if (!meeting) return cb?.({ ok: false, error: "Meeting not found or has ended." });

    if (socket.data.meetingId && socket.data.meetingId !== id) removeSocket(socket);

    const participantName = safeName(name);
    const participants = [...meeting.participants.entries()]
      .filter(([sid]) => sid !== socket.id)
      .map(([socketId, u]) => ({ socketId, name: u.name, role: u.role }));

    meeting.participants.set(socket.id, { name: participantName, role: "Participant" });
    socket.join(id);
    socket.data.meetingId = id;
    socket.data.name = participantName;
    socket.data.role = "Participant";

    cb?.({
      ok: true, meetingId: id, title: meeting.title,
      hostSocket: meeting.hostSocket, hostName: meeting.hostName,
      participants
    });

    socket.to(id).emit("participant-joined", {
      socketId: socket.id, name: participantName, role: "Participant"
    });
  });

  // WebRTC signaling: target is always another socket in the same meeting.
  socket.on("offer", ({ target, offer }) => {
    if (!target || !offer || !getMeeting(socket)) return;
    io.to(target).emit("offer", { sender: socket.id, offer });
  });
  socket.on("answer", ({ target, answer }) => {
    if (!target || !answer || !getMeeting(socket)) return;
    io.to(target).emit("answer", { sender: socket.id, answer });
  });
  socket.on("ice-candidate", ({ target, candidate }) => {
    if (!target || !candidate || !getMeeting(socket)) return;
    io.to(target).emit("ice-candidate", { sender: socket.id, candidate });
  });

  socket.on("chat-message", ({ message }) => {
    const meeting = getMeeting(socket);
    if (!meeting) return;
    const text = String(message || "").trim().slice(0, 1000);
    if (!text) return;
    io.to(meeting.id).emit("chat-message", {
      sender: socket.data.name || "User", socketId: socket.id,
      message: text, time: Date.now()
    });
  });

  socket.on("leave-meeting", () => removeSocket(socket));

  socket.on("end-meeting", () => {
    const meeting = getMeeting(socket);
    if (!meeting || meeting.hostSocket !== socket.id) return;

    io.to(meeting.id).emit("meeting-ended");
    for (const [sid] of meeting.participants) {
      const s = io.sockets.sockets.get(sid);
      if (s) {
        s.data.meetingId = null;
        s.leave(meeting.id);
      }
    }
    meetings.delete(meeting.id);
    socket.data.meetingId = null;
  });

  socket.on("disconnect", () => removeSocket(socket));
});

function removeSocket(socket) {
  const meetingId = socket.data.meetingId;
  if (!meetingId) return;

  const meeting = meetings.get(meetingId);
  if (!meeting) {
    socket.data.meetingId = null;
    return;
  }

  const wasHost = meeting.hostSocket === socket.id;
  meeting.participants.delete(socket.id);

  socket.to(meetingId).emit("participant-left", {
    socketId: socket.id, name: socket.data.name || "Participant"
  });

  socket.leave(meetingId);
  socket.data.meetingId = null;

  if (wasHost) {
    io.to(meetingId).emit("meeting-ended");
    meetings.delete(meetingId);
  }
}

app.get("/health", (req, res) => res.json({
  status: "ok", service: "AICTE SecureMeet",
  time: new Date().toISOString(), meetings: meetings.size
}));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => {
  console.log(`AICTE SecureMeet running on port ${PORT}`);
});
