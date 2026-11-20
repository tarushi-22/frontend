import "./app.css";
import Leaderboard from "./Leaderboard";
import { useState, useEffect } from "react";

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [nameError, setNameError] = useState("");
  const [foundCharacters, setFoundCharacters] = useState<number[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [characterSelected, setCharacterSelected] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);

  // Fetch characters when the component loads
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/characters`)
      .then((response) => {
        console.log("RESPONSE RECEIVED:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("CHARACTERS RECEIVED:", data);
        setCharacters(data);
      })
      .catch((error) => {
        console.error("FETCH ERROR:", error);
      });
  }, []);

  // Timer
  useEffect(() => {
    if (!timerActive || isPaused || startTime === null) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTime(elapsed);
    }, 250);

    return () => clearInterval(interval);
  }, [timerActive, isPaused, startTime]);

  // Start or restart game
  async function startGame() {
       if (!playerName.trim()) {
    setNameError("Please enter your name before starting!");
    return;
  }

  setNameError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/start`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start game");
      }

      const data = await response.json();

      console.log("GAME START RESPONSE:", data);

      // Reset game state
      setGameComplete(false);
      setGameId(data.gameId);
      setFoundCharacters([]);
      setSelectedCharacterId(null);
      setCharacterSelected(false);
      setTime(0);
      setElapsedBeforePause(0);
      setIsPaused(false);
      setShowLeaderboard(false);
      setStartTime(Date.now());
      setTimerActive(true);
      setGameStarted(true);
    } catch (error) {
      console.error("GAME START ERROR:", error);
    }
  }

  // Pause
  function pauseGame() {
    setIsPaused(true);
    setElapsedBeforePause(time);
    setTimerActive(false);
  }

  // Resume
  function resumeGame() {
    setStartTime(Date.now() - elapsedBeforePause * 1000);
    setIsPaused(false);
    setTimerActive(true);
  }

  // Handle clicks on the game image
  function handleImageClick(event: React.MouseEvent<HTMLImageElement>) {
    if (isPaused || gameComplete) return;

    if (selectedCharacterId === null) {
      console.log("NO CHARACTER SELECTED");
      return;
    }

    setCharacterSelected(true);

    const image = event.currentTarget;
    const rect = image.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const scaleX = image.naturalWidth / rect.width;
    const scaleY = image.naturalHeight / rect.height;

    const imageX = x * scaleX;
    const imageY = y * scaleY;

    console.log("SENDING TO BACKEND:", {
      gameId,
      characterId: selectedCharacterId,
      x: imageX,
      y: imageY,
    });

    fetch(`${import.meta.env.VITE_API_URL}/api/game/check`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    gameId,
    characterId: selectedCharacterId,
    x: imageX,
    y: imageY,
  }),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Check result:", data);

    if (data.found && !data.foundAlready) {
      setFoundCharacters((prev) => [...prev, selectedCharacterId]);
      setSelectedCharacterId(null);
    }

    if (data.gameComplete) {
      setGameComplete(true);
      setTimerActive(false);
      setIsPaused(false);
      setTime(data.duration);
    }
  })
  .catch((error) => {
    console.error("Error checking character:", error);
  });
  }
  return (
    <div className="page">
      {gameComplete ? (
        // GAME COMPLETION SCREEN
        <div className="completion-screen">
          <h1>🎉 Congratulations!</h1>
          <h2>You found everyone!</h2>

          <div className="final-time">
            <p>Your completion time</p>
            <h1>
              {Math.floor(time / 60)
                .toString()
                .padStart(2, "0")}
              :
              {(time % 60).toString().padStart(2, "0")}
            </h1>
          </div>

          <p>All {characters.length} characters found!</p>

          <button onClick={startGame}>Play Again</button>

          <button onClick={() => setShowLeaderboard(true)}>
            🏆 View Leaderboard
          </button>

          {showLeaderboard && <Leaderboard />}
        </div>
      ) : (
        // MAIN GAME SCREEN
        <>
          <header>
            <h1>Where's Waldo?</h1>
          </header>

          <main>
            <div className="game-layout">
              <div id="game-container">
                {gameStarted && gameId !== null && (
                  <img
                    id="game-image"
                    src="/game-image.png"
                    alt="Where's Waldo puzzle"
                    onClick={handleImageClick}
                  />
                )}
              </div>

              <aside className="game-sidebar">
                <div className="timer">
                  {Math.floor(time / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {(time % 60).toString().padStart(2, "0")}
                </div>

              <button 
  className="secondary-button leaderboard-button"
  onClick={() => setShowLeaderboard(!showLeaderboard)}
>

  {showLeaderboard ? "Close Leaderboard" : "🏆 Leaderboard"}
</button>
{showLeaderboard && <Leaderboard />}
<input
  className="player-name-input"
  type="text"
  placeholder="Enter your name"
  value={playerName}
  onChange={(e) => {
    setPlayerName(e.target.value);
    setNameError("");
  }}
  maxLength={20}
  disabled={gameStarted && !gameComplete}
/>
{nameError && (
  <p className="error-message">{nameError}</p>
)}

                <button id="start-button" onClick={startGame}>
                  {gameStarted ? "Restart Game" : "Start Game"}
                </button>

                {gameStarted && !gameComplete && (
                  <button
  className="secondary-button pause-button"
  onClick={isPaused ? resumeGame : pauseGame}
>
  {isPaused ? "▶ Resume Game" : "⏸ Pause Game"}
</button>
                )}

                <div className="find-section">
                  <h3>Find these characters</h3>

                  <div id="characters">
                    {characters.map((character) => (
                      <div
                        key={character.id}
                        className={`character-card ${
                          foundCharacters.includes(character.id)
                            ? "found"
                            : selectedCharacterId === character.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          if (
                            !foundCharacters.includes(character.id) &&
                            !isPaused
                          ) {
                            setSelectedCharacterId(character.id);
                          }
                        }}
                      >
                        <img
                          src={character.image}
                          alt={character.name}
                          className="character-avatar"
                        />

                        <span>{character.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;