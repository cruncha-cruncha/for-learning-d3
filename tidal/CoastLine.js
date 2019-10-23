function CoastLine(locations, box) {
  this.locations = locations;
  this.box = box;
  this.data = [];
  this.min_X = null;
  this.min_Y = null;
  this.max_X = null;
  this.max_Y = null;

  this.file_names = [];
  for (let i = 0; i < 72; i++) {
    this.file_names.push(this.convert_filename(i) + ".csv");
  }
}

CoastLine.prototype.getEventName = function() {
  return "event_coastline";
};

CoastLine.prototype.setBounds = function() {
  if (this.data == null || this.data.length == 0)
    throw "Data is still null, in setBounds, in CoastLine";

  this.min_X = d3.min(this.data, function(more_data) {
    return d3.min(more_data, function(d) {
      return d.X;
    });
  });
  this.min_Y = d3.min(this.data, function(more_data) {
    return d3.min(more_data, function(d) {
      return d.Y;
    });
  });
  this.max_X = d3.max(this.data, function(more_data) {
    return d3.max(more_data, function(d) {
      return d.X;
    });
  });
  this.max_Y = d3.max(this.data, function(more_data) {
    return d3.max(more_data, function(d) {
      return d.Y;
    });
  });
};

CoastLine.prototype.convert_filename = function(count) {
  let lookup = ["A", "B", "C", "D", "E", "F", "G"];
  let out = [lookup[count % lookup.length]];
  count = count - (count % lookup.length);
  let exponent = 1;
  let coef;
  while (count > 0) {
    coef = count / Math.pow(lookup.length, exponent);
    coef = coef % lookup.length;
    coef = coef - 1;
    if (coef < 0) coef = lookup.length - 1;
    out.unshift(lookup[coef]);
    count = count - Math.pow(lookup.length, exponent) * (coef + 1);
    exponent += 1;
  }
  return out.join("");
};

CoastLine.prototype.readData = function(dispatch) {
  let this_class = this;

  let barrier = this_class.file_names.map(function() {
    return false;
  });

  for (let i = 0; i < this_class.file_names.length; i++) {
    d3.csv("datasets/clean/coastline/" + this_class.file_names[i])
      .then(function(read) {
        this_class.data.push(read);
        barrier[i] = true;
        if (
          barrier.every(e => {
            return e;
          })
        ) {
          this_class.setBounds();
          dispatch.call(this_class.getEventName());
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }
};

// need to change to respect aspect ratio of data
// also figure out how to hide the ugly part of the land
CoastLine.prototype.draw = function() {
  if (this.data == null || this.data.length == 0)
    throw "Data is still null, in draw, in CoastLine";

  let this_class = this;

  let lineFunction = d3
    .line()
    .x(function(d) {
      return (
        this_class.box.attr("width") - 
        ((d.X - this_class.min_X) / (this_class.max_X - this_class.min_X)) *
        this_class.box.attr("width")
      );
    })
    .y(function(d) {
      return (
        this_class.box.attr("height") -
        ((d.Y - this_class.min_Y) / (this_class.max_Y - this_class.min_Y)) *
          this_class.box.attr("height")
      );
    })
    .curve(d3.curveLinear);

  this.box
    .selectAll("path")
    .data(this_class.data)
    .enter()
    .append("path")
    .style("stroke-width", 1)
    .style("stroke", "black")
    .style("fill", "none")
    .attr("d", function(d) {
      return lineFunction(d);
    });

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
