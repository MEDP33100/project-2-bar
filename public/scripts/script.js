const quoteTable = document.getElementById('quoteTableBody');
let quotes = [];

async function fetchQuoteById(id) {
    const res = await fetch(`https://officeapi.akashrajpurohit.com/quote/${id}`);
    if (!res.ok) throw new Error(`Quote ${id} not found`);
    return await res.json();
}

async function loadQuotes(start = 1, end = 300) {
    for (let id = start; id <= end; id++) {
        try {
            const quote = await fetchQuoteById(id);
            quotes.push(quote);
        } catch (err) {
            console.log(`Skipping ID ${id}:`, err.message);
        }
    }

    displayQuotes(quotes);
    setupButtonFilters();
}

function displayQuotes(quoteList) {
    quoteTable.innerHTML = '';
    quoteList.forEach(quote => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${quote.character}</td>
      <td>${quote.quote}</td>
      <td><img src="/images/${getImageFile(quote.character)}" height="60"/></td>
    `;
        quoteTable.appendChild(row);
    });
}

function setupButtonFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const character = button.getAttribute('data-character');
            let filtered;
            if (character) {
                filtered = quotes.filter(q => q.character === character);
            } else {
                // Randomize the full list for "Show All"
                filtered = [...quotes].sort(() => Math.random() - 0.5);
            }
            displayQuotes(filtered);
        });
    });
}

function getImageFile(character) {
    const map = {
        "Michael Scott": "michael.jpg",
        "Dwight Schrute": "dwight.jpg",
        "Jim Halpert": "jim.jpg",
        "Pam Beesly": "pam.jpg",
        "Angela Martin": "angela.jpg",
        "Stanley Hudson": "stanley.jpg",
        "Kelly Kapoor": "kelly.jpg",
        "Creed Bratton": "creed.jpg",
        "Kevin Malone": "kevin.jpg",
        "Andy Bernard": "andy.jpg"
    };
    return map[character] || "default.jpg";
}

loadQuotes();