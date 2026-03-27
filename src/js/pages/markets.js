window.addEventListener('load', function() {
    try {
        const chartConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
        };

        const layoutBase = {
            margin: { t: 10, r: 10, b: 30, l: 40 },
            plot_bgcolor: '#141827',
            paper_bgcolor: '#141827',
            xaxis: {
                gridcolor: '#1E293B',
                showgrid: false,
                color: '#94A3B8'
            },
            yaxis: {
                gridcolor: '#1E293B',
                color: '#94A3B8'
            },
            showlegend: false
        };

        const bhdData = [{
            type: 'scatter',
            mode: 'lines',
            x: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            y: [44.20, 44.50, 44.80, 45.10, 45.30, 45.60, 45.40, 45.50],
            line: { color: '#10B981', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(16, 185, 129, 0.1)'
        }];
        Plotly.newPlot('chart-bhd', bhdData, layoutBase, chartConfig);

        const popData = [{
            type: 'scatter',
            mode: 'lines',
            x: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            y: [37.50, 37.70, 37.90, 38.00, 38.10, 38.30, 38.20, 38.25],
            line: { color: '#10B981', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(16, 185, 129, 0.1)'
        }];
        Plotly.newPlot('chart-pop', popData, layoutBase, chartConfig);

        const cemexData = [{
            type: 'scatter',
            mode: 'lines',
            x: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            y: [151.00, 152.50, 153.80, 154.50, 155.20, 156.50, 156.80, 156.00],
            line: { color: '#10B981', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(16, 185, 129, 0.1)'
        }];
        Plotly.newPlot('chart-cemex', cemexData, layoutBase, chartConfig);

        const ricaData = [{
            type: 'scatter',
            mode: 'lines',
            x: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            y: [23.00, 22.95, 22.90, 22.85, 22.80, 22.75, 22.78, 22.80],
            line: { color: '#EF4444', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(239, 68, 68, 0.1)'
        }];
        Plotly.newPlot('chart-rica', ricaData, layoutBase, chartConfig);

    } catch(e) {
        console.error('Chart rendering error:', e);
    }
});
