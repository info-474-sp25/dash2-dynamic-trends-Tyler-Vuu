// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 100, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const selectAllCheckbox = document.getElementById("selectAllCities");
const cityCheckboxes = document.querySelectorAll(".cityCheckbox");


const svg1 = d3.select("#lineChart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let fullData = []; // Global variable to hold original data

// 2: LOAD CSV
d3.csv("weather.csv").then(data => {
    data.forEach(d => {
        d.date = new Date(d.date);
        d.temp = +d.actual_mean_temp;
        d.city = d.city.trim(); // Ensure no extra spaces
    });

    fullData = data;
    updateChart(getSelectedCities());
})

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
        .defined(d => !isNaN(d.temp) && d.temp !== null); // Handle missing values

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // graphs for each city
    for (const [city, values] of cityData.entries()) {
        // Sort values by date to ensure proper line drawing
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

    //X Axis
    svg1.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10) // adjust -10 as needed
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

    // legend
    const legend = svg1.append("g")
        .attr("class", "legend")
    //fix here
        .attr("transform", `translate(0, ${height - 100})`);

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

        // Calculate width of this legend item for next positioning
        legendX += city.length * 8 + 40; // Approximate width based on text length
    }
}

// 5: Add Event Listeners to Checkboxes (when DOM is loaded)
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll(".cityCheckbox").forEach(cb => {
        cb.addEventListener("change", () => {
            updateChart(getSelectedCities());
        });
    });
});


// 1. When "Select All" is checked, check all cities
selectAllCheckbox.addEventListener("change", () => {
    cityCheckboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    updateChart(getSelectedCities());
});

// 2. When a city is clicked, uncheck "Select All" if not all are selected
cityCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
        const allChecked = Array.from(cityCheckboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
        updateChart(getSelectedCities());
    });
});


// 7: ADD TOOLTIP FUNCTIONALITY
const tooltip = d3.select("#tooltip");

// Create a bisector to find the closest date
const bisectDate = d3.bisector(d => d.date).left;

// Add overlay for capturing mouse events
svg1_RENAME.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const x0 = x1.invert(mx);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        tooltip
            .style("opacity", 1)
            .html(`
                <strong>${d3.timeFormat("%B %d, %Y")(d.date)}</strong><br>
                Temp: ${d.temp} °F
            `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("opacity", 0);
    });