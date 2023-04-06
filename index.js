// Import required modules
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { spawn } = require("child_process");

// Create the express app and HTTP server
const app = express();
const server = http.createServer(app);

// Serve the static HTML file
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

// Create a WebSocket server
const io = socketio(server);

// Listen for incoming WebSocket connections
// io.on("connection", (socket) => {
//   console.log("Client connected");

//   // Listen for incoming commands from the client
//   socket.on("command", (cmd) => {
//     console.log("Received command:", cmd);

//     // Execute the command in a new process
//     const child = spawn(cmd, {
//       shell: true,
//       cwd: process.cwd(),
//       env: process.env,
//     });

//     // Capture the output of the command
//     child.stdout.on("data", (data) => {
//       console.log("Command output:", data.toString());
//       // Send the output back to the client
//       socket.emit("output", data.toString());
//     });

//     // Capture any errors from the command
//     child.stderr.on("data", (data) => {
//       console.error("Command error:", data.toString());
//       // Send the error message back to the client
//       socket.emit("output", data.toString());
//     });

//     // terminal cmd has finished outputing
//     child.on("exit", (code) => {
//       console.log("Command exited with code:", code);
//       // Notify the client that the command has finished executing
//       socket.emit("command-finished");
//     });

//     // Handle Ctrl+C event from frontend
//     socket.on("ctrl+c", () => {
//       child.kill("SIGINT");
//       child.stdin.end();
//       child.stdout.end();
//       child.stderr.end();
//     });
//   });

//   // Listen for disconnection events
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });

io.on("connection", (socket) => {
  let child = null;

  socket.on("command", (command) => {
    if (child) {
      child.kill();
      child.stdin.end();
      child.stdout.end();
      child.stderr.end();
      child = null;
    }

    const [cmd, ...args] = command.split(" ");
    child = spawn(cmd, args, { detached: true });

    // Send output of child process to frontend
    child.stdout.on("data", (data) => {
      console.log(data.toString());
      socket.emit("output", data.toString());
    });

    // Send error output of child process to frontend
    child.stderr.on("data", (data) => {
      console.log(data.toString());
      socket.emit("output", data.toString());
    });

    // Handle termination of child process
    child.on("exit", (code, signal) => {
      // socket.emit('output', `Child process exited with code ${code} and signal ${signal}`);
      socket.emit("command-finished");
    });
  });

  // Handle Ctrl+C event from frontend
  socket.on("ctrl+c", () => {
    if (child) {
      child.kill("SIGINT");
    }
  });

  // Clean up child process on disconnect
  socket.on("disconnect", () => {
    // if (child) {
    //   child.kill();
    //   child.stdin.end();
    //   child.stdout.end();
    //   child.stderr.end();
    //   child = null;
    // }
  });

  process.on("SIGINT", function () {
    console.log("Received SIGINT signal");
    // Perform any cleanup or shutdown operations here
    if (child) {
      child.kill();
      child.stdin.end();
      child.stdout.end();
      child.stderr.end();
      child = null;
    }
    process.exit(0);
  });
});

// Start the server
const port = process.env.PORT || 3080;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
