document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const etfInput = document.getElementById('etf-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsContainer = document.getElementById('results-container');
    
    // Create a lookup map for faster searches
    const etfMap = {};
    tslaETFData.forEach(etf => {
        etfMap[etf[0]] = {
            fullName: etf[1],
            percentage: etf[2]
        };
    });
    
    // Handle the analyze button click
    analyzeBtn.addEventListener('click', () => {
        analyzeETFs();
    });
    
    // Also trigger analysis on Enter key in the textarea
    etfInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            analyzeETFs();
        }
    });
    
    function analyzeETFs() {
        // Get user input and clean it
        const input = etfInput.value.trim();
        
        if (!input) {
            showEmptyMessage();
            return;
        }
        
        // Parse tickers (split by commas, spaces, tabs, or new lines)
        const tickers = input.toUpperCase().split(/[\s,]+/).filter(t => t);
        
        if (tickers.length === 0) {
            showEmptyMessage();
            return;
        }
        
        // Clear the results container
        resultsContainer.innerHTML = '';
        
        // Analyze each ticker
        const foundETFs = [];
        const notFoundETFs = [];
        
        tickers.forEach(ticker => {
            if (etfMap[ticker]) {
                foundETFs.push({
                    ticker,
                    fullName: etfMap[ticker].fullName,
                    percentage: etfMap[ticker].percentage
                });
            } else {
                notFoundETFs.push(ticker);
            }
        });
        
        // Sort found ETFs by percentage (highest first)
        foundETFs.sort((a, b) => {
            const pctA = parseFloat(a.percentage);
            const pctB = parseFloat(b.percentage);
            return pctB - pctA;
        });
        
        // Display results
        if (foundETFs.length > 0) {
            // Add found ETFs
            foundETFs.forEach(etf => {
                const card = document.createElement('div');
                card.className = 'etf-card';
                card.innerHTML = `
                    <div class="ticker-container">
                        <div class="ticker">${etf.ticker}</div>
                        <div class="full-name">${etf.fullName}</div>
                    </div>
                    <div class="percentage">${etf.percentage}%</div>
                `;
                resultsContainer.appendChild(card);
            });
        }
        
        // Add not found ETFs if any
        if (notFoundETFs.length > 0) {
            notFoundETFs.forEach(ticker => {
                const card = document.createElement('div');
                card.className = 'etf-card not-found';
                card.innerHTML = `
                    <div class="ticker-container">
                        <div class="ticker">${ticker}</div>
                        <div class="full-name">Not Found</div>
                    </div>
                    <div class="percentage">Not Found</div>
                `;
                resultsContainer.appendChild(card);
            });
        }
        
        // Add summary statistics
        const statsDiv = document.createElement('div');
        statsDiv.className = 'result-stats';
        
        const totalChecked = tickers.length;
        const foundCount = foundETFs.length;
        const percentFound = Math.round((foundCount / totalChecked) * 100);
        
        statsDiv.innerHTML = `
            <p><strong>${foundCount}</strong> out of <strong>${totalChecked}</strong> ETFs contain TSLA (${percentFound}%)</p>
            ${foundCount > 0 ? `<p>Average TSLA weight: <strong>${calculateAverageWeight(foundETFs)}%</strong></p>` : ''}
        `;
        
        resultsContainer.appendChild(statsDiv);
    }
    
    function calculateAverageWeight(etfs) {
        if (etfs.length === 0) return '0.00';
        
        const sum = etfs.reduce((total, etf) => {
            return total + parseFloat(etf.percentage);
        }, 0);
        
        return (sum / etfs.length).toFixed(2);
    }
    
    function showEmptyMessage() {
        resultsContainer.innerHTML = '<p>Please enter one or more ETF tickers to analyze.</p>';
    }
    
    // Show instructions on initial load
    resultsContainer.innerHTML = `
        <p>Enter ETF ticker symbols in the box above, separated by commas or spaces.</p>
        <p>Examples: SPY, QQQ, ARKK</p>
        <p>Try popular examples:</p>
        <ul>
            <li><a href="#" class="example-link">SPY, QQQ, VOO, VTI</a> (Popular index ETFs)</li>
            <li><a href="#" class="example-link">ARKK, ARKW, ARKG</a> (ARK ETFs)</li>
            <li><a href="#" class="example-link">TSLL, TESL, TSLQ</a> (Tesla-focused ETFs)</li>
        </ul>
    `;
    
    // Add click handlers for example links
    document.querySelectorAll('.example-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            etfInput.value = e.target.textContent.split('(')[0].trim();
            analyzeETFs();
        });
    });
});