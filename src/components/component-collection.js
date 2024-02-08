import * as d3 from "d3";

function AddLine(svg, defined, x, y, I, zoom=false) {
    // Construct a line generator.
    const line = d3.line()
        .defined(defined)
        .curve(d3.curveLinear)
        .x(x)
        .y(y);

    return svg.append("path")
        .classed("dataline", true)
        .classed("zoomable", zoom)
        .attr("fill", "none")
        .attr("d", line(I));
}

function AddRecommendationLine(svg, lineThreshold, xScale, yScale) {
    svg.append("line")
        .classed("recommendation-line", true)
        .attr("x1", xScale.range()[0])
        .attr("y1", yScale(lineThreshold))
        .attr("x2", xScale.range()[1])
        .attr("y2", yScale(lineThreshold));
}

function AddAreas(svg, areas, xScale, yScale) {
    const colors = {
        "high": "red",
        "medium": "orangered",
        "low": "orange",
        "normal": "green",
    }

    areas.sort((a, b) => a.start - b.start)

    return svg.append("g")
        .selectAll("rect")
        .data(areas)
        .join("rect")
        .attr("x", xScale.range()[0])
        .attr("y", d => yScale(d.end))
        .attr("width", xScale.range()[1]-xScale.range()[0])
        .attr("height", d => yScale(d.start)-yScale(d.end))
        .attr('fill-opacity', 0.2)
        .attr("fill", d => colors[d.name])
}

function AddTooltip(rect, text="Dummy Text!") {
    // TODO: hard coded check values
    const x = rect.x + 15 + 100 < window.innerWidth ? rect.x + 15 : rect.x - 15 - 100;
    const y = rect.y + 75 < window.innerHeight ? rect.y : rect.y - 75;
    d3.select(".detail-chart")
        .append("div")
        .classed("svg-tooltip", true)
        // .style("position", "absolute")
        // .style("visibility", "hidden")
        .html(text)
        // .style("visibility", "visible")
        .style("left", x +"px")
        .style("top", y + "px")
        // .style("top", xScale(x(d)) + 10.0 +"px")
        // .style("left", yScale(y(d)) + "px")
        // .style("position", "absolute")
        // .attr("stroke", color)
        // .attr("stroke-width", strokeWidth);
}

export {AddLine, AddRecommendationLine, AddAreas, AddTooltip}
