function CoastLine(locations, box) {
  this.locations = locations;
  this.box = box;
}

CoastLine.prototype.draw = function() {
  this.box
    .selectAll("text")
    .data(this.locations)
    .enter()
    .append("text")
    .attr("x", 0)
    .attr("y", function(d, i) {
      return (i + 1) * 20;
    })
    .text(function(d) {
        return d.name;
    })
    .style("fill", function(d) {
        return d.color;
    })
    .on("click", function(d, i) {
      d.toggleHide();
      if (d3.select(this).style("text-decoration") !== "none") {
        d3.select(this).style("text-decoration", "none");  
      } else {
        d3.select(this).style("text-decoration", "line-through"); 
      }
    });  
};
