// https://bl.ocks.org/cmgiven/32d4c53f19aea6e528faf10bfe4f3da9

jQuery(function ($) {
    // shift + alt + F
    let h = 400;
    let w = 400;

    let bars = [200, 100, 200, 300];

    let dispatch = d3.dispatch("rect_event", "path_event")

    let svg = d3.select("body")
        .append("svg")
        .attr("height", h)
        .attr("width", w);

    let rect = svg.selectAll("rect")
        .data(bars)
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return i * 100;
        })
        .attr("y", function (d, i) {
            return h - d;
        })
        .attr("width", 100)
        .attr("height", function (d, i) {
            return d
        })
        .style("fill", "blue");

    let lineFunction = d3.line()
        .x(function (d, i) {
            return (i * 100) + 50;
        })
        .y(function (d, i) {
            return h - d;
        })
        .curve(d3.curveMonotoneX);

    let path = svg.append("path")
        .attr("d", lineFunction(bars))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    svg.append("text")
        .text("bars")
        .attr("x", 30)
        .attr("y", 30)
        .style("fill", "blue")
        .on("click", function () {
            dispatch.call("rect_event");
        });

    svg.append("text")
        .text("line")
        .attr("x", 30)
        .attr("y", 50)
        .style("fill", "red")
        .on("click", function () {
            dispatch.call("path_event");
        });

    dispatch.on("rect_event", function (d) {
        toggleHide(rect);
    })

    dispatch.on("path_event", function (d) {
        toggleHide(path);
    })

    let toggleHide = function (elem) {
        elem.classed("hide", elem.classed("hide") ? false : true);
    }

    // .on("mouseover", handleMouseOver)
    // .on("mouseout", handleMouseOut);

    bars.forEach(function (d, i) {
        let group = svg.append("g")
            .attr("id", "tooltip" + i)
            .classed("hide", "true");

        group.append("rect")
            .attr("x", i * 100)
            .attr("y", h - d - 20)
            .attr("width", 100)
            .attr("height", 20)
            .style("fill", "black")
            .style("opacity", 0.5);

        group.append("text")
            .text(d)
            .attr("x", i * 100)
            .attr("y", h - d)
            .style("fill", "white");
    });

    svg.selectAll("rect")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    function handleMouseOver(d, i) {
        d3.select("#tooltip" + i).classed("hide", false);
    };

    function handleMouseOut(d, i) {
        d3.select("#tooltip" + i).classed("hide", true);
    }

});