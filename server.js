const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

const {
  fetchCPUData,
  fetchGPUData,
  calculateCPUPoints,
  calculateGPUPoints,
} = require("./converthwtopoints.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/data", express.static("data"));

const db = new sqlite3.Database(
  "database.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Database connection error:", err.message);
    } else {
      console.log("Connected to the database");
    }
  }
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/submit-specs", async (req, res) => {
  console.log("req.body", req.body);
  const { cpu, gpu, ram } = req.body;
  // find cpu points asynchronously
  cpuData = await fetchCPUData();
  gpuData = await fetchGPUData();
  if (!cpuData) {
    res.status(500).json({ error: "Failed to fetch CPU data" });
    return;
  }
  if (!gpuData) {
    res.status(500).json({ error: "Failed to fetch GPU data" });
    return;
  }
  // Find CPU benchmark score for the provided CPU model
  const cpuScore = calculateCPUPoints(cpuData, cpu);
  // Find GPU benchmark score for the provided GPU model
  const gpuScore = calculateGPUPoints(gpuData, gpu);
  console.log("cpuScore:", cpuScore);
  console.log("gpuScore:", gpuScore);
  console.log("ram:", ram);
  // find relevant games game_id's in recopoints
  const query = `
    SELECT game_id FROM recopoints
    WHERE cpu_points <= ?
    AND ram_points <= ?
    AND gpu_points <= ?
    `;
  db.all(query, [cpuScore, ram, gpuScore], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      const gameIds = rows.map((row) => row.game_id);
      console.log("gameIds", gameIds);
      // find games with the game_id's
      const newQuery = `
            SELECT * FROM games
            WHERE id IN (${gameIds.map((id) => "?").join(", ")})
            `;
      db.all(newQuery, gameIds, (err, games) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal Server Error" });
        } else {
          res.json(games);
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
