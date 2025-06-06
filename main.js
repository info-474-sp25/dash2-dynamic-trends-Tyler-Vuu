// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 100, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg1 = d3.select("#lineChart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let fullData = []; // Global variable to hold original data

// Create tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("padding", "12px")
    .style("border-radius", "6px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "13px")
    .style("font-family", "Arial, sans-serif")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.3)")
    .style("z-index", "1000")
    .style("max-width", "200px");

// 2: LOAD CSV
d3.csv("weather.csv").then(data => {
    data.forEach(d => {
        d.date = new Date(d.date);
        d.temp = +d.actual_mean_temp;
        d.city = d.city.trim(); // Ensure no extra spaces
    });

    fullData = data;
    updateChart(getSelectedCities());
}).catch(error => {
    console.error("Error loading CSV:", error);
});

// 3: Get Selected Cities from Checkboxes
function getSelectedCities() {
    const checkboxes = document.querySelectorAll(".cityCheckbox:checked");
    return Array.from(checkboxes).map(cb => cb.value);
}

// 4: Update Chart Based on Selected Cities
function updateChart(selectedCities) {
    // Clear existing content
    svg1.selectAll("*").remove();

    const filteredData = fullData.filter(d => selectedCities.includes(d.city));

    if (filteredData.length === 0) return;

    // GROUP DATA BY CITY
    const cityData = d3.group(filteredData, d => d.city);

    // X and Y scales
    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.temp)).nice()
        .range([height, 0]);

    // Line generator
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.temp))
        .defined(d => !isNaN(d.temp) && d.temp !== null);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Draw lines for each city
    for (const [city, values] of cityData.entries()) {
        const sortedValues = values.sort((a, b) => a.date - b.date);
        
        svg1.append("path")
            .datum(sortedValues)
            .attr("fill", "none")
            .attr("stroke", color(city))
            .attr("stroke-width", 2)
            .attr("d", line);
    }

    // X Axis
    svg1.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b-%Y")))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // X Axis Label
    svg1.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Date");

    // Y Axis
    svg1.append("g").call(d3.axisLeft(y));

    // Y Label
    svg1.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Mean Temperature (°F)");

    // Legend
    const legend = svg1.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0, ${height - 250})`);

    let legendX = 0;
    for (const city of selectedCities) {
        const legendItem = legend.append("g")
            .attr("transform", `translate(${legendX}, 0)`);

        legendItem.append("line")
            .attr("x1", 0)
            .attr("x2", 15)
            .attr("stroke", color(city))
            .attr("stroke-width", 2);

        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 0)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .text(city);

        legendX += city.length * 8 + 40;
    }

    // Add tooltip functionality
    addTooltip(x, y, filteredData, cityData, color);
}

// 5: Tooltip Function
function addTooltip(x, y, filteredData, cityData, color) {
    // Create a bisector to find the closest date
    const bisectDate = d3.bisector(d => d.date).left;

    // Add overlay for capturing mouse events - make sure it's on top
    const overlay = svg1.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .style("cursor", "crosshair");

    // Add mouse event handlers
    overlay.on("mousemove", function(event) {
        try {
            const [mx, my] = d3.pointer(event, this);
            
            // Make sure we're within bounds
            if (mx < 0 || mx > width || my < 0 || my > height) {
                tooltip.style("opacity", 0);
                return;
            }
            
            const x0 = x.invert(mx);
            
            // Find closest data points for each city
            let closestPoints = [];
            
            for (const [city, values] of cityData.entries()) {
                const sortedValues = values.sort((a, b) => a.date - b.date);
                
                if (sortedValues.length === 0) continue;
                
                const i = bisectDate(sortedValues, x0, 1);
                const d0 = sortedValues[i - 1];
                const d1 = sortedValues[i];
                
                let closestPoint = null;
                
                if (d0 && d1) {
                    closestPoint = x0 - d0.date > d1.date - x0 ? d1 : d0;
                } else if (d0) {
                    closestPoint = d0;
                } else if (d1) {
                    closestPoint = d1;
                }
                
                if (closestPoint && !isNaN(closestPoint.temp)) {
                    closestPoints.push({ 
                        city, 
                        data: closestPoint, 
                        color: color(city) 
                    });
                }
            }

            if (closestPoints.length > 0) {
                // Sort by temperature for consistent display
                closestPoints.sort((a, b) => b.data.temp - a.data.temp);
                
                let tooltipContent = `<strong>${d3.timeFormat("%B %d, %Y")(closestPoints[0].data.date)}</strong><br>`;
                
                closestPoints.forEach(point => {
                    tooltipContent += `<span style="color: ${point.color}">● ${point.city}: ${point.data.temp.toFixed(1)}°F</span><br>`;
                });

                // Get mouse position relative to the page
                const rect = svg1.node().getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                tooltip
                    .style("opacity", 0.9)
                    .html(tooltipContent)
                    .style("left", (rect.left + scrollLeft + mx + 15) + "px")
                    .style("top", (rect.top + scrollTop + my - 28) + "px");
            } else {
                tooltip.style("opacity", 0);
            }
        } catch (error) {
            console.error("Tooltip error:", error);
            tooltip.style("opacity", 0);
        }
    })
    .on("mouseout", function() {
        tooltip.style("opacity", 0);
    })
    .on("mouseleave", function() {
        tooltip.style("opacity", 0);
    });
}

// 6: Add Event Listeners to Checkboxes (when DOM is loaded)
document.addEventListener('DOMContentLoaded', function() {
    const selectAllCheckbox = document.getElementById("selectAllCities");
    const cityCheckboxes = document.querySelectorAll(".cityCheckbox");

    // Individual checkbox listeners
    document.querySelectorAll(".cityCheckbox").forEach(cb => {
        cb.addEventListener("change", () => {
            updateChart(getSelectedCities());
            
            // Update select all checkbox state
            if (selectAllCheckbox) {
                const allChecked = Array.from(cityCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            }
        });
    });

    // Select all checkbox listener
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", () => {
            cityCheckboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
            updateChart(getSelectedCities());
        });
    }
});