// this script will convert all items in gamerecommendeds
// then get their hardware info
// then convert it to scores
// and save them in recopoints table

const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("database.db");

const geekbenchURL = "https://browser.geekbench.com/processor-benchmarks.json";
const geekbenchGPUURL = "https://browser.geekbench.com/gpu-benchmarks.json";

const fs = require("fs"); // file system module

// Function to find a similar CPU by name
function findSimilarCPU(cpuDevices, targetName) {
  let normalizedTarget = targetName.toLowerCase().replace(/\s+/g, " ");
  // reduce statements like: @ 3.2GHz (4 CPUs)
  normalizedTarget = normalizedTarget.replace(/\s*\(.*\)\s*/g, "");
  normalizedTarget = normalizedTarget.split("@")[0].trim();
  return cpuDevices.find((cpu) => {
    const normalizedCPUName = cpu.name.toLowerCase().replace(/\s+/g, " ");
    return normalizedCPUName.includes(normalizedTarget);
  });
}

// Function to find a similar GPU by name
function findSimilarGPU(gpuDevices, targetName) {
  const normalizedTarget = targetName
    .toLowerCase()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace("nvidia", "") // Remove "nvidia" from the name
    .replace("amd", "") // Remove "amd" from the name
    .replace(/\s*\d+gb/i, "") // Remove numeric value followed by "GB" case insensitive
    .trim(); // Strip leading and trailing spaces
  console.log("search name:", normalizedTarget);
  return gpuDevices.find((gpu) => {
    const normalizedGPUName = gpu.name.toLowerCase().replace(/\s+/g, " ");
    //console.log("gpu name:", normalizedGPUName);
    return normalizedGPUName.includes(normalizedTarget);
  });
}
// function to fetch GPU benchmark data from Geekbench
async function fetchGPUData() {
  try {
    const response = await fetch(geekbenchGPUURL);
    if (!response.ok) {
      throw new Error("Failed to fetch GPU data");
    }
    const gpuData = await response.json();
    console.log("returning gpuData");
    return gpuData;
  } catch (error) {
    console.error("Error fetching GPU data:", error);
    return null;
  }
}

// Function to fetch CPU benchmark data from Geekbench
async function fetchCPUData() {
  try {
    const response = await fetch(geekbenchURL);
    if (!response.ok) {
      throw new Error("Failed to fetch CPU data");
    }
    const cpuData = await response.json();
    console.log("returning cpuData");
    return cpuData;
  } catch (error) {
    console.error("Error fetching CPU data:", error);
    return null;
  }
}

// function to compare GPU and calculate points
function calculateGPUPoints(gpuData, gpuName) {
  console.log("calcualeGPUPoints");
  console.log("gpuName", gpuName);
  const gpu = findSimilarGPU(gpuData.devices, gpuName);

  if (!gpu) {
    console.error("GPU not found in data");
    return 0;
  }
  //console.log(
  //  "found this gpu",
  //  gpu,
  //  "with this name",
  //  gpuName,
  //  "with score of",
  //  gpu.opencl
  //);

  return Math.floor(gpu.opencl);
}

// Function to compare CPU and calculate points
function calculateCPUPoints(cpuData, cpuName) {
  //console.log("cpuName", cpuName);
  const cpu = findSimilarCPU(cpuData.devices, cpuName);

  if (!cpu) {
    console.error("CPU not found in data");
    return 0;
  }
  //console.log(
  //  "found this cpu",
  //  cpu,
  //  "with this name",
  //  cpuName,
  //  "with score of",
  //  cpu.score
  //);

  return Math.floor(cpu.score);
}

async function populatePoints() {
  const CPUData = await fetchCPUData();
  const GPUData = await fetchGPUData();
  if (!CPUData) {
    console.error("Error fetching CPU data");
    return;
  } else if (!GPUData) {
    console.error("Error fetching GPU data");
    return;
  } else {
    db.all("SELECT * FROM gamerecommendeds", async (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      for (const row of rows) {
        const game_id = row.game_id;
        const cpu_name = row.cpu;
        let gpu_name = row.gpu;
        const ram = row.ram;
        let cpu_points, gpu_points, ram_points;

        if (cpu_name == null) {
          cpu_points = 0;
        } else {
          cpu_points = calculateCPUPoints(CPUData, cpu_name);
        }
        if (gpu_name == null) {
          gpu_points = 0;
        } else {
          gpu_name = gpu_name.replace(/^Nvidia\s*/i, "");
          gpu_name = gpu_name.replace(/^AMD\s*/i, "");
          gpu_name = gpu_name.replace(/,.*/i, "");

          gpu_points = calculateGPUPoints(GPUData, gpu_name);
        }
        if (ram == null) {
          ram_points = 0;
        } else {
          ram_points = Math.floor(ram);
        }
        //console.log("game_id", game_id);
        //console.log("cpu_points", cpu_points);
        //console.log("gpu_points", gpu_points);
        //console.log("ram_points", ram_points);

        const insertQuery =
          "INSERT INTO recopoints (game_id, cpu_points, gpu_points, ram_points) VALUES (?, ?, ?, ?)";
        db.run(
          insertQuery,
          [game_id, cpu_points, gpu_points, ram_points],
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    });
  }
}

// store all items from cpu and gpu tables
async function downloadData(cpufileName, gpufileName) {
  const cpuData = await fetchCPUData();
  const gpuData = await fetchGPUData();

  const cpuDevices = cpuData.devices.map((device) => device.name);
  const gpuDevices = gpuData.devices.map(
    (device) => `${device.icon} ${device.name}`
  );
  if (!cpuData) {
    console.error("Error fetching CPU data");
    return;
  }
  if (!gpuData) {
    console.error("Error fetching GPU data");
    return;
  }
  fs.writeFileSync(cpufileName, JSON.stringify(cpuDevices), "utf8");
  fs.writeFileSync(gpufileName, JSON.stringify(gpuDevices), "utf8");
}
//downloadData("cpu.json", "gpu.json");
// Export the functions

// Call the populatePoints function
populatePoints();

module.exports = {
  findSimilarCPU,
  findSimilarGPU,
  fetchCPUData,
  fetchGPUData,
  calculateCPUPoints,
  calculateGPUPoints,
};
