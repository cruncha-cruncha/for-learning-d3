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

  this.special_box = this.box
    .append("g")
    .attr("width", this.box.attr("width"))
    .attr("height", this.box.attr("height"));
  let tran_x = this.special_box.attr("width") / 1.2332714;
  let tran_y = this.special_box.attr("height") / -4.6076389;
  this.special_box.attr(
    "transform",
    "scale(1.15) translate(" + tran_x + "," + tran_y + ") rotate(45)"
  );

  this.box.append("g").attr("id", this.getTextBoxId());
}

CoastLine.prototype.getEventName = function() {
  return "event_coastline";
};

CoastLine.prototype.getTextBoxId = function() {
  return "coastline_text_box";
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

CoastLine.prototype.draw = function() {
  if (this.data == null || this.data.length == 0)
    throw "Data is still null, in draw, in CoastLine";

  let this_class = this;

  let ratiod_width =
    (this_class.special_box.attr("height") *
      Math.abs(this_class.max_X - this_class.min_X)) /
    Math.abs(this_class.max_Y - this_class.min_Y);
  let ratiod_height = this_class.box.attr("height");
  if (ratiod_width > this_class.box.attr("width")) {
    ratiod_width = this_class.box.attr("width");
    ratiod_height =
      (this_class.special_box.attr("width") *
        Math.abs(this_class.max_Y - this_class.min_Y)) /
      Math.abs(this_class.max_X - this_class.min_X);
  }

  let lineFunction = d3
    .line()
    .x(function(d) {
      return (
        ratiod_width -
        ((d.X - this_class.min_X) / (this_class.max_X - this_class.min_X)) *
          ratiod_width
      );
    })
    .y(function(d) {
      return (
        ratiod_height -
        ((d.Y - this_class.min_Y) / (this_class.max_Y - this_class.min_Y)) *
          ratiod_height
      );
    })
    .curve(d3.curveLinear);

  this.special_box
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

  text_width = [];
  this.box
    .selectAll("text")
    .data(this.locations)
    .enter()
    .append("text")
    .text(function(d) {
      return d.name;
    })
    .each(function(d, i) {
      text_width.push(this.getComputedTextLength());
      this.remove();
      if (i + 1 == this_class.locations.length) {
        this_class.draw_text(text_width);
      }
    });
};

CoastLine.prototype.draw_text = function(text_width) {
  let this_class = this;

  let offset_x = -24;
  let offset_y = 5;
  let rect_pad = 8;

  this.box
    .select("#" + this_class.getTextBoxId())
    .selectAll("circle")
    .data(this.locations)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return d.coastline_coor[0];
    })
    .attr("cy", function(d) {
      return d.coastline_coor[1];
    })
    .attr("r", 7)
    .attr("fill", "white")
    .attr("stroke", function(d) {
      return d.color;
    })
    .attr("stroke-width", 6);

  this.box
    .select("#" + this_class.getTextBoxId())
    .selectAll("rect")
    .data(this.locations)
    .enter()
    .append("rect")
    .attr("x", function(d, i) {
      return d.coastline_coor[0] - text_width[i] - rect_pad + offset_x;      
    })
    .attr("y", function(d) {
      return d.coastline_coor[1] - 20 + offset_y;
    })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", function(d, i) {
      return text_width[i] + (rect_pad * 2);  
    })
    .attr("height", function(d) {
      return 20 + rect_pad;
    })
    .attr("fill", "white")
    .attr("fill-opacity", 0.8)
    .attr("stroke", function(d) {
      return d.color;
    })
    .attr("stroke-width", 1);

  this.box
    .select("#" + this_class.getTextBoxId())
    .selectAll("text")
    .data(this.locations)
    .enter()
    .append("text")
    .attr("x", function(d, i) {
      return d.coastline_coor[0] - text_width[i] + offset_x;
    })
    .attr("y", function(d) {
      return d.coastline_coor[1] + offset_y;
    })
    .text(function(d) {
      return d.name;
    })
    .style("fill", "black")
    .on("click", function(d, i) {
      let hidden = d.toggleHide();
      if (hidden) {
        d3.select(this).style("fill", "grey").style("text-decoration", "line-through");
      } else {
        d3.select(this).style("fill", "black").style("text-decoration", "none");
      }
    });
};
