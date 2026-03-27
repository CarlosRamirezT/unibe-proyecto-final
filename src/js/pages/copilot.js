window.addEventListener('load', function() {
    try {
        var dates = ['Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 22', 'Jan 23'];
        var prices = [475, 478, 482, 480, 485, 488, 485.5];

        var trace = {
            type: 'scatter',
            mode: 'lines',
            x: dates,
            y: prices,
            line: {
                color: '#0052B4',
                width: 3
            },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 82, 180, 0.1)'
        };

        var layout = {
            margin: { t: 20, r: 20, b: 40, l: 60 },
            plot_bgcolor: '#0A0E27',
            paper_bgcolor: '#0A0E27',
            xaxis: {
                gridcolor: '#1E293B',
                color: '#94A3B8'
            },
            yaxis: {
                gridcolor: '#1E293B',
                color: '#94A3B8',
                title: 'Price (RD$)'
            },
            showlegend: false
        };

        var config = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
        };

        Plotly.newPlot('stock-chart', [trace], layout, config);
    } catch(e) {
        document.getElementById('stock-chart').innerHTML = '<div class="flex items-center justify-center h-full text-textSecondary">Chart unavailable</div>';
    }
});
