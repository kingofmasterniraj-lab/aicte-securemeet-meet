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
  const value = String(name || "").trim();
  return value.slice(0, 80) || fallback;
}

function getMeeting(socket) {
  const id = socket.data.meetingId;
  return id ? meetings.get(id) : null;
}

function meetingParticipants(meeting, excludeSocketId = null) {
  return Array.from(meeting.participants.entries())
    .filter(([socketId]) => socketId !== excludeSocketId)
    .map(([socketId, user]) => ({
      socketId,
      name: user.name,
      role: user.role
    }));
}

function removeSocket(socket) {
  const meetingId = socket.data.meetingId;

  if (!meetingId) {
    return;
  }

  const meeting = meetings.get(meetingId);

  if (!meeting) {
    socket.data.meetingId = null;
    return;
  }

  const wasHost = meeting.hostSocket === socket.id;

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
  } else {
    io.to(meetingId).emit("meeting-updated", {
      id: meeting.id,
      participantCount: meeting.participants.size
    });
  }
}

io.on("connection", (socket) => {

  console.log("Socket connected:", socket.id);

  // --------------------------------------------------
  // LIST ACTIVE MEETINGS
  // --------------------------------------------------

  socket.on("list-meetings", (callback) => {

    const list = Array.from(meetings.values()).map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      hostName: meeting.hostName,
      participantCount: meeting.participants.size
    }));

    if (typeof callback === "function") {
      callback(list);
    }
  });

  // --------------------------------------------------
  // CREATE MEETING
  // --------------------------------------------------

  socket.on("create-meeting", (data = {}, callback) => {

    try {

      if (socket.data.meetingId) {
        removeSocket(socket);
      }

      let meetingId;

      do {
        meetingId = makeMeetingId();
      } while (meetings.has(meetingId));

      const hostName = safeName(
        data.name,
        "AICTE Administrator"
      );

      const title = safeName(
        data.title,
        "AICTE Secure Meeting"
      );

      const meeting = {
        id: meetingId,
        title,
        hostSocket: socket.id,
        hostName,
        createdAt: Date.now(),

        participants: new Map()
      };

      // IMPORTANT:
      // Admin is also stored as a participant.
      meeting.participants.set(socket.id, {
        name: hostName,
        role: "Admin"
      });

      meetings.set(meetingId, meeting);

      socket.join(meetingId);

      socket.data.meetingId = meetingId;
      socket.data.name = hostName;
      socket.data.role = "Admin";

      console.log(
        `Meeting created: ${meetingId} by ${hostName}`
      );

      if (typeof callback === "function") {
        callback({
          ok: true,
          meetingId,
          title,
          hostSocket: socket.id,
          hostName,
          participants: []
        });
      }

      // Tell every connected client that a new
      // meeting is now available.
      io.emit("meeting-created", {
        id: meetingId,
        title,
        hostName,
        participantCount: 1
      });

    } catch (error) {

      console.error(
        "CREATE MEETING ERROR:",
        error
      );

      if (typeof callback === "function") {
        callback({
          ok: false,
          error: "Unable to create meeting."
        });
      }
    }
  });

  // --------------------------------------------------
  // JOIN MEETING
  // --------------------------------------------------

  socket.on("join-meeting", (data = {}, callback) => {

    try {

      const meetingId = String(
        data.meetingId || ""
      )
        .trim()
        .toUpperCase();

      if (!meetingId) {
        callback?.({
          ok: false,
          error: "Meeting ID is required."
        });
        return;
      }

      const meeting = meetings.get(meetingId);

      if (!meeting) {
        callback?.({
          ok: false,
          error: "Meeting not found or has ended."
        });
        return;
      }

      if (
        socket.data.meetingId &&
        socket.data.meetingId !== meetingId
      ) {
        removeSocket(socket);
      }

      const participantName = safeName(
        data.name,
        "Participant"
      );

      const existingParticipants =
        meetingParticipants(
          meeting,
          socket.id
        );

      meeting.participants.set(socket.id, {
        name: participantName,
        role: "Participant"
      });

      socket.join(meetingId);

      socket.data.meetingId = meetingId;
      socket.data.name = participantName;
      socket.data.role = "Participant";

      console.log(
        `${participantName} joined ${meetingId}`
      );

      callback?.({
        ok: true,
        meetingId,
        title: meeting.title,
        hostSocket: meeting.hostSocket,
        hostName: meeting.hostName,
        participants: existingParticipants
      });

      socket.to(meetingId).emit(
        "participant-joined",
        {
          socketId: socket.id,
          name: participantName,
          role: "Participant"
        }
      );

      io.to(meetingId).emit(
        "meeting-updated",
        {
          id: meeting.id,
          participantCount:
            meeting.participants.size
        }
      );

    } catch (error) {

      console.error(
        "JOIN MEETING ERROR:",
        error
      );

      callback?.({
        ok: false,
        error: "Unable to join meeting."
      });
    }
  });

  // --------------------------------------------------
  // WEBRTC OFFER
  // --------------------------------------------------

  socket.on(
    "offer",
    ({ target, offer } = {}) => {

      const meeting = getMeeting(socket);

      if (!meeting || !target || !offer) {
        return;
      }

      const targetSocket =
        io.sockets.sockets.get(target);

      if (!targetSocket) {
        return;
      }

      if (
        targetSocket.data.meetingId !==
        socket.data.meetingId
      ) {
        return;
      }

      targetSocket.emit("offer", {
        sender: socket.id,
        offer
      });
    }
  );

  // --------------------------------------------------
  // WEBRTC ANSWER
  // --------------------------------------------------

  socket.on(
    "answer",
    ({ target, answer } = {}) => {

      const meeting = getMeeting(socket);

      if (!meeting || !target || !answer) {
        return;
      }

      const targetSocket =
        io.sockets.sockets.get(target);

      if (!targetSocket) {
        return;
      }

      if (
        targetSocket.data.meetingId !==
        socket.data.meetingId
      ) {
        return;
      }

      targetSocket.emit("answer", {
        sender: socket.id,
        answer
      });
    }
  );

  // --------------------------------------------------
  // WEBRTC ICE
  // --------------------------------------------------

  socket.on(
    "ice-candidate",
    ({ target, candidate } = {}) => {

      const meeting = getMeeting(socket);

      if (!meeting || !target || !candidate) {
        return;
      }

      const targetSocket =
        io.sockets.sockets.get(target);

      if (!targetSocket) {
        return;
      }

      if (
        targetSocket.data.meetingId !==
        socket.data.meetingId
      ) {
        return;
      }

      targetSocket.emit(
        "ice-candidate",
        {
          sender: socket.id,
          candidate
        }
      );
    }
  );

  // --------------------------------------------------
  // CHAT
  // --------------------------------------------------

  socket.on(
    "chat-message",
    ({ message } = {}) => {

      const meeting = getMeeting(socket);

      if (!meeting) {
        return;
      }

      const text = String(
        message || ""
      )
        .trim()
        .slice(0, 1000);

      if (!text) {
        return;
      }

      io.to(meeting.id).emit(
        "chat-message",
        {
          sender:
            socket.data.name ||
            "User",

          socketId: socket.id,

          message: text,

          time: Date.now()
        }
      );
    }
  );

  // --------------------------------------------------
  // LEAVE
  // --------------------------------------------------

  socket.on(
    "leave-meeting",
    () => {
      removeSocket(socket);
    }
  );

  // --------------------------------------------------
  // ADMIN ENDS MEETING
  // --------------------------------------------------

  socket.on(
    "end-meeting",
    () => {

      const meeting =
        getMeeting(socket);

      if (!meeting) {
        return;
      }

      if (
        meeting.hostSocket !==
        socket.id
      ) {
        return;
      }

      io.to(meeting.id).emit(
        "meeting-ended"
      );

      for (
        const [socketId]
        of meeting.participants
      ) {

        const participantSocket =
          io.sockets.sockets.get(
            socketId
          );

        if (participantSocket) {

          participantSocket.data.meetingId =
            null;

          participantSocket.leave(
            meeting.id
          );
        }
      }

      meetings.delete(
        meeting.id
      );

      socket.data.meetingId = null;

      console.log(
        `Meeting ended: ${meeting.id}`
      );
    }
  );

  // --------------------------------------------------
  // DISCONNECT
  // --------------------------------------------------

  socket.on(
    "disconnect",
    (reason) => {

      console.log(
        "Socket disconnected:",
        socket.id,
        reason
      );

      removeSocket(socket);
    }
  );
});

// ----------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------

app.get(
  "/health",
  (req, res) => {

    res.json({
      status: "ok",
      service: "AICTE SecureMeet",
      time: new Date().toISOString(),
      meetings: meetings.size
    });
  }
);

// ----------------------------------------------------
// SPA FALLBACK
// ----------------------------------------------------

app.use(
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );
  }
);

// ----------------------------------------------------
// START
// ----------------------------------------------------

server.listen(
  PORT,
  () => {

    console.log(
      `AICTE SecureMeet running on port ${PORT}`
    );
  }
);
