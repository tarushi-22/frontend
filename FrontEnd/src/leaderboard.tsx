interface Player {
  _id: string;
  playerName: string;
  duration: number;
  incorrectClicks: number;
}

import { useState, useEffect } from "react";

function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);

useEffect(() => {
  fetch("http://localhost:3000/api/leaderboard")
    .then((response) => response.json())
    .then((data) => {
      setPlayers(data);
    })
    .catch((error) => {
      console.error("Error fetching leaderboard:", error);
    });
}, []);


  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <p>Fastest players</p>

    <div className="leaderboard-list">
  {players.length === 0 ? (
    <p>No completed games yet. Be the first!</p>
  ) : (
    players.slice(0, 3).map((player, index) => (
      <div className="leaderboard-row" key={player._id}>
        <span className="rank">
          {index === 0 ? "🥇" :
           index === 1 ? "🥈" :
           index === 2 ? "🥉" :
           `#${index + 1}`}
        </span>

        <span className="player-name">
          {player.playerName}
        </span>

        <span className="player-time">
          {player.duration}s
        </span>
      </div>
    ))
  )}
</div>

    </div>
  );
}

export default Leaderboard;