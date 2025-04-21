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
      <td><img src="/images/${getImageFile(quote.character)}" height="72"/></td>
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
                document.getElementById('quoteChart').style.display = 'none';
            } else {
                filtered = [...quotes].sort(() => Math.random() - 0.5);
                document.getElementById('quoteChart').style.display = 'block';
                renderQuoteChart(filtered);
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

function renderQuoteChart(quotesList) {
    const counts = {};
    quotesList.forEach(q => {
        counts[q.character] = (counts[q.character] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const ctx = document.getElementById('quoteChart').getContext('2d');

    if (window.quoteChartInstance) {
        window.quoteChartInstance.destroy();
    }

    window.quoteChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#916b5e', '#bab78c', '#ecdfcd', '#be8c6b', '#c2a88f',
                    '#686961', '#604a33', '#8e6c49', '#879281', '#a4927a'
                ],
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

document.getElementById('toggleChart').addEventListener('click', () => {
    const chartCanvas = document.getElementById('quoteChart');
    const isVisible = chartCanvas.style.display === 'block';

    if (isVisible) {
        chartCanvas.style.display = 'none';
        document.getElementById('toggleChart').textContent = 'View Chart';
    } else {
        chartCanvas.style.display = 'block';
        document.getElementById('toggleChart').textContent = 'Hide Chart';
        renderQuoteChart(quotes);
    }
});

loadQuotes();