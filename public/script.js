document.addEventListener("DOMContentLoaded", function () {
  const removeCookiesButton = document.getElementById("remove-cookies");

  removeCookiesButton.addEventListener("click", function () {
    // Remove your cookies here
    const storedSpecs = localStorage.getItem("userSpecs");
    if (storedSpecs) {
      localStorage.removeItem("userSpecs");
      window.location.reload();
    }

    alert("Cookies removed!");
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const specsForm = document.getElementById("specs-form");
  const gameList = document.getElementById("game-list");
  const gamesBody = document.getElementById("games-body");

  const storedSpecs = localStorage.getItem("userSpecs");
  console.log("storedSpecs", storedSpecs);
  if (storedSpecs) {
    // Hide the form and show the game list
    specsForm.style.display = "none";
    gameList.style.display = "block";

    const recommendedGames = await fetchRecommendedGames(
      JSON.parse(storedSpecs)
    );
    populateGamesTable(recommendedGames);
  } else {
    specsForm.style.display = "block";

    specsForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const cpu = document.getElementById("cpu").value;
      const gpu = document.getElementById("gpu").value;
      const ram = document.getElementById("ram").value;

      const response = await fetch("/submit-specs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpu, gpu, ram }),
      });

      if (response.ok) {
        const recommendedGames = await response.json();
        console.log("recommendedGames", recommendedGames);
        populateGamesTable(recommendedGames);
        specsForm.style.display = "none";
        gameList.style.display = "block";
        localStorage.setItem("userSpecs", JSON.stringify({ cpu, gpu, ram }));
      } else {
        console.log("response", response);
      }
    });
  }

  function populateGamesTable(games) {
    console.log("games", games);
    gamesBody.innerHTML = "";

    games.forEach((game) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${game.name}</td>
            <td>${game.genre}</td>
            <td>${game.release_date}</td>
            <td>${game.score}</td>
          `;
      console.log("row", row);
      gamesBody.appendChild(row);
    });
  }
});

async function fetchRecommendedGames(specs) {
  const response = await fetch("/submit-specs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(specs),
  });

  return response.json();
}

async function loadJSONData(fileName) {
  try {
    const response = await fetch(fileName);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error.message);
    return null;
  }
}

// Populate dropdown menu with options from JSON data
async function populateDropdown(elementId, fileName) {
  const data = await loadJSONData(fileName);
  if (!data) return;

  const dropdown = document.getElementById(elementId);
  data.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown.appendChild(optionElement);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Populate dropdowns and initialize Select2
  populateDropdown("cpu", "/data/cpu.json");
  populateDropdown("gpu", "/data/gpu.json");

  // Initialize Select2 for the CPU and GPU select dropdowns
  $("#cpu").select2({
    placeholder: "Select a CPU",
    allowClear: true, // Adds a clear button
    width: "100%",
  });

  $("#gpu").select2({
    placeholder: "Select a GPU",
    allowClear: true,
    width: "100%",
  });
});
