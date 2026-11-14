# Skribble

A multiplayer draw-and-guess game inspired by [skribbl.io](https://skribbl.io/). Create a private room, invite friends with a link, add custom words, and draw with pen, fill, eraser, undo, and more.

## Play

Open the GitHub Pages site, pick a name, and **Create Private Room**. Share the invite link or room code. When at least two players are in, the host hits **Start**.

### Features

- Private rooms with invite links / codes
- Custom word lists (optional custom-only mode)
- Room settings: rounds, draw time, word choices, hints
- Drawing tools: colors, pen size, fill bucket, eraser, undo, clear
- Live guessing chat with close-guess hints
- Scoring + podium results

### How it works

Realtime multiplayer uses [PeerJS](https://peerjs.com/) (WebRTC). The room host is the game authority; no custom server is required, so it runs on GitHub Pages.

## Local development

Serve the folder over HTTP (PeerJS needs a non-`file://` origin):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy

This repo is set up for GitHub Pages from the `main` branch root.
