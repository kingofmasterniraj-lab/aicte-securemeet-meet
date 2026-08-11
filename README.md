# AICTE SecureMeet

### Personalized Online Meeting System for AICTE

**Smart India Hackathon 2026**\
**Problem Statement ID:** 1464\
**Problem Statement:** Design and Develop a Personalized Online Meeting
System for AICTE\
**Theme:** Blockchain & Cybersecurity\
**Category:** Software\
**Team Name:** Segmentation Error

------------------------------------------------------------------------

## 1. Project Overview

**AICTE SecureMeet** is a personalized web-based online meeting platform
designed for secure communication between AICTE officials, institutions,
faculty members, HODs, ministry stakeholders, and other authorized
participants.

The platform provides a controlled meeting environment with separate
**Admin** and **Participant** workflows, real-time audio/video
communication, meeting IDs, participant management, chat,
microphone/camera controls, and responsive support for both smartphones
and laptops.

### Live Demo

**Application:**\
https://aicte-securemeet-meet-1.onrender.com/

**Source Code:**\
https://github.com/kingofmasterniraj-lab/aicte-securemeet-meet

------------------------------------------------------------------------

## 2. Problem Statement

AICTE conducts many online meetings involving multiple stakeholders.
Confidential information may be discussed or shared during these
meetings.

General-purpose meeting platforms may not provide the level of
customization, role-based control, meeting governance, and
AICTE-specific security policies required for an institutional
environment.

AICTE therefore needs a personalized online meeting system that
provides:

-   Controlled meeting access
-   Role-based Admin and Participant workflows
-   Secure real-time communication
-   Meeting identification and invitation
-   Participant visibility
-   Camera and microphone controls
-   Real-time chat
-   Security and audit-oriented architecture
-   Mobile and laptop accessibility

------------------------------------------------------------------------

## 3. Proposed Solution

AICTE SecureMeet provides a dedicated meeting environment in which an
authorized Admin can create a live meeting and share its Meeting ID/link
with participants.

Participants can open the same public application from a phone or
laptop, authenticate through the participant interface, view available
meetings, and join an active meeting.

### Main workflow

``` text
Admin Login
    ↓
Create / Start Meeting
    ↓
Generate Meeting ID
    ↓
Share Meeting ID / Link
    ↓
Participants Open SecureMeet
    ↓
Participant Login
    ↓
View / Join Live Meeting
    ↓
WebRTC Audio + Video
    ↓
Real-Time Chat + Controls
    ↓
Admin Monitors Participants
```

------------------------------------------------------------------------

## 4. Key Features

### Admin

-   Separate Admin login
-   Start live meeting
-   Generate Meeting ID
-   Share meeting link
-   View active participants
-   Control meeting lifecycle
-   End meeting
-   Camera control
-   Microphone control
-   Screen sharing
-   Real-time chat

### Participant

-   Separate Participant login
-   Join using Meeting ID
-   View active meetings
-   Join live meeting
-   Camera control
-   Microphone control
-   Real-time chat
-   Screen sharing where supported
-   Leave meeting

### Meeting

-   Real-time audio/video
-   Multi-participant support
-   Participant names
-   Live participant status
-   Meeting ID
-   Shareable meeting link
-   Responsive meeting interface
-   Mobile support
-   Laptop/desktop support

------------------------------------------------------------------------

## 5. Technical Architecture

``` text
                 ┌─────────────────────┐
                 │   User Browser      │
                 │ Phone / Laptop      │
                 └──────────┬──────────┘
                            │ HTTPS
                            ▼
                 ┌─────────────────────┐
                 │  Node.js / Express  │
                 │  Application Server │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
     ┌────────────────┐          ┌────────────────┐
     │ Socket.IO      │          │ Static Web App │
     │ Signaling      │          │ HTML/CSS/JS    │
     └───────┬────────┘          └────────────────┘
             │
             ▼
     ┌────────────────────┐
     │ WebRTC Connections │
     │ Audio + Video      │
     └────────────────────┘
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
    Admin  User 1  User 2 ...
```

------------------------------------------------------------------------

## 6. Technology Stack

### Frontend

-   HTML5
-   CSS3
-   JavaScript
-   Responsive Web Design
-   WebRTC APIs
-   Browser MediaDevices API

### Backend

-   Node.js
-   Express.js
-   Socket.IO

### Real-Time Communication

-   WebRTC for peer-to-peer audio/video
-   Socket.IO for signaling and real-time meeting events
-   ICE/STUN support for connectivity

### Hosting

-   GitHub for source-code management
-   Render for Node.js application hosting
-   HTTPS public deployment

------------------------------------------------------------------------

## 7. Security Approach

Security is treated as a core design requirement rather than an
additional feature.

### Current prototype security controls

-   Separate Admin and Participant workflows
-   Meeting ID-based access
-   Browser-controlled camera/microphone permissions
-   HTTPS deployment
-   WebRTC real-time media transport
-   Role-aware meeting interface
-   Controlled meeting lifecycle
-   Participant visibility
-   No hard-coded production credentials in the public repository

### Production security roadmap

For production AICTE deployment, the following should be added:

-   AICTE SSO/OAuth2 integration
-   Multi-factor authentication
-   WebAuthn support
-   Role-Based Access Control (RBAC)
-   PostgreSQL database
-   Redis for scalable real-time state
-   TLS 1.3 enforcement
-   Encrypted recording storage
-   Audit logs
-   Secure meeting policies
-   Watermarking
-   Meeting expiry
-   Device/session management
-   TURN infrastructure for reliable WebRTC connectivity
-   Security monitoring and alerting
-   Regular penetration testing

------------------------------------------------------------------------

## 8. Why the Solution is Unique

AICTE SecureMeet is designed around institutional meeting requirements
instead of being a generic video-conferencing clone.

### Key differentiators

1.  **AICTE-specific workflow**
    -   Designed around official meeting roles and governance.
2.  **Admin-controlled meetings**
    -   Admin starts the meeting and controls its lifecycle.
3.  **Meeting ID + controlled access**
    -   Participants join a specific active meeting.
4.  **Security-first architecture**
    -   Security controls are planned across login, meeting,
        communication, and records.
5.  **Cross-device accessibility**
    -   The same application works on smartphones and laptops.
6.  **Real-time interaction**
    -   Audio, video, participant visibility, and chat operate during
        the live meeting.

------------------------------------------------------------------------

## 9. Feasibility

### Technical Feasibility

The prototype uses established web technologies:

-   Node.js
-   Express
-   Socket.IO
-   WebRTC
-   HTTPS
-   Modern browser APIs

These technologies can be developed incrementally and can later be
migrated to AICTE-controlled infrastructure.

### Operational Feasibility

The system maps naturally to institutional roles:

``` text
Admin
  ↓
Create Meeting
  ↓
Share Meeting ID
  ↓
Monitor Participants
  ↓
Control Meeting
```

### Scalability

The prototype demonstrates the core workflow. A production version can
scale through:

-   Dedicated signaling infrastructure
-   TURN servers
-   Redis
-   PostgreSQL
-   Containerized services
-   Kubernetes
-   Separate media/recording infrastructure

------------------------------------------------------------------------

## 10. Risks and Mitigation

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Unauthorized access                 SSO + MFA + RBAC

  Credential theft                    Strong authentication + session
                                      security

  Data leakage                        Encryption + controlled storage

  Poor network                        TURN relay infrastructure

  High user load                      Horizontal scaling

  Recording exposure                  Encrypted object storage + access
                                      policies

  User adoption                       Simple responsive interface +
                                      training

  Browser permission issues           Clear permission prompts and user
                                      guidance
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 11. Impact and Benefits

### AICTE Officials

-   Safer official meetings
-   Better participant visibility
-   Centralized meeting control
-   Improved accountability

### Institutions

-   Controlled meeting participation
-   Consistent meeting workflow
-   Easier collaboration with AICTE

### Participants

-   Simple joining process
-   Secure audio/video interaction
-   Mobile and laptop accessibility

### Governance

-   Better access control
-   Improved auditability
-   Stronger institutional ownership of meeting infrastructure

------------------------------------------------------------------------

## 12. Demo Scenario

### Admin

1.  Open the application.
2.  Select **Admin**.
3.  Login.
4.  Start a meeting.
5.  Copy the Meeting ID/link.
6.  Share it with participants.
7.  Monitor participants.
8.  Communicate through audio/video/chat.
9.  End the meeting.

### Participant

1.  Open the same application URL.
2.  Select **Participant**.
3.  Enter name and email.
4.  View the active meeting.
5.  Enter the Meeting ID or use the meeting link.
6.  Allow camera and microphone permissions.
7.  Join the meeting.
8.  Interact through video, audio, and chat.
9.  Leave when finished.

------------------------------------------------------------------------

## 13. Project Structure

``` text
aicte-securemeet-meet/
│
├── public/
│   └── index.html
│
├── server.js
├── package.json
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## 14. Local Development

### Requirements

-   Node.js
-   npm
-   Modern web browser

### Install

``` bash
git clone https://github.com/kingofmasterniraj-lab/aicte-securemeet-meet.git
cd aicte-securemeet-meet
npm install
```

### Run

``` bash
npm start
```

Open:

``` text
http://localhost:3000
```

For microphone/camera access, use HTTPS in deployed environments or an
appropriate secure local-development setup.

------------------------------------------------------------------------

## 15. Deployment

The current prototype is deployed using Render.

### Render configuration

``` text
Root Directory:   empty
Build Command:    npm install
Start Command:    npm start
Environment:      no required variables for the current prototype
```

Live application:

https://aicte-securemeet-meet-1.onrender.com/

------------------------------------------------------------------------

## 16. Research and References

The proposed security architecture is aligned conceptually with
established security and web standards.

-   NIST Digital Identity Guidelines --- SP 800-63 series
-   OWASP Application Security Verification Standard (ASVS)
-   W3C WebRTC
-   W3C Web Authentication / WebAuthn
-   IETF TLS 1.3 --- RFC 8446
-   IETF JWT Best Current Practices --- RFC 8725

Research areas:

-   Secure online meeting threats
-   Identity assurance
-   Access control
-   Privacy
-   Auditability
-   Real-time communication security

------------------------------------------------------------------------

## 17. Current Prototype vs Production Roadmap

### Implemented in the prototype

-   Admin/Participant workflows
-   Public deployment
-   Meeting creation
-   Meeting ID
-   Live meeting joining
-   WebRTC audio/video
-   Microphone control
-   Camera control
-   Participant visibility
-   Real-time chat
-   Screen sharing where supported
-   Responsive mobile/laptop interface

### Planned for production

-   AICTE SSO
-   MFA/WebAuthn
-   PostgreSQL
-   Redis
-   RBAC policy engine
-   TURN servers
-   Secure recording service
-   Encrypted object storage
-   Audit dashboard
-   Watermarking
-   Automatic meeting expiry
-   Security monitoring
-   Penetration testing
-   AICTE infrastructure deployment

------------------------------------------------------------------------

## 18. Important Prototype Disclaimer

This repository is a **working prototype/demo** created to demonstrate
the proposed AICTE SecureMeet concept.

It should not be treated as production-ready infrastructure for
confidential government meetings until enterprise authentication,
database persistence, TURN infrastructure, secure recording, auditing,
monitoring, formal security review, and AICTE deployment requirements
have been implemented and tested.

------------------------------------------------------------------------

## 19. Conclusion

AICTE SecureMeet demonstrates how a personalized institutional meeting
platform can combine:

**Secure Access + Admin Control + WebRTC Communication + Real-Time
Collaboration + Security-by-Design**

The prototype establishes the core technical foundation while providing
a clear roadmap toward a production-grade AICTE-controlled meeting
platform.

### Secure meetings. Institutional control. Trusted collaboration.

------------------------------------------------------------------------

## 20. Team

**Team Name:** Segmentation Error

**Project:** AICTE SecureMeet

**Problem Statement ID:** 1464

**Theme:** Blockchain & Cybersecurity

**Category:** Software
