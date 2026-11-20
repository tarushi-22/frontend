
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(cors());

const characters = require("./characters");
const targets = require("./targets");

// In-memory storage (no MongoDB)
const games = new Map();
const leaderboard = [];

// -------------------- CHARACTERS --------------------
app.get("/api/characters", (req, res) => {
  res.json(characters);
});

// -------------------- START GAME --------------------
app.post("/api/game/start", (req, res) => {
  try {
    const { playerName } = req.body;

    const gameId = crypto.randomBytes(12).toString("hex");

    const newGame = {
      gameId,
      playerName: playerName || "Guest",
      startedAt: new Date(),
      foundCharacters: [],
      incorrectClicks: 0,
      completed: false,
    };

    games.set(gameId, newGame);

    res.status(201).json({
      gameId,
      message: "Game started successfully",
    });
  } catch (error) {
    console.error("Error starting game:", error);

    res.status(500).json({
      message: "Could not start game",
    });
  }
});

// -------------------- TARGETS --------------------
app.get("/api/targets", (req, res) => {
  res.json(targets);
});

// -------------------- CHECK CHARACTER --------------------
app.post("/api/game/check", (req, res) => {
  try {
    const { gameId, characterId, x, y } = req.body;

    console.log("Received:", { gameId, characterId, x, y });

    if (!gameId || !games.has(gameId)) {
      return res.status(404).json({
        error: "Game not found",
      });
    }

    const numericCharacterId = Number(characterId);

    if (
      !Number.isInteger(numericCharacterId) ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {
      return res.status(400).json({
        error: "Invalid character ID or coordinates",
      });
    }

    const game = games.get(gameId);

    if (game.completed) {
      return res.status(409).json({
        error: "Game is already completed",
      });
    }

    const target = targets[numericCharacterId];

    if (!target) {
      return res.status(404).json({
        error: "Target not found",
      });
    }

    const isCorrect =
      x >= target.x1 &&
      x <= target.x2 &&
      y >= target.y1 &&
        y <= target.y2;

    // Incorrect click
    if (!isCorrect) {
      game.incorrectClicks += 1;

      return res.json({
        found: false,
        incorrectClicks: game.incorrectClicks,
      });
    }

    // Already found
    if (game.foundCharacters.includes(numericCharacterId)) {
      return res.json({
        found: true,
        foundAlready: true,
      });
    }

    // Save found character in memory
    game.foundCharacters.push(numericCharacterId);

    const gameComplete =
      game.foundCharacters.length === characters.length;

    let duration = null;

    // Game completed
    if (gameComplete) {
      game.completed = true;
      game.completedAt = new Date();

      duration = Math.floor(
        (game.completedAt.getTime() - game.startedAt.getTime()) / 1000
      );

      game.duration = duration;

      // Add to leaderboard
      leaderboard.push({
        playerName: game.playerName,
        duration: game.duration,
        incorrectClicks: game.incorrectClicks,
        completedAt: game.completedAt,
      });

      // Fastest games first
      leaderboard.sort((a, b) => a.duration - b.duration);

      // Keep only top 10
      leaderboard.splice(10);
    }

    return res.json({
      found: true,
      characterId: numericCharacterId,
      gameComplete,
      duration: game.duration,
    });
  } catch (error) {
    console.error("Error checking game:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// -------------------- LEADERBOARD --------------------
app.get("/api/leaderboard", (req, res) => {
  res.status(200).json(leaderboard);
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
