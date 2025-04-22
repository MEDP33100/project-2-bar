const quoteTable = document.getElementById('quoteTableBody');

let quotes = [];
let sortState = { key: 'character', ascending: true };
let currentSearchTerm = '';
let currentFilterCharacter = null;
let quoteChartInstance = null;

async function fetchQuoteById(id) {
    if (!id || id < 1) {
        throw new Error(`Invalid quote ID: ${id}`);
    }
    try {
        const res = await fetch(`https://officeapi.akashrajpurohit.com/quote/${id}`);
        if (!res.ok) {
             console.warn(`Workspace for quote ${id} failed with status: ${res.status}`);
            throw new Error(`Quote ${id} fetch failed: ${res.statusText}`);
        }
         const contentType = res.headers.get("content-type");
         if (contentType && contentType.includes("application/json")) {
             return await res.json();
         } else {
             console.warn(`Quote ${id} did not return JSON. Content-Type: ${contentType}`);
             throw new Error(`Quote ${id} returned non-JSON response.`);
         }
    } catch (error) {
         console.error(`Error fetching quote ${id}:`, error);
         throw error;
    }
}

async function loadQuotes(start = 1, end = 300) {
    quotes = [];
    console.log("Loading quotes...");
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.style.display = 'block';

    for (let id = start; id <= end; id++) {
        try {
            const quote = await fetchQuoteById(id);
             if (quote && quote.character && quote.quote) {
                 quotes.push(quote);
             } else {
                 console.warn(`Skipping quote ID ${id}: Invalid data received.`, quote);
             }
        } catch (err) {
            console.log(`Skipping ID ${id}: ${err.message}`);
        }
    }
    console.log(`Loaded ${quotes.length} quotes successfully.`);
    if (indicator) indicator.style.display = 'none';

    if (sortState.key) {
        console.log(`Applying initial sort by: ${sortState.key}, ascending: ${sortState.ascending}`);
        quotes.sort((a, b) => {
            const valA = a[sortState.key] ? String(a[sortState.key]).toLowerCase() : '';
            const valB = b[sortState.key] ? String(b[sortState.key]).toLowerCase() : '';
            if (valA < valB) return sortState.ascending ? -1 : 1;
            if (valA > valB) return sortState.ascending ? 1 : -1;
            return 0;
        });
    }

    displayQuotes();

    setupButtonFilters();
    setupTableSorting();
    setupSearchFilter();
    setupChartToggle();
}

function applyFiltersAndSort() {
    let filtered = [...quotes];

    if (currentFilterCharacter) {
        filtered = filtered.filter(q => q.character === currentFilterCharacter);
    }

    if (currentSearchTerm) {
        const searchTermLower = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(q =>
            (q.character && q.character.toLowerCase().includes(searchTermLower)) ||
            (q.quote && q.quote.toLowerCase().includes(searchTermLower))
        );
    }

    if (sortState.key) {
        filtered.sort((a, b) => {
            const valA = a[sortState.key] ? String(a[sortState.key]).toLowerCase() : '';
            const valB = b[sortState.key] ? String(b[sortState.key]).toLowerCase() : '';
            if (valA < valB) return sortState.ascending ? -1 : 1;
            if (valA > valB) return sortState.ascending ? 1 : -1;
            return 0;
        });
    }

    return filtered;
}

function displayQuotes() {
    if (!quoteTable) {
         console.error("Table body element not found!");
         return;
     }

    const filteredAndSortedQuotes = applyFiltersAndSort();
    quoteTable.innerHTML = '';

    if (filteredAndSortedQuotes.length === 0) {
         quoteTable.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 10px;">No quotes match the current filter/search.</td></tr>`;
     } else {
        filteredAndSortedQuotes.forEach(quote => {
            if (!quote || typeof quote.character === 'undefined' || typeof quote.quote === 'undefined') {
                console.warn("Skipping rendering invalid quote object:", quote);
                return;
            }

            const row = document.createElement('tr');
             const characterName = quote.character || 'Unknown Character';
             const imageName = characterName !== 'Unknown Character' ? getImageFile(characterName) : "default.jpg";
             const altText = characterName;

            row.innerHTML = `
                <td>${characterName}</td>
                <td>${quote.quote || 'No quote text'}</td>
                <td><img src="/images/${imageName}" alt="${altText}" height="72" loading="lazy"/></td>
                `;

             row.addEventListener('click', () => {
                 console.log('Clicked Quote:', quote);
             });

            quoteTable.appendChild(row);
        });
    }
    updateSortIndicators();
}

function setupButtonFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.currentTarget.classList.add('active');

            currentFilterCharacter = event.currentTarget.getAttribute('data-character');

            const chartCanvas = document.getElementById('quoteChart');
            const toggleButton = document.getElementById('toggleChart');
            if (chartCanvas && toggleButton) {
                 if (!currentFilterCharacter) {
                     console.log("--- 'All' Filter Button Clicked ---");
                     chartCanvas.style.display = 'block';
                     toggleButton.textContent = 'Hide Chart';
                     if (!quoteChartInstance) {
                         console.log("Attempting to render chart via 'All' button...");
                         renderQuoteChart(quotes);
                     }
                 } else {
                     chartCanvas.style.display = 'none';
                     toggleButton.textContent = 'View Chart';
                 }
            }
            displayQuotes();
        });
    });
}

function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.warn("Search input element not found.");
        return;
    }
    searchInput.addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        displayQuotes();
    });
}

function setupTableSorting() {
    document.querySelectorAll('#quoteTable thead th.sortable').forEach(th => {
        th.addEventListener('click', (event) => {
            const sortKey = event.currentTarget.getAttribute('data-sort-key');
            if (!sortKey) return;

            if (sortState.key === sortKey) {
                sortState.ascending = !sortState.ascending;
            } else {
                sortState.key = sortKey;
                sortState.ascending = true;
            }
            displayQuotes();
        });
    });
}

function updateSortIndicators() {
    document.querySelectorAll('#quoteTable thead th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    if (sortState.key) {
        const activeHeader = document.querySelector(`#quoteTable thead th[data-sort-key="${sortState.key}"]`);
        if (activeHeader) {
            activeHeader.classList.add(sortState.ascending ? 'sort-asc' : 'sort-desc');
        }
    }
}

function getImageFile(character) {
    const safeCharacter = typeof character === 'string' ? character.trim() : "Unknown";
    const map = {
        "Michael Scott": "michael.jpg", "Dwight Schrute": "dwight.jpg", "Jim Halpert": "jim.jpg",
        "Pam Beesly": "pam.jpg", "Angela Martin": "angela.jpg", "Stanley Hudson": "stanley.jpg",
        "Kelly Kapoor": "kelly.jpg", "Creed Bratton": "creed.jpg", "Kevin Malone": "kevin.jpg",
        "Andy Bernard": "andy.jpg", "Oscar Martinez": "oscar.jpg", "Ryan Howard": "ryan.jpg",
        "Erin Hannon": "erin.jpg",
        "Default": "default.jpg",
        "Unknown": "default.jpg"
    };
    return map[safeCharacter] || map["Default"];
}

function renderQuoteChart(quotesList) {
    console.log("--- renderQuoteChart function called ---");
    const chartCanvas = document.getElementById('quoteChart');
     if (!chartCanvas) {
         console.error("Chart canvas element not found inside renderQuoteChart!");
         return;
     }
     console.log("Getting 2D context...");
     const ctx = chartCanvas.getContext('2d');
     if (!ctx) {
         console.error("Failed to get 2D context from canvas!");
         return;
     }
     console.log("Context obtained:", ctx);

    const counts = {};
    quotesList.forEach(q => {
        if (q && q.character) {
            counts[q.character] = (counts[q.character] || 0) + 1;
        }
    });

    console.log("Preparing chart data...");
    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (quoteChartInstance) {
        console.log("Destroying old chart instance...");
        quoteChartInstance.destroy();
    }

    const baseColors = [
        '#916b5e', '#bab78c', '#ecdfcd', '#be8c6b', '#c2a88f', '#686961', '#604a33',
        '#8e6c49', '#879281', '#a4927a', '#d3b8ae', '#a0a083', '#f0e6d6', '#c49c81', '#caa790'
    ];
    const backgroundColors = labels.map((_, index) => baseColors[index % baseColors.length]);

    console.log("Creating new Chart instance...");
    try {
        quoteChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quotes per Character',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Distribution of Quotes by Character'},
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) {
                                    const total = context.dataset.data.reduce((acc, value) => acc + value, 0);
                                    const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0.0%';
                                    label += `${context.parsed} quotes (${percentage})`;
                                }
                                return label;
                            }
                        }
                    }
                },
            }
        });
        console.log("--- Chart instance CREATED successfully ---", quoteChartInstance);
    } catch (chartError) {
        console.error("!!! ERROR CREATING CHART INSTANCE:", chartError);
    }
}

function setupChartToggle() {
    const toggleButton = document.getElementById('toggleChart');
    const chartCanvas = document.getElementById('quoteChart');

    if (!toggleButton || !chartCanvas) {
        console.warn("Chart toggle button or canvas not found.");
        return;
    }

    if (chartCanvas.style.display !== 'block') {
        toggleButton.textContent = 'View Chart';
    } else {
        toggleButton.textContent = 'Hide Chart';
         if (quotes.length > 0 && !quoteChartInstance) {
             renderQuoteChart(quotes);
         }
    }

    toggleButton.addEventListener('click', () => {
        console.log("--- Toggle Chart Button Clicked ---");
        const chartCanvas = document.getElementById('quoteChart'); 
        const isVisible = chartCanvas.style.display === 'block';
        if (isVisible) {
            chartCanvas.style.display = 'none';
            toggleButton.textContent = 'View Chart';
        } else {
            console.log("Attempting to show and render chart...");
            chartCanvas.style.display = 'block';
            toggleButton.textContent = 'Hide Chart';
            if (!quoteChartInstance || currentFilterCharacter) {
                 renderQuoteChart(quotes);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!quoteTable) {
         console.error("Cannot initialize: Table body element (#quoteTableBody) not found.");
         return;
    }
    loadQuotes();
});