function MoonSelector(output_box, bounds, moon_box) {
  this.output_box = output_box;
  this.bounds = bounds;
  this.x = this.output_box.attr("width") / 2;
  this.moonNormal = new MoonNormal(moon_box, bounds);
  //this.moonEcliptic = new MoonEcliptic();
  // https://www.moongiant.com/phase/9/14/2019

  this.output_box.append("g").attr("id", this.getId());
}

MoonSelector.prototype.getId = function() {
  return "moon_selector_id";
};

MoonSelector.prototype.draw = function() {
  this.moonNormal.setTime(this.getTime());
  this.moonNormal.draw();

  let box = this.output_box.select("#" + this.getId());

  let this_class = this;

  let get_poly_coors = function(zero) {
    let height = this_class.output_box.attr("height");
    return [
      [zero - 5, 0],
      [zero + 5 + 1, 0],
      [zero + 5 + 1, 10],
      [zero + 1, 20],
      [zero + 1, height - 30],
      [zero + 5 + 1, height - 20],
      [zero + 5 + 1, height - 10],
      [zero + 1, height],
      [zero, height],
      [zero - 5, height - 10],
      [zero - 5, height - 20],
      [zero, height - 30],
      [zero, 20],
      [zero - 5, 10]
    ];
  };

  box
    .append("polygon")
    .attr("points", function() {
      return get_poly_coors(this_class.x)
        .map(function(d) {
          return d.join(",");
        })
        .join(" ");
    })
    .attr("fill", "black")
    .attr("stroke", "none")
    .call(
      d3.drag().on("drag", function() {
        let new_x = this_class.x + d3.event.dx;
        if (new_x < 0) {
          new_x = 0;
        } else if (new_x > this_class.output_box.attr("width")) {
          new_x = parseFloat(this_class.output_box.attr("width"));
        }

        this_class.x = new_x;
        box.select("polygon").attr("points", function() {
          return get_poly_coors(this_class.x)
            .map(function(d) {
              return d.join(",");
            })
            .join(" ");
        });
        this_class.moonNormal.update(this_class.getTime());
      })
    );
};

MoonSelector.prototype.remove = function() {
  this.moonNormal.remove();
  let box = this.output_box.select("#" + this.getId());
  box.select("polygon").remove();
};

MoonSelector.prototype.getTime = function() {
  return (
    (this.x / this.output_box.attr("width")) *
      (this.bounds.time_viewbox_max - this.bounds.time_viewbox_min) +
    this.bounds.time_viewbox_min
  );
};
