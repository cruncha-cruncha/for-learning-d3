jQuery(function($) {
  function Bounds() {
  this.time_min = null;
  this.time_max = null;
  this.time_viewbox_min = null;
  this.time_viewbox_max = null;
  this.time_viewbox_lag_min = null;
  this.time_viewbox_lag_max = null;
  this.encoder_min = null;
  this.encoder_max = null;
}

function Margin(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left;
}

Margin.prototype.applyTo = function(elem, width, height) {
  elem.attr("width", width - this.left - this.right);
  elem.attr("height", height - this.top - this.bottom);
  elem.attr("transform", "translate(" + this.left + ", " + this.top + ")");
};

let norm_encoder = function(encoder, bounds, box) {
  return (
    box.attr("height") -
    ((encoder - bounds.encoder_min) /
      (bounds.encoder_max - bounds.encoder_min)) *
      box.attr("height")
  );
};

let addDays = function(time, days) {
  let out = new Date(time);
  out.setDate(date.getDate() + days);
  return out.getTime();
};

// Vancouver is UTC-7 during daylight savings
let ZONE_OFFSET = 1000 * 60 * 60 * 7;


  function SampleSelector(bounds, sample_box, locationScales) {
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.locationScales = locationScales;
  this.bar_width = 5;
  this.spill = 20;

  let ten_days = 1000 * 60 * 60 * 24 * 10;
  this.bounds.time_viewbox_max = this.bounds.time_viewbox_min + ten_days;

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

  this_class.locationScales.drawDayTicks(innerLeft, innerRight);

  let box = this.sample_box.select("#" + this_class.getId());

  box.selectAll("rect").remove();
  box.selectAll("polygon").remove();

  let get_left_bar_coors = function(zero) {
    return [
      [zero - this_class.bar_width - 5, 0],
      [zero, 0],
      [zero, this_class.sample_box.attr("height")],
      [zero - this_class.bar_width, this_class.sample_box.attr("height")],
      [zero - this_class.bar_width, 20],
      [zero - this_class.bar_width - 5, 10]
    ];
  };

  box
    .append("polygon")
    .attr("id", "leftBar")
    .attr("points", function() {
      return get_left_bar_coors(innerLeft)
        .map(function(d) {
          return d.join(",");
        })
        .join(" ");
    })
    .attr("fill", "black")
    .attr("stroke", "none")
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerLeft =
            parseFloat(box.select("#centerRect").attr("x")) + d3.event.dx;

          if (
            new_innerLeft >=
            parseFloat(box.select("#centerRect").attr("x")) +
              parseFloat(box.select("#centerRect").attr("width"))
          ) {
            new_innerLeft =
              parseFloat(box.select("#centerRect").attr("x")) +
              parseFloat(box.select("#centerRect").attr("width")) -
              1;
          } else if (0 >= new_innerLeft + this_class.spill) {
            new_innerLeft = 0 - this_class.spill + 1;
          }

          this_class.locationScales.drawDayTicks(new_innerLeft, innerRight);

          box.select("#leftBar").attr("points", function() {
            return get_left_bar_coors(new_innerLeft)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
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

  let get_right_bar_coors = function(zero) {
    return [
      [zero, 0],
      [zero + this_class.bar_width + 5, 0],
      [zero + this_class.bar_width + 5, 10],
      [zero + this_class.bar_width, 20],
      [zero + this_class.bar_width, this_class.sample_box.attr("height")],
      [zero, this_class.sample_box.attr("height")]
    ];
  };

  box
    .append("polygon")
    .attr("id", "rightBar")
    .attr("points", function() {
      return get_right_bar_coors(innerRight)
        .map(function(d) {
          return d.join(",");
        })
        .join(" ");
    })
    .attr("fill", "black")
    .attr("stroke", "none")
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width")) +
            d3.event.dx;

          if (
            parseFloat(box.select("#centerRect").attr("x")) >= new_innerRight
          ) {
            new_innerRight =
              parseFloat(box.select("#centerRect").attr("x")) + 1;
          } else if (
            new_innerRight + this_class.bar_width - this_class.spill >=
            this_class.sample_box.attr("width")
          ) {
            new_innerRight =
              parseFloat(this_class.sample_box.attr("width")) +
              this_class.spill -
              this_class.bar_width -
              1;
          }

          this_class.locationScales.drawDayTicks(innerLeft, new_innerRight);

          box.select("#centerRect").attr("width", new_innerRight - innerLeft);
          box.select("#rightBar").attr("points", function() {
            return get_right_bar_coors(new_innerRight)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
        })
        .on("end", function() {
          innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width"));
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
            parseFloat(box.select("#centerRect").attr("x")) + d3.event.dx;
          let new_innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width")) +
            d3.event.dx;

          if (0 >= new_innerLeft + this_class.spill) {
            new_innerLeft = 0 - this_class.spill + 1;
            new_innerRight =
              new_innerLeft +
              parseFloat(box.select("#centerRect").attr("width"));
          } else if (
            new_innerRight + this_class.bar_width - this_class.spill >=
            this_class.sample_box.attr("width")
          ) {
            new_innerRight =
              parseFloat(this_class.sample_box.attr("width")) +
              this_class.spill -
              this_class.bar_width -
              1;
            new_innerLeft =
              new_innerRight - box.select("#centerRect").attr("width");
          }

          this_class.locationScales.drawDayTicks(new_innerLeft, new_innerRight);

          box.select("#leftBar").attr("points", function() {
            return get_left_bar_coors(new_innerLeft)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
          box.select("#centerRect").attr("x", new_innerLeft);
          box.select("#rightBar").attr("points", function() {
            return get_right_bar_coors(new_innerRight)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
        })
        .on("end", function() {
          innerLeft = box.select("#centerRect").attr("x");
          this_class.bounds.time_viewbox_min = SampleSelector.reverse_norm_time(
            innerLeft,
            this_class.bounds,
            this_class.sample_box
          );
          innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width"));
          this_class.bounds.time_viewbox_max = SampleSelector.reverse_norm_time(
            innerRight,
            this_class.bounds,
            this_class.sample_box
          );
        })
    );
};

SampleSelector.prototype.updateBounds = function() {
  this.bounds.time_viewbox_lag_min = this.bounds.time_viewbox_min;
  this.bounds.time_viewbox_lag_max = this.bounds.time_viewbox_max;
};


  function Location(
  name,
  dir,
  color,
  bounds,
  sample_box,
  output_box,
  coastline_coor
) {
  this.name = name;
  this.dir = dir;
  this.color = color;
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.output_box = output_box;
  this.coastline_coor = coastline_coor;
  this.data = [];
  this.output = [];
  this.output_lag = [];
  this.sample = [];
  this.done_read = false;
  this.DURATION = 1000;

  this.sample_box.append("g").attr("id", this.getSampleBoxId());
  this.output_box.append("g").attr("id", this.getOutputBoxId());
}

Location.prototype.toggleHide = function() {
  let tmp;
  tmp = this.sample_box.select("#" + this.getSampleBoxId());
  tmp.classed("hide", !tmp.classed("hide"));
  tmp = this.output_box.select("#" + this.getOutputBoxId());
  tmp.classed("hide", !tmp.classed("hide"));
  return tmp.classed("hide");
};

Location.prototype.getSampleBoxId = function() {
  return "id_" + this.dir.toLowerCase() + "_sampleBox";
};

Location.prototype.getOutputBoxId = function() {
  return "id_" + this.dir.toLowerCase() + "_outputBox";
};

Location.prototype.getEventName = function() {
  return "event_" + this.dir.toLowerCase();
};

Location.prototype.sortData = function(data) {
  if (data == null || data.length == 0)
    throw "Data is null, in sortData, in " + this.name;

  data = data.sort(function(a, b) {
    if (a.time < b.time) {
      return -1;
    } else {
      return 1;
    }
  });

  return data;
};

Location.prototype.updateBounds = function(viewbox = true) {
  if (this.data == null || this.data.length == 0)
    throw "Data is still null, in removeBadCols, in " + this.name;

  let local_time_min, local_time_max;
  [local_time_min, local_time_max] = d3.extent(this.data, function(d) {
    return d.time;
  });

  let local_encoder_min, local_encoder_max;
  [local_encoder_min, local_encoder_max] = d3.extent(this.data, function(d) {
    return d.encoder;
  });

  local_encoder_min = Math.floor(local_encoder_min * 2) / 2;
  local_encoder_max = Math.ceil(local_encoder_max * 2) / 2;

  let boundsChange = false;

  if (viewbox) {
    if (
      this.bounds.time_viewbox_min == null ||
      this.bounds.time_viewbox_min > local_time_min
    ) {
      this.bounds.time_viewbox_min = local_time_min;
      boundsChange = true;
    }
    if (
      this.bounds.time_viewbox_max == null ||
      this.bounds.time_viewbox_max < local_time_max
    ) {
      this.bounds.time_viewbox_max = local_time_max;
      boundsChange = true;
    }
  }

  if (this.bounds.time_min == null || this.bounds.time_min > local_time_min) {
    this.bounds.time_min = local_time_min;
    boundsChange = true;
  }
  if (this.bounds.time_max == null || this.bounds.time_max < local_time_max) {
    this.bounds.time_max = local_time_max;
    boundsChange = true;
  }
  if (
    this.bounds.encoder_min == null ||
    this.bounds.encoder_min > local_encoder_min
  ) {
    this.bounds.encoder_min = local_encoder_min;
    boundsChange = true;
  }
  if (
    this.bounds.encoder_max == null ||
    this.bounds.encoder_max < local_encoder_max
  ) {
    this.bounds.encoder_max = local_encoder_max;
    boundsChange = true;
  }

  return boundsChange;
};

Location.prototype.convertTime = function(read) {
  if (read == null || read.length == 0)
    throw "Read is null, in convertTime, in " + this.name;

  read = read.map(function(row) {
    // like 2019-09-29 0:00 or 2019-09-29 10:15
    row.time = moment.utc(row.time, "YYYY-MM-DD H:mm").valueOf();
    return row;
  });

  return read;
};

Location.prototype.readData = function(files, done_dispatch, update_dispatch) {
  if (files == null || files.length == 0 || done_dispatch == null || update_dispatch == null)
    throw "Bad input to readData, in " + this.name;

  let this_loc = this;

  let barrier = files.map(function() {
    return false;
  });

  let readData_serial = function(i) {
    d3.csv("datasets/clean/" + this_loc.dir + "/" + files[i])
      .then(function(read) {
        read = this_loc.convertTime(read);
        this_loc.data = this_loc.data.concat(read);
        update_dispatch.call(this_loc.getEventName(), this, files[i]);
        barrier[i] = true;
        if (
          barrier.every(e => {
            return e;
          })
        ) {
          this_loc.data = this_loc.sortData(this_loc.data);
          this_loc.updateSample();
          this_loc.done_read = true;
          done_dispatch.call(this_loc.getEventName());
        }
        if (i + 1 < files.length) {
          readData_serial(i+1);
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  readData_serial(0);
};

Location.prototype.updateViewbox = function(
  time_viewbox_min,
  time_viewbox_min
) {
  if (time_viewbox_min == null || time_viewbox_max == 0)
    throw "Bad args in updateViewbox, in " + this.name;

  this.bounds.time_viewbox_min = time_viewbox_min;
  this.bounds.time_viewbox_max = time_viewbox_max;
};

Location.prototype.updateSample = function(sampleRate = 20) {
  if (this.data == null || this.data.length == 0)
    throw "Data is still null, in updateSample, in " + this.name;

  this.sample = this.data.filter(function(d, i) {
    return i % sampleRate == 0;
  });

  this.sample.push(this.data[this.data.length - 1]);
};

Location.prototype.drawSample = function() {
  if (this.sample == null || this.sample.length == 0)
    throw "Sample is still null, in drawSample, in " + this.name;

  let this_loc = this;

  let lineFunction = d3
    .line()
    .x(function(d) {
      return SampleSelector.norm_time(
        d.time,
        this_loc.bounds,
        this_loc.sample_box
      );
    })
    .y(function(d) {
      return norm_encoder(d.encoder, this_loc.bounds, this_loc.sample_box);
    })
    .curve(d3.curveLinear);

  let path = this.sample_box
    .select("#" + this_loc.getSampleBoxId())
    .selectAll("path")
    .data([this_loc.sample]);
  path.attr("d", function(d) {
    return lineFunction(d);
  });
  path
    .enter()
    .append("path")
    .style("stroke-width", 1)
    .style("stroke", this_loc.color)
    .style("fill", "none")
    .attr("d", function(d) {
      return lineFunction(d);
    });
  path.exit().remove();
};

Location.prototype.updateOutput = function() {
  if (
    this.data == null ||
    this.data.length == 0 ||
    this.bounds.time_viewbox_min == null ||
    this.bounds.time_viewbox_max == null
  )
    throw "Bad values in updateOutput, in " + this.name;

  this.output_lag = this.output;

  if (this.data.length < 3) {
    this.output = this.data;
    return;
  }

  let lower = 0;
  let upper = this.data.length;

  if (this.data[0].time < this.bounds.time_viewbox_min) {
    for (let i = 0; i < this.data.length - 1; i++) {
      if (
        this.data[i].time < this.bounds.time_viewbox_min &&
        this.data[i + 1].time >= this.bounds.time_viewbox_min
      ) {
        lower = i;
        break;
      }
    }
  }

  for (let i = lower; i < this.data.length - 1; i++) {
    if (
      this.data[i].time <= this.bounds.time_viewbox_max &&
      this.data[i + 1].time > this.bounds.time_viewbox_max
    ) {
      upper = i + 1;
      break;
    }
  }

  this.output = this.data.slice(lower, upper + 1);
};

Location.prototype.norm_output_time = function(time, bounds, box) {
  return (
    ((time - bounds.time_viewbox_min) /
      (bounds.time_viewbox_max - bounds.time_viewbox_min)) *
    box.attr("width")
  );
};

Location.prototype.drawOutput = function(dispatch) {
  if (this.output == null || this.output.length == 0)
    throw "Output is still null, in drawOutput, in " + this.name;

  let this_loc = this;

  let box = this.output_box.select("#" + this_loc.getOutputBoxId());
  let output_lag = box.selectAll("path").data()[0];
  let path = box.selectAll("path").data([this_loc.output]);

  if (path.empty()) {
    let lineFunction = d3
      .line()
      .x(function(d) {
        return this_loc.norm_output_time(
          d.time,
          this_loc.bounds,
          this_loc.output_box
        );
      })
      .y(function(d) {
        return norm_encoder(d.encoder, this_loc.bounds, this_loc.output_box);
      })
      .curve(d3.curveLinear);

    path
      .enter()
      .append("path")
      .style("stroke-width", 1)
      .style("stroke", this_loc.color)
      .style("fill", "none")
      .attr("d", function(d) {
        return lineFunction(d);
      });

    dispatch.call(this_loc.getEventName());
  } else {
    let combined_output = this.getSuperSet(output_lag, this.output);

    let src_min = combined_output.indexOf(output_lag[0]);
    let src_max = combined_output.indexOf(output_lag[output_lag.length - 1]);
    let dst_min = combined_output.indexOf(this.output[0]);
    let dst_max = combined_output.indexOf(this.output[this.output.length - 1]);

    let output_box_width = this_loc.output_box.attr("width");

    path
      .transition()
      .duration(this_loc.DURATION)
      .attrTween("d", function() {
        return function(t) {
          let lower = Math.round(src_min - t * (src_min - dst_min));
          let upper = Math.round(src_max - t * (src_max - dst_max));
          let subset = combined_output.slice(lower, upper + 1);

          if (subset.length > 1000) {
            let sampleRate = Math.floor(subset.length / 1000);
            subset = subset.filter(function(d, i) {
              return i % sampleRate == 0;
            });
          }

          lower =
            this_loc.bounds.time_viewbox_lag_min -
            t *
              (this_loc.bounds.time_viewbox_lag_min -
                this_loc.bounds.time_viewbox_min);
          upper =
            this_loc.bounds.time_viewbox_lag_max -
            t *
              (this_loc.bounds.time_viewbox_lag_max -
                this_loc.bounds.time_viewbox_max);

          let lineFunction = d3
            .line()
            .x(function(d) {
              return ((d.time - lower) / (upper - lower)) * output_box_width;
            })
            .y(function(d) {
              return norm_encoder(
                d.encoder,
                this_loc.bounds,
                this_loc.output_box
              );
            })
            .curve(d3.curveLinear);

          return lineFunction(subset);
        };
      })
      .on("end", function() {
        dispatch.call(this_loc.getEventName());
      });
  }
};

Location.prototype.getSuperSet = function(data_a, data_b) {
  if (data_a[0].time > data_b[0].time) {
    let tmp = data_a;
    data_a = data_b;
    data_b = tmp;
  }

  if (data_a[data_a.length - 1].time > data_b[data_b.length - 1].time) {
    data_b = data_a;
  }

  let start = this.data.indexOf(data_a[0]);
  let end = this.data.indexOf(data_b[data_b.length - 1]);

  return this.data.slice(start, end + 1);
};


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

  // can use .transition().duration(0).on("end", function() { ... })
  // to execute something after draw has been completed
};

CoastLine.prototype.draw_text = function() {
  let this_class = this;

  let actually_draw_text = function(text_width) {
    let offset_x = -24;
    let offset_y = 5;
    let rect_pad = 8;

    this_class.box
      .select("#" + this_class.getTextBoxId())
      .selectAll("circle")
      .data(this_class.locations)
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

    this_class.box
      .select("#" + this_class.getTextBoxId())
      .selectAll("rect")
      .data(this_class.locations)
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
        return text_width[i] + rect_pad * 2;
      })
      .attr("height", function(d) {
        return 20 + rect_pad;
      })
      .attr("fill", "white")
      .attr("fill-opacity", 0.8)
      .attr("stroke", function(d) {
        return d.color;
      })
      .attr("stroke-width", 1)
      .classed("cursor-pointer", true);

    this_class.box
      .select("#" + this_class.getTextBoxId())
      .selectAll("text")
      .data(this_class.locations)
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
      .classed("cursor-pointer", true)
      .on("click", function(d, i) {
        let hidden = d.toggleHide();
        if (hidden) {
          d3.select(this)
            .style("fill", "grey")
            .style("text-decoration", "line-through");
        } else {
          d3.select(this)
            .style("fill", "black")
            .style("text-decoration", "none");
        }
      })
  };

  let text_width = [];
  this.box
    .selectAll("text")
    .data(this_class.locations)
    .enter()
    .append("text")
    .text(function(d) {
      return d.name;
    })
    .each(function(d, i) {
      text_width.push(this.getComputedTextLength());
      this.remove();
      if (i + 1 == this_class.locations.length) {
        actually_draw_text(text_width);
      }
    });
};


  function LocationScales(bounds, sample_box, output_Y_box, output_X_box) {
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.output_Y_box = output_Y_box;
  this.output_X_box = output_X_box;
  this.TEXT_OFFSET = 5;
  this.DURATION = 400;

  this.sample_box.append("g").attr("id", this.getSampleWeeksId());
  this.sample_box.append("g").attr("id", this.getSampleDaysId());
  this.sample_box.append("g").attr("id", this.getSampleDayTicksId());
}

LocationScales.prototype.getSampleWeeksId = function() {
  return "id_sample_weeks_scale";
};

LocationScales.prototype.getSampleDaysId = function() {
  return "id_sample_days_scale";
};

LocationScales.prototype.getSampleDayTicksId = function() {
  return "id_sample_day_ticks_scale";
};

LocationScales.prototype.getOutputEncoderId = function() {
  return "id_output_encoder_scale";
};

LocationScales.prototype.drawSample = function() {
  let one_day = 1000 * 60 * 60 * 24;
  let one_week = one_day * 7;

  let x;
  let this_scale = this;

  let weeks = [];
  x = this.bounds.time_min;
  while (x <= this.bounds.time_max) {
    weeks.push({ name: moment.utc(x).format("MMM D"), value: x });
    x += one_week;
  }
  weeks[0].name = "";
  weeks.push({ name: "", value: x });

  if (weeks.length === 8) {
    weeks[2].name = weeks[2].name.slice(0, 3);
    weeks[3].name = weeks[3].name.slice(4);
    weeks[4].name = weeks[4].name.slice(4);
    weeks[5].name = weeks[5].name.slice(4);
    weeks[6].name = weeks[6].name.slice(4);
  }

  let enter_weeks = this.sample_box
    .select("#" + this.getSampleWeeksId())
    .selectAll("line")
    .data(weeks)
    .enter();

  enter_weeks
    .append("line")
    .attr("x1", function(d) {
      return SampleSelector.norm_time(
        d.value + ZONE_OFFSET,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y1", 0)
    .attr("x2", function(d) {
      return SampleSelector.norm_time(
        d.value + ZONE_OFFSET,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y2", 20)
    .attr("stroke", "black")
    .style("opacity", 0.5);

  enter_weeks
    .append("text")
    .text(function(d) {
      return d.name;
    })
    .attr("x", function(d) {
      return (
        SampleSelector.norm_time(
          d.value + ZONE_OFFSET,
          this_scale.bounds,
          this_scale.sample_box
        ) + this_scale.TEXT_OFFSET
      );
    })
    .attr("y", 18)
    .style("opacity", 0.5);
};

LocationScales.prototype.drawDayTicks = function(innerLeft, innerRight) {
  innerLeft = SampleSelector.reverse_norm_time(
    innerLeft,
    this.bounds,
    this.sample_box
  );
  innerRight = SampleSelector.reverse_norm_time(
    innerRight,
    this.bounds,
    this.sample_box
  );

  let one_day = 1000 * 60 * 60 * 24;
  let one_week = one_day * 7;

  let x;
  let this_scale = this;

  let ticks = [];
  x = innerLeft - (innerLeft % one_day);
  while (x < innerRight) {
    if (this.bounds.time_min <= x && x < this.bounds.time_min + one_week) {
      ticks.push({ name: moment.utc(x).format("ddd")[0], value: x });
    } else {
      ticks.push({ name: "", value: x });
    }
    x += one_day;
  }
  if (this.bounds.time_min <= x && x < this.bounds.time_min + one_week) {
    ticks.push({ name: moment.utc(x).format("ddd")[0], value: x });
  } else {
    ticks.push({ name: "", value: x });
  }

  let tick_box_lines = this.sample_box
    .select("#" + this.getSampleDayTicksId())
    .selectAll("line")
    .data(ticks, function(d) {
      return d.value;
    });

  tick_box_lines
    .enter()
    .append("line")
    .attr("x1", function(d) {
      return SampleSelector.norm_time(
        d.value + ZONE_OFFSET,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y1", 0)
    .attr("x2", function(d) {
      return SampleSelector.norm_time(
        d.value + ZONE_OFFSET,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y2", 0)
    .attr("stroke", "black")
    .style("opacity", function(d) {
      if (d.value % one_week === this_scale.bounds.time_min % one_week) {
        return 0;
      } else {
        return 0.5;
      }
    })
    .transition()
    .duration(this_scale.DURATION)
    .attr("y2", 5);

  tick_box_lines.exit().each(function() {
    if (!d3.select(this).classed("in_transition")) {
      d3.select(this)
        .classed("in_transition", true)
        .transition()
        .duration(this_scale.DURATION)
        .attr("y2", 0)
        .remove();
    }
  });

  if (ticks[ticks.length - 1].name !== "") {
    ticks.pop();
  }

  let tick_box_text = this.sample_box
    .select("#" + this.getSampleDayTicksId())
    .selectAll("text")
    .data(ticks, function(d) {
      return d.value;
    });

  tick_box_text
    .enter()
    .append("text")
    .text(function(d) {
      return d.name;
    })
    .attr("x", function(d) {
      return (
        SampleSelector.norm_time(
          d.value + ZONE_OFFSET + one_day / 2,
          this_scale.bounds,
          this_scale.sample_box
        ) -
        this.getBBox().width / 2
      );
    })
    .attr("y", 18)
    .style("opacity", 0)
    .transition()
    .duration(this_scale.DURATION)
    .style("opacity", 0.5);

  tick_box_text.exit().each(function() {
    if (!d3.select(this).classed("in_transition")) {
      d3.select(this)
        .classed("in_transition", true)
        .transition()
        .duration(this_scale.DURATION)
        .style("opacity", 0)
        .remove();
    }
  });
};

LocationScales.prototype.drawYoutput = function() {
  let x;
  let this_scale = this;

  data = [];
  x = this.bounds.encoder_min;
  while (x <= this.bounds.encoder_max) {
    data.push(x);
    x += 1;
  }

  this.output_Y_box.selectAll("line").remove();
  this.output_Y_box.selectAll("text").remove();

  this.output_Y_box
    .append("text")
    .text("metres")
    .attr("x", 30)
    .attr("y", this_scale.output_Y_box.attr("height"))
    .style("opacity", 0.5)
    .attr("transform", function() {
      return (
        "rotate(-90," +
        d3.select(this).attr("x") +
        "," +
        d3.select(this).attr("y") +
        ")"
      );
    });

  let enter_encoder = this.output_Y_box
    .selectAll("line")
    .data(data)
    .enter();

  enter_encoder
    .append("line")
    .attr("x1", 40)
    .attr("y1", function(d) {
      return norm_encoder(d, this_scale.bounds, this_scale.output_Y_box);
    })
    .attr("x2", 50)
    .attr("y2", function(d) {
      return norm_encoder(d, this_scale.bounds, this_scale.output_Y_box);
    })
    .attr("stroke", "black")
    .style("opacity", 0.5);

  enter_encoder
    .append("text")
    .text(function(d, i) {
      if (i === 0 || i % 2 !== 1) {
        return "";
      } else {
        return d;
      }
    })
    .attr("x", function() {
      return 40 - this.getBBox().width - this_scale.TEXT_OFFSET;
    })
    .attr("y", function(d) {
      return (
        norm_encoder(d, this_scale.bounds, this_scale.output_Y_box) +
        this.getBBox().height / 3
      );
    })
    .style("opacity", 0.5);
};

LocationScales.prototype.removeXoutput = function() {
  this.output_X_box.selectAll("line").remove();
};

LocationScales.prototype.drawXoutput = function() {
  let one_hour = 1000 * 60 * 60;
  let one_day = 1000 * 60 * 60 * 24;
  let one_week = one_day * 7;

  let x;
  let this_scale = this;

  let ticks = [];
  if (this.bounds.time_viewbox_min % one_day < one_hour) {
    x = this.bounds.time_viewbox_min;
  } else {
    x =
      this.bounds.time_viewbox_min -
      (this.bounds.time_viewbox_min % one_day);
  }
  while (x < this.bounds.time_viewbox_max + one_hour) {
    if (x % one_week === this_scale.bounds.time_min % one_week) {
      ticks.push({ value: x, length: 20 });
    } else {
      ticks.push({ value: x, length: 8 });
    }
    x += one_day;
  }
  if (x % one_week === this_scale.bounds.time_min % one_week) {
    ticks.push({ value: x, length: 20 });
  } else {
    ticks.push({ value: x, length: 8 });
  }

  let tick_box = this.output_X_box.selectAll("line").data(ticks, function(d) {
    return d.value;
  });

  tick_box
    .enter()
    .append("line")
    .attr("x1", function(d) {
      return (
        ((d.value + ZONE_OFFSET - this_scale.bounds.time_viewbox_min) /
          (this_scale.bounds.time_viewbox_max -
            this_scale.bounds.time_viewbox_min)) *
        this_scale.output_X_box.attr("width")
      );
    })
    .attr("y1", 0)
    .attr("x2", function(d) {
      return (
        ((d.value + ZONE_OFFSET - this_scale.bounds.time_viewbox_min) /
          (this_scale.bounds.time_viewbox_max -
            this_scale.bounds.time_viewbox_min)) *
        this_scale.output_X_box.attr("width")
      );
    })
    .attr("y2", function(d) {
      return d.length;
    })
    .attr("stroke", "black")
    .style("opacity", 0.5);
};


  function MoonNormal(box, bounds, locations) {
  this.box = box;
  this.locations = locations;
  this.time = null;
  this.time_max = bounds.time_max;
  this.time_min = bounds.time_min;
  this.fake_earth_r = 20;
  this.fake_moon_r = 10;
}

MoonNormal.prototype.setTime = function(time) {
  this.time = time;
};

MoonNormal.prototype.update = function(time) {
  this.time = time;
  this.draw();
};

MoonNormal.prototype.draw = function() {
  let box = this.box;
  let this_class = this;
  let data;

  let orbit_r = this_class.box.attr("width") / 2 - this.fake_moon_r - 2;

  let earth_x = this_class.box.attr("width") / 2;
  let earth_y = this_class.box.attr("height") / 2;

  let drawOrbit = function() {
    data = [earth_x, earth_y, orbit_r];
    box
      .selectAll("#moon-normal-orbit")
      .data([data])
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2];
      })
      .enter()
      .append("circle")
      .attr("id", "moon-normal-orbit")
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2];
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("fill", "none");
  };

  let drawEarth = function() {
    data = [
      this_class.box.attr("width") / 2,
      this_class.box.attr("height") / 2,
      this_class.fake_earth_r
    ];
    box
      .selectAll("#moon-normal-earth")
      .data([data])
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2];
      })
      .enter()
      .append("circle")
      .attr("id", "moon-normal-earth")
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2];
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("fill", "none");
    box
      .selectAll("#moon-normal-earth-shadow")
      .data([data])
      .attr("d", function(d) {
        return "M" + d[0] + "," + (d[1] + d[2]) + " a1,1 0 0 0 0,-" + d[2] * 2;
      })
      .enter()
      .append("path")
      .attr("id", "moon-normal-earth-shadow")
      .attr("d", function(d) {
        return "M" + d[0] + "," + (d[1] + d[2]) + " a1,1 0 0 0 0,-" + d[2] * 2;
      })
      .attr("fill", "black")
      .attr("stroke", "none");
  };

  let drawSliver = function() {
    // https://www.esrl.noaa.gov/gmd/grad/solcalc/
    // solar noon in Seattle on September 14, 2019 was at 12:04:51 local time
    // -> at a little past 12:05 (because Vancouver is west from Seattle)
    //    Vancouver is facing directly towards the sun
    let reference_solar_noon =
      moment.utc("2019-09-14 12:05", "YYYY-MM-DD H:mm").valueOf() + ZONE_OFFSET;

    // September 15, 2019 was at 12:04:30
    // September 13, 2019 was at 12:05:12
    // August 25, 2019 was at 12:11:22
    // -> solar noon changes by roughly 21 seconds per day
    let one_solar_day = 1000 * 60 * 60 * 24 - 1000 * 21;
    let rotations = (this_class.time - reference_solar_noon) / one_solar_day;

    // the sun is off the left of the screen, so solar noon occurs at the 9 o'clock position
    let slice_position = Math.PI * (1 / 2) + rotations * Math.PI * 2;

    let small_r = this_class.fake_earth_r + 10;
    let larger_r = small_r + 60;
    let angle = 8 * (Math.PI / 180); // Prince Rupert is about 8 degrees west of Vancouver
    let half_arc = 20 * (Math.PI / 180);

    let almost_location_length = this_class.locations.length - 1;
    data = this_class.locations.map(function(elem, i) {
      return [
        [
          earth_x -
            small_r *
              Math.sin(slice_position - angle * (i / almost_location_length)),
          earth_y -
            small_r *
              Math.cos(slice_position - angle * (i / almost_location_length))
        ],
        [
          earth_x -
            larger_r *
              Math.sin(slice_position - angle * (i / almost_location_length)),
          earth_y -
            larger_r *
              Math.cos(slice_position - angle * (i / almost_location_length))
        ]
      ];
    });

    box
      .selectAll(".moon-normal-slice-line")
      .data(data)
      .attr("x1", function(d) {
        return d[0][0];
      })
      .attr("y1", function(d) {
        return d[0][1];
      })
      .attr("x2", function(d) {
        return d[1][0];
      })
      .attr("y2", function(d) {
        return d[1][1];
      })
      .enter()
      .append("line")
      .attr("class", "moon-normal-slice-line")
      .attr("x1", function(d) {
        return d[0][0];
      })
      .attr("y1", function(d) {
        return d[0][1];
      })
      .attr("x2", function(d) {
        return d[1][0];
      })
      .attr("y2", function(d) {
        return d[1][1];
      })
      .attr("stroke", function(d, i) {
        return this_class.locations[i].color;
      })
      .attr("stroke-width", 3);

    data = [
      [
        earth_x - small_r * Math.sin(slice_position + half_arc),
        earth_y - small_r * Math.cos(slice_position + half_arc)
      ],
      [
        earth_x - small_r * Math.sin(slice_position - angle - half_arc),
        earth_y - small_r * Math.cos(slice_position - angle - half_arc)
      ]
    ];

    box
      .selectAll("#moon-normal-slice-arc")
      .data([data])
      .attr("d", function(d) {
        return (
          "M" +
          d[0][0] +
          "," +
          d[0][1] +
          " a" +
          small_r +
          "," +
          small_r +
          " 0 0 1 " +
          (d[1][0] - d[0][0]) +
          "," +
          (d[1][1] - d[0][1])
        );
      })
      .enter()
      .append("path")
      .attr("id", "moon-normal-slice-arc")
      .attr("d", function(d) {
        return (
          "M" +
          d[0][0] +
          "," +
          d[0][1] +
          " A" +
          small_r +
          "," +
          small_r +
          " 0 0 1 " +
          d[1][0] +
          "," +
          d[1][1]
        );
      })
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1);
  };

  let drawMoon = function() {
    // september 14, 4:35 UTC was a full moon
    let reference_full_moon = moment
      .utc("2019-09-14 4:35", "YYYY-MM-DD H:mm")
      .valueOf();

    // the average synodic month is 29.531 days long
    // in August, September, and Octobor, it was closer to 29.68, or roughly 42740 minutes
    let rotations =
      (this_class.time - reference_full_moon) / (42740 * 60 * 1000);

    // the sun is off the left of the screen, so a full moon occurs at the 3 o'clock position
    let moon_position = Math.PI * (3 / 2) + rotations * Math.PI * 2;

    let mx = earth_x - orbit_r * Math.sin(moon_position);
    let my = earth_y - orbit_r * Math.cos(moon_position);

    data = [mx, my, this_class.fake_moon_r];
    box
      .selectAll("#moon-normal-moon-padding")
      .data([data])
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2] + 5;
      })
      .enter()
      .append("circle")
      .attr("id", "moon-normal-moon-padding")
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2] + 5;
      })
      .attr("stroke", "none")
      .attr("fill", "white");
    box
      .selectAll("#moon-normal-moon")
      .data([data])
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2];
      })
      .enter()
      .append("circle")
      .attr("id", "moon-normal-moon")
      .attr("cx", function(d) {
        return d[0];
      })
      .attr("cy", function(d) {
        return d[1];
      })
      .attr("r", function(d) {
        return d[2];
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("fill", "none");
    box
      .selectAll("#moon-normal-moon-shadow")
      .data([data])
      .attr("d", function(d) {
        return "M" + d[0] + "," + (d[1] + d[2]) + " a1,1 0 0 0 0,-" + d[2] * 2;
      })
      .enter()
      .append("path")
      .attr("id", "moon-normal-moon-shadow")
      .attr("d", function(d) {
        return "M" + d[0] + "," + (d[1] + d[2]) + " a1,1 0 0 0 0,-" + d[2] * 2;
      })
      .attr("fill", "black")
      .attr("stroke", "none");
  };

  drawOrbit();
  drawEarth();
  drawSliver();
  drawMoon();
};

MoonNormal.prototype.remove = function() {
  let box = this.box;
  box.selectAll("#moon-normal-moon-padding").remove();
  box.selectAll("#moon-normal-moon").remove();
  box.selectAll("#moon-normal-moon-shadow").remove();
  box.selectAll(".moon-normal-slice-line").remove();
  box.selectAll("#moon-normal-slice-arc").remove();
};


  function MoonSelector(output_box, bounds, moon_box, locations) {
  this.output_box = output_box;
  this.bounds = bounds;
  this.x = this.output_box.attr("width") / 2;
  this.moonNormal = new MoonNormal(moon_box, bounds, locations);

  this.output_box.append("g").attr("id", this.getId());
}

MoonSelector.prototype.getId = function() {
  return "moon_selector_id";
};

MoonSelector.prototype.draw = function() {
  this.moonNormal.update(this.getTime());

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


  // http://romain.vuillemot.net/projects/worldcup14/
// http://mbtaviz.github.io/
// http://marcinignac.com/projects/open-budget/

// kagi chart?

// "orbit of the moon"

// "date" is always a string representing a date, like "2019-01-01 09:45:00"
// "time" is always a date represented in milliseconds

// py -m http.server

// add scales to selection and output

let DEFAULT_FONT_COLOR = "#212529";

$("#svg3")
  .parent()
  .height(
    $("#svg3")
      .parent()
      .width()
  );

let make_loading_svg = function() {
  let svg4 = d3
    .select("#svg4")
    .attr(
      "width",
      $("#svg4")
        .parent()
        .width()
    )
    .attr("height", 20);

  svg4
    .append("text")
    .text("Load Data")
    .attr("x", 0)
    .attr("y", svg4.attr("height") - 8)
    .attr("fill", DEFAULT_FONT_COLOR)
    .classed("cursor-pointer", "true")
    .on("click", function() {
      d3.select(this).on("click", null);
      d3.select(this).remove();
      go(svg4);
    });
};

make_loading_svg();

let go = function(svg4) {
  let loading_rect = svg4
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", svg4.attr("height"))
    .attr("fill", "grey")
    .attr("stroke", "none");

  let loading_lim = svg4
    .append("line")
    .attr("x1", svg4.attr("width") - 1)
    .attr("y1", 0)
    .attr("x2", svg4.attr("width") - 1)
    .attr("y2", svg4.attr("height"))
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  let svg1 = d3
    .select("#svg1")
    .attr(
      "width",
      $("#svg1")
        .parent()
        .width()
    )
    .attr("height", 150);

  let svg2 = d3
    .select("#svg2")
    .attr(
      "width",
      $("#svg2")
        .parent()
        .width()
    )
    .attr("height", 620);

  let svg3 = d3
    .select("#svg3")
    .attr(
      "width",
      $("#svg3")
        .parent()
        .width()
    )
    .attr(
      "height",
      $("#svg3")
        .parent()
        .width()
    );

  let svg5 = d3
    .select("#svg5")
    .attr(
      "width",
      $("#svg5")
        .parent()
        .width()
    )
    .attr(
      "height",
      $("#svg5")
        .parent()
        .width()
    );

  let location_bounds = new Bounds();
  let sample_box = svg1.append("g");
  let sample_box_margin = new Margin(20, 50, 30, 50);
  sample_box_margin.applyTo(
    sample_box,
    svg1.attr("width"),
    svg1.attr("height")
  );
  let sample_scale_box = svg1.append("g");
  let sample_scale_box_margin = new Margin(120, 50, 0, 50);
  sample_scale_box_margin.applyTo(
    sample_scale_box,
    svg1.attr("width"),
    svg1.attr("height")
  );
  let output_box = svg2.append("g");
  let output_box_margin = new Margin(0, 50, 20, 50);
  output_box_margin.applyTo(
    output_box,
    svg2.attr("width"),
    svg2.attr("height")
  );
  let output_Y_scale_box = svg2.append("g");
  let output_Y_scale_box_margin = new Margin(0, 0, 20, 0);
  output_Y_scale_box_margin.applyTo(
    output_Y_scale_box,
    50,
    svg2.attr("height")
  );
  let output_X_scale_box = svg2.append("g");
  let output_X_scale_box_margin = new Margin(600, 50, 0, 50);
  output_X_scale_box_margin.applyTo(
    output_X_scale_box,
    svg2.attr("width"),
    svg2.attr("height")
  );

  /*
  coastline_coors
  Prince Rupert: 550, 125
  Bella Bella: 550, 290 - 300
  Tofino: 525, 500 - 510
  Vancouver: 630, 610
  */

  let locations = [
    new Location(
      "Vancouver",
      "Vancouver",
      "#58a7e4",
      location_bounds,
      sample_box,
      output_box,
      [svg3.attr("width") / 1.0531746, svg3.attr("width") / 1.087704918]
    ),
    new Location(
      "Tofino",
      "Tofino",
      "#3a6cc0",
      location_bounds,
      sample_box,
      output_box,
      [svg3.attr("width") / 1.26380952, svg3.attr("width") / 1.31386]
    ),
    new Location(
      "Bella Bella",
      "Bella_Bella",
      "#76cca2",
      location_bounds,
      sample_box,
      output_box,
      [svg3.attr("width") / 1.20636364, svg3.attr("width") / 2.5037735849]
    ),
    new Location(
      "Prince Rupert",
      "Prince_Rupert",
      "#45716e",
      location_bounds,
      sample_box,
      output_box,
      [svg3.attr("width") / 1.20636364, svg3.attr("width") / 5.43852459]
    )
  ];

  let files = [
    "08-18.csv",
    "08-25.csv",
    "09-01.csv",
    "09-08.csv",
    "09-15.csv",
    "09-22.csv",
    "09-29.csv"
  ];

  let update_loading_rect = (function() {
    let count = 0;
    let total = locations.length * files.length;
    return function() {
      count += 1;
      loading_rect.attr("width", (count / total) * svg4.attr("width"));
      if (count == total) {
        loading_rect.remove();
        loading_lim.remove();
      }
    };
  })();

  let location_dispatch = d3.dispatch(
    ...locations.map(loc => {
      return loc.getEventName();
    })
  );

  let loadData_dispatch = d3.dispatch(
    ...locations.map(loc => {
      return loc.getEventName();
    })
  );

  let coastLine = new CoastLine(locations, svg3);
  let coastLine_dispatch = d3.dispatch(coastLine.getEventName());
  coastLine_dispatch.on(coastLine.getEventName(), function() {
    coastLine.draw();
  });
  coastLine.readData(coastLine_dispatch);

  let draw_locations = function() {
    locations.forEach(function(loc) {
      loc.updateBounds();
    });

    locations.forEach(function(loc) {
      loc.drawSample();
    });

    let locationScales = new LocationScales(
      location_bounds,
      sample_scale_box,
      output_Y_scale_box,
      output_X_scale_box
    );
    locationScales.drawSample();

    let sampleSelector = new SampleSelector(
      location_bounds,
      sample_box,
      locationScales
    );
    sampleSelector.updateBounds();
    sampleSelector.draw();

    let moonSelector = new MoonSelector(output_box, location_bounds, svg5, locations);

    let barrier;

    locations.forEach(function(loc, i) {
      location_dispatch.on(loc.getEventName(), function() {
        barrier[i] = true;
        if (
          barrier.every(e => {
            return e;
          })
        ) {
          sampleSelector.updateBounds();
          locationScales.drawXoutput();
          moonSelector.draw();
        }
      });
    });

    d3.select("#updateOutput")
      .classed("hide", false)
      .on("click", function() {
        barrier = locations.map(function() {
          return false;
        });

        locationScales.drawYoutput();
        locationScales.removeXoutput();
        moonSelector.remove();

        locations.forEach(function(loc) {
          loc.updateOutput();
          loc.drawOutput(location_dispatch);
        });
      });
  };

  locations.forEach(function(loc) {
    loadData_dispatch.on(loc.getEventName(), function(arg) {
      //console.log(loc.name + ", " + arg);
      update_loading_rect();
    });
    location_dispatch.on(loc.getEventName(), function() {
      let all_done = true;

      locations.forEach(function(another_loc) {
        if (!another_loc.done_read) {
          all_done = false;
        }
      });

      if (all_done) {
        locations.forEach(function(loc) {
          location_dispatch.on(loc.getEventName(), null);
        });
        coastLine.draw_text();
        draw_locations();
      }
    });
    loc.readData(files, location_dispatch, loadData_dispatch);
  });
};

});