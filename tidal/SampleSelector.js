function SampleSelector(bounds, sample_box) {
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.bar_width = 5;
  this.spill = 20;

  this.bounds.time_viewbox_max =
    (this.bounds.time_viewbox_max - this.bounds.time_viewbox_min) * 0.2 +
    this.bounds.time_viewbox_min;

  this.sample_box.append("g").attr("id", this.getId());
}

SampleSelector.prototype.getId = function() {
  return "sampleSelector";
};

SampleSelector.norm_time = function(time, bounds, box) {
  return (
    ((time - bounds.time_min) / (bounds.time_max - bounds.time_min)) *
    box.attr("width")
  );
};

SampleSelector.reverse_norm_time = function(pixel, bounds, box) {
  return (
    (pixel / box.attr("width")) * (bounds.time_max - bounds.time_min) +
    bounds.time_min
  );
};

SampleSelector.prototype.draw = function() {
  let this_class = this;

  let innerLeft = SampleSelector.norm_time(
    this_class.bounds.time_viewbox_min,
    this_class.bounds,
    this_class.sample_box
  );

  let innerRight = SampleSelector.norm_time(
    this_class.bounds.time_viewbox_max,
    this_class.bounds,
    this_class.sample_box
  );

  let box = this.sample_box.select("#" + this_class.getId());

  box.selectAll("rect").remove();

  box
    .append("rect")
    .attr("id", "leftBar")
    .attr("x", innerLeft - this_class.bar_width)
    .attr("y", 0)
    .attr("width", this_class.bar_width)
    .attr("height", this_class.sample_box.attr("height"))
    .attr("fill", "black")
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerLeft =
            parseFloat(box.select("#leftBar").attr("x")) +
            this_class.bar_width +
            d3.event.dx;

          if (
            new_innerLeft >= box.select("#rightBar").attr("x") ||
            0 > new_innerLeft + this_class.spill
          ) {
            return;
          }

          box
            .select("#leftBar")
            .attr("x", new_innerLeft - this_class.bar_width);
          box
            .select("#centerRect")
            .attr("x", new_innerLeft)
            .attr("width", innerRight - new_innerLeft);
        })
        .on("end", function() {
          innerLeft = box.select("#centerRect").attr("x");
          this_class.bounds.time_viewbox_min = SampleSelector.reverse_norm_time(
            innerLeft,
            this_class.bounds,
            this_class.sample_box
          );
        })
    );

  box
    .append("rect")
    .attr("id", "rightBar")
    .attr("x", innerRight)
    .attr("y", 0)
    .attr("width", this_class.bar_width)
    .attr("height", this_class.sample_box.attr("height"))
    .attr("fill", "black")
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerRight =
            parseFloat(box.select("#rightBar").attr("x")) + d3.event.dx;

          if (
            parseFloat(box.select("#leftBar").attr("x")) +
              this_class.bar_width >=
              new_innerRight ||
            new_innerRight + this_class.bar_width - this_class.spill >
              this_class.sample_box.attr("width")
          ) {
            return;
          }

          box.select("#centerRect").attr("width", new_innerRight - innerLeft);
          box.select("#rightBar").attr("x", new_innerRight);
        })
        .on("end", function() {
          innerRight = box.select("#rightBar").attr("x");
          this_class.bounds.time_viewbox_max = SampleSelector.reverse_norm_time(
            innerRight,
            this_class.bounds,
            this_class.sample_box
          );
        })
    );

  // instead of shading the area between bars, what if we shaded the area outside of them?
  box
    .append("rect")
    .attr("id", "centerRect")
    .attr("x", innerLeft)
    .attr("y", 0)
    .attr("width", innerRight - innerLeft)
    .attr("height", this_class.sample_box.attr("height"))
    .attr("fill", "black")
    .style("opacity", 0.5)
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerLeft =
            parseFloat(box.select("#leftBar").attr("x")) +
            this_class.bar_width +
            d3.event.dx;
          let new_innerRight =
            parseFloat(box.select("#rightBar").attr("x")) + d3.event.dx;

          if (
            0 > new_innerLeft + this_class.spill ||
            new_innerRight + this_class.bar_width - this_class.spill >
              this_class.sample_box.attr("width")
          ) {
            return;
          }

          box
            .select("#leftBar")
            .attr("x", new_innerLeft - this_class.bar_width);
          box.select("#centerRect").attr("x", new_innerLeft);
          box.select("#rightBar").attr("x", new_innerRight);
        })
        .on("end", function() {
          innerLeft = box.select("#centerRect").attr("x");
          this_class.bounds.time_viewbox_min = SampleSelector.reverse_norm_time(
            innerLeft,
            this_class.bounds,
            this_class.sample_box
          );
          innerRight = box.select("#rightBar").attr("x");
          this_class.bounds.time_viewbox_max = SampleSelector.reverse_norm_time(
            innerRight,
            this_class.bounds,
            this_class.sample_box
          );
        })
    );
};

SampleSelector.prototype.updateViewboxLag = function() {
  this.bounds.time_viewbox_lag_min = this.bounds.time_viewbox_min;
  this.bounds.time_viewbox_lag_max = this.bounds.time_viewbox_max;
};
