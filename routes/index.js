
async function fetchData() {
  const apiUrl = "https://the-office.fly.dev/season/{season}/format/{format}";
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

function populateTable(quotes) {
  const tableBody = document.getElementById("quoteTableBody");
  tableBody.innerHTML = "";

  quotes.forEach((quote) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${quote.character.firstname} ${quote.character.lastname}</td>
      <td>${quote.content}</td>
      <td>${quote.episode.season}x${quote.episode.episode}</td>
    `;
    tableBody.appendChild(row);
  });
}

function filterQuotes(quotes, character) {
  return quotes.filter((quote) =>
    `${quote.character.firstname} ${quote.character.lastname}`.toLowerCase().includes(character.toLowerCase())
  );
}

function sortQuotes(quotes, sortBy, ascending = true) {
  return quotes.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "character") {
      comparison = `${a.character.firstname} ${a.character.lastname}`.localeCompare(`${b.character.firstname} ${b.character.lastname}`);
    } else if (sortBy === "episode") {
        comparison = (a.episode.season * 100 + a.episode.episode) - (b.episode.season * 100 + b.episode.episode);
    } else if (sortBy === "length"){
        comparison = a.content.length - b.content.length;
    }

    return ascending ? comparison : -comparison;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  let quotes = await fetchData();
  populateTable(quotes);

  document.getElementById("filterInput").addEventListener("input", (e) => {
    const filteredQuotes = filterQuotes(quotes, e.target.value);
    populateTable(filteredQuotes);
  });

  document.getElementById("sortCharacter").addEventListener("click", () => {
    quotes = sortQuotes(quotes, "character");
    populateTable(quotes);
  });

  document.getElementById("sortEpisode").addEventListener("click", () => {
    quotes = sortQuotes(quotes, "episode");
    populateTable(quotes);
  });

    document.getElementById("sortLength").addEventListener("click", () => {
    quotes = sortQuotes(quotes, "length");
    populateTable(quotes);
  });
});