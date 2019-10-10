function Location(name, dir, color, bounds, sample_box, output_box) {
  this.name = name;
  this.dir = dir;
  this.color = color;
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.output_box = output_box;
  this.data = [];
  this.output = [];
  this.output_lag = [];
  this.sample = [];
  this.done_read = false;
  this.DURATION = 1000;

  this.sample_box.append("g").attr("id", this.getSampleBoxId());
  this.output_box.append("g").attr("id", this.getOutputBoxId());
}

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

  local_encoder_min = Math.floor(local_encoder_min);
  local_encoder_max = Math.ceil(local_encoder_max);

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

Location.prototype.filterRead = function(read) {
  if (read == null || read.length == 0)
    throw "Read is null, in filterRead, in " + this.name;

  read = read.map(function(row) {
    row.time = Date.parse(row.time);
    return row;
  });

  return read;
};

Location.prototype.readData = function(files, dispatch) {
  if (files == null || files.length == 0 || dispatch == null)
    throw "Bad input to readData, in " + this.name;

  let this_loc = this;

  let barrier = files.map(function() {
    return false;
  });

  files.forEach(function(file, i) {
    d3.csv("datasets/clean/" + this_loc.dir + "/" + file)
      .then(function(read) {
        read = this_loc.filterRead(read);
        this_loc.data = this_loc.data.concat(read);
        barrier[i] = true;
        if (
          barrier.every(e => {
            return e;
          })
        ) {
          this_loc.data = this_loc.sortData(this_loc.data);
          this_loc.updateSample();
          this_loc.done_read = true;
          dispatch.call(this_loc.getEventName());
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  });
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

Location.prototype.drawOutput = function() {
  if (this.output == null || this.output.length == 0)
    throw "Output is still null, in drawOutput, in " + this.name;

  let this_loc = this;

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

  let box = this.output_box.select("#" + this_loc.getOutputBoxId());
  let output_lag = box.selectAll("path").data()[0];
  let path = box.selectAll("path").data([this_loc.output]);

  if (path.empty()) {
    // just straight draw this.output

    path
      .enter()
      .append("path")
      .style("stroke-width", 1)
      .style("stroke", this_loc.color)
      .style("fill", "none")
      .attr("d", function(d) {
        return lineFunction(d);
      });
  } else if (
    this.bounds.time_viewbox_lag_min <= this.bounds.time_viewbox_min &&
    this.bounds.time_viewbox_lag_max >= this.bounds.time_viewbox_max
  ) {
    // output_lag is a superset of this.output

    let coef =
      (this.bounds.time_viewbox_lag_max - this.bounds.time_viewbox_lag_min) /
      (this.bounds.time_viewbox_max - this.bounds.time_viewbox_min);
    let move =
      ((this.output_box.attr("width") *
        (this.bounds.time_viewbox_min - this.bounds.time_viewbox_lag_min)) /
        (this.bounds.time_viewbox_lag_max - this.bounds.time_viewbox_lag_min)) *
      coef;
    move = -1 * move;

    box
      .attr("transform", "translate(0) scale(1, 1)")
      .transition()
      .duration(this_loc.DURATION)
      .attr("transform", "translate(" + move + ") scale(" + coef + ", 1)")
      .transition()
      .duration(0)
      .attr("transform", "translate(0) scale(1, 1)");

    path
      .transition()
      .duration(0)
      .delay(this_loc.DURATION)
      .attr("d", function(d) {
        return lineFunction(d);
      });
  } else {
    let combined_output = this.getSuperSet(output_lag, this.output);

    let coef =
      (this.bounds.time_viewbox_max - this.bounds.time_viewbox_min) /
      (this.bounds.time_viewbox_lag_max - this.bounds.time_viewbox_lag_min);
    let move =
      (this.output_box.attr("width") *
        (this.bounds.time_viewbox_lag_min - this.bounds.time_viewbox_min)) /
      (this.bounds.time_viewbox_lag_max - this.bounds.time_viewbox_lag_min);
    move = -1 * move;

    box
      .attr("transform", "translate(" + move + ") scale(" + coef + ", 1)")
      .transition()
      .duration(this_loc.DURATION)
      .attr("transform", "translate(0) scale(1, 1)");

    path = box.selectAll("path").data([combined_output]);

    path
      .attr("d", function(d) {
        return lineFunction(d);
      })
      .transition()
      .delay(this_loc.DURATION)
      .on("end", function() {
        box
          .selectAll("path")
          .data([this_loc.output])
          .attr("d", function(d) {
            return lineFunction(d);
          });
      });
  }
};

Location.prototype.getSuperSet = function(data_a, data_b) {
  if (data_a[0].time > data_b[0].time) {
    let tmp = data_a;
    data_a = data_b;
    data_b = tmp;
  }

  let start = this.data.indexOf(data_a[0]);
  let end = this.data.indexOf(data_b[data_b.length - 1]);

  return this.data.slice(start, end + 1);
};
