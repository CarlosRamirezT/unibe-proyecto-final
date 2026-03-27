window.addEventListener('load', function() {
    try {
        const chartConfigs = [
            { id: 'chart-aapl', color: '#10B981', data: [165, 168, 172, 169, 175, 178, 176, 178.45] },
            { id: 'chart-tsla', color: '#10B981', data: [220, 225, 230, 228, 235, 238, 240, 242.67] },
            { id: 'chart-msft', color: '#EF4444', data: [425, 422, 418, 420, 415, 412, 414, 412.33] },
            { id: 'chart-nvda', color: '#10B981', data: [820, 835, 845, 840, 855, 865, 870, 875.28] }
        ];

        chartConfigs.forEach(config => {
            const data = [{
                type: 'scatter',
                mode: 'lines',
                x: [0, 1, 2, 3, 4, 5, 6, 7],
                y: config.data,
                line: { color: config.color, width: 2 },
                fill: 'tozeroy',
                fillcolor: config.color + '20'
            }];

            const layout = {
                margin: { t: 0, r: 0, b: 0, l: 0 },
                plot_bgcolor: 'transparent',
                paper_bgcolor: 'transparent',
                xaxis: { visible: false },
                yaxis: { visible: false },
                showlegend: false,
                hovermode: false
            };

            const plotConfig = {
                responsive: true,
                displayModeBar: false,
                displaylogo: false
            };

            Plotly.newPlot(config.id, data, layout, plotConfig);
        });
    } catch(e) {
        console.error('Chart error:', e);
    }

    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.opacity = i === index ? '1' : '0';
            slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.style.opacity = i === index ? '1' : '0.3';
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }

    document.querySelector('.carousel-next').addEventListener('click', nextSlide);
    document.querySelector('.carousel-prev').addEventListener('click', prevSlide);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    setInterval(nextSlide, 5000);

    const timeframeBtns = document.querySelectorAll('.timeframe-btn');
    timeframeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            timeframeBtns.forEach(b => {
                b.classList.remove('active', 'bg-accent', 'text-white');
                b.classList.add('text-textSecondary');
            });
            this.classList.add('active', 'bg-accent', 'text-white');
            this.classList.remove('text-textSecondary');
        });
    });
});
