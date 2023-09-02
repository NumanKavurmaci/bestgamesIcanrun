const cpuDevices = require("./cpu.json");
const gpuDevices = require("./gpu.json");

// Function to find a similar CPU by name
async function findSimilarCPU(targetName) {
  let normalizedTarget = targetName.toLowerCase().replace(/\s+/g, " ");
  // reduce statements like: @ 3.2GHz (4 CPUs)
  normalizedTarget = normalizedTarget.replace(/\s*\(.*\)\s*/g, "");
  normalizedTarget = normalizedTarget.split("@")[0].trim();

  console.log("normalizedTarget", normalizedTarget);
  // search for target in cpuDevices
  const cpu = cpuDevices.find((cpu) => {
    const normalizedCPUName = cpu.toLowerCase().replace(/\s+/g, " ");
    return normalizedCPUName.includes(normalizedTarget);
  });

  return cpu; // Return the found CPU
}

// Function to find a similar GPU by name
async function findSimilarGPU(targetName) {
  const normalizedTarget = targetName
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace("nvidia", "")
    .replace("amd", "")
    .replace(/\s*\d+GB/i, ""); // Remove numeric value followed by "GB" case insensitive
  console.log("normalizedTarget", normalizedTarget);

  return gpuDevices.find((gpu) => {
    const normalizedGPUName = gpu.toLowerCase().replace(/\s+/g, " ");
    return normalizedGPUName.includes(normalizedTarget);
  });
}
findSimilarGPU("Nvidia GeForce GTX 760").then((gpu) => {
  console.log("gpu", gpu);
});

findSimilarCPU("Dual Core 2.0").then((cpu) => {
  console.log("cpu", cpu);
});
