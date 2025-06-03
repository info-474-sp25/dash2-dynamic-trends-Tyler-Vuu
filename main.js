// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_RENAME = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_RENAME = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("weather.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    data.forEach(d => {
        d.date = new Date(d.date);
        d.temp = +d.actual_mean_temp;
    });

    // 3.a: SET SCALES FOR CHART 1 (Mean Temp)
    const x1 = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, width]);
    const y1 = d3.scaleLinear().domain([0, d3.max(data, d => d.temp)]).nice().range([height, 0]);

    // 4.a: PLOT DATA FOR CHART 1
    svg1_RENAME.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x1(d.date))
            .y(d => y1(d.temp))
        );

    // 5.a: ADD AXES FOR CHART 1
    svg1_RENAME.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x1).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b-%Y")))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg1_RENAME.append("g").call(d3.axisLeft(y1));

    // 6.a: ADD LABELS FOR CHART 1
    svg1_RENAME.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Mean Temperature (°F)");
    







        // Populate year dropdown
const years = Array.from(new Set(data.map(d => d.date.getFullYear())));
years.forEach(year => {
    d3.select("#yearSelect").append("option").attr("value", year).text(year);
});

// Filtering function
function updateChart(selectedYear) {
    const filteredData = selectedYear === "all" ? data : data.filter(d => d.date.getFullYear() == selectedYear);

    // Update scales
    x1.domain(d3.extent(filteredData, d => d.date));
    y1.domain([0, d3.max(filteredData, d => d.temp)]).nice();

    // Update line
    svg1_RENAME.selectAll("path")
        .datum(filteredData)
        .transition()
        .duration(750)
        .attr("d", d3.line()
            .x(d => x1(d.date))
            .y(d => y1(d.temp))
        );

    // Update circles
    svg1_RENAME.selectAll("circle").remove();
    svg1_RENAME.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x1(d.date))
        .attr("cy", d => y1(d.temp))
        .attr("r", 3)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<strong>Date:</strong> ${d3.timeFormat("%B %d, %Y")(d.date)}<br><strong>Temp:</strong> ${d.temp} °F`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

    // Update axes
    svg1_RENAME.select("g").call(d3.axisLeft(y1));
    svg1_RENAME.select("g:nth-of-type(2)")
        .transition()
        .duration(750)
        .call(d3.axisBottom(x1).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b-%Y")))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
}

// Bind dropdown to update
d3.select("#yearSelect").on("change", function () {
    updateChart(this.value);
});


});