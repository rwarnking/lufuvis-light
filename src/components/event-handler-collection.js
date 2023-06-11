import * as d3 from "d3";
import {AddTooltip} from "./component-collection";

function handleMouseOver(event, d, scale) {
    // Use D3 to select element, change color and size
    // d3.select(this)
    //     .attr("fill", "orange")
    //     .attr("r", 10.0);

    // d3.selectAll(`[data-id="${d3.select(this).attr("data-id")}"]:not(.small-multiple-p)`)
    //     .classed("hovered", true)
    //     .attr("r", 10.0);

    const rect = this.getBoundingClientRect();
    const recommendation = Math.round(d.recommended * 100) / 100;
    const printAbs = Math.round(d.best_val_a * 100) / 100;
    const printNorm = Math.round(printAbs / recommendation * 100);
    AddTooltip(rect,
        "Normalised: " + printNorm + "%" + "<br>" +
        "Absolute: " + printAbs + "<br>" +
        "Recommended: " + recommendation + "<br>" +
        "Interpretation: " + scale(printNorm)
    );
}

function handleMouseOverObs(event, d) {
    const rect = this.getBoundingClientRect();
    const dummyText = "This is very important dummy text";
    AddTooltip(rect,
        "<table> \
        <tr>\
            <td>Observation</td>" +
            "<td>" + d.obs_text + "</td>" +
        "</tr>\
        <tr>\
            <td>Notes</td>" +
            "<td>" + dummyText + "</td>" +
        "</tr>\
        </table>"
    );
}

function handleMouseOverPrePost(event, d) {
    const rect = this.getBoundingClientRect();
    AddTooltip(rect,
        "Interpretation: " + d.interpretation + "<br>" +
        "Pre/Post: " + d.pp + "<br>" +
        "Normalised: " + d["%"] + "%" + "<br>" +
        "Absolute: " + d.abs + "<br>" +
        "Recommended: " + d.recommended + "<br>"
    );
}

function handleMouseOverCandle(event, d, scale) {
    const nPre = Math.round(d.pre_val_a / d.recommended * 100.0);
    const nPost = Math.round(d.post_val_a / d.recommended * 100.0);
    const rect = this.getBoundingClientRect();
    AddTooltip(rect,
        "<table> \
        <tr>\
            <th></th>\
            <th>Pre</th>\
            <th>Post</th>\
        </tr>\
        <tr>\
            <td>Interpretation</td>" +
            "<td>" + scale(nPre) + "</td>" +
            "<td>" + scale(nPost) + "</td>" +
        "</tr>\
        <tr>\
            <td>Normalised</td>" +
            "<td>" + nPre + "</td>" +
            "<td>" + nPost + "</td>" +
        "</tr>\
        <tr>\
            <td>Absolute</td>" +
            "<td>" + d.pre_val_a + "</td>" +
            "<td>" + d.post_val_a + "</td>" +
        "</tr>\
        <tr>\
            <td>Recommended</td>" +
            "<td>" + d.recommended + "</td>" +
            "<td>" + d.recommended + "</td>" +
        "</tr>\
        </table>"
    );
}

function handleMouseSelect() {
    d3.selectAll("circle")
        .attr("r", 1.0);

    d3.selectAll("circle:not(.small-multiple-p)")
        .classed("clicked", false)
        .attr("r", 5.0);

    let superindex = Number.parseInt(d3.select(this).attr("data-id"));
    d3.selectAll(`[data-id="${superindex}"]`)
        .classed("clicked", true)
        .attr("r", 3.0);

    d3.selectAll(`[data-id="${superindex}"]:not(.small-multiple-p)`)
        .classed("hovered", false)
        .classed("clicked", true)
        .attr("r", 10.0);
}

function handleMouseOut() {
    // d3.select(this)
    //     .attr("fill", color)
    //     .attr("r", 5.0);

    // d3.selectAll(`[data-id="${d3.select(this).attr("data-id")}"]`)
    //     .classed("hovered", false)

    // d3.selectAll(`[data-id="${d3.select(this).attr("data-id")}"]:not(.clicked):not(.small-multiple-p)`)
    //     .attr("r", 5.0);

    // Select text by id and then remove
    d3.select("#tooltip").remove();  // Remove text location
    d3.select(".svg-tooltip").remove();  // Remove text location
}

export {
    handleMouseOver,
    handleMouseOverObs,
    handleMouseOverPrePost,
    handleMouseOverCandle,
    handleMouseSelect,
    handleMouseOut
}
