function Location(name, dir, color, bounds, sample_box, output_box) {
  this.name = name;
  this.dir = dir;
  this.color = color;
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.output_box = output_box;
  this.data = [];
  this.output = [];
  this.sample = [];
  this.done_read = false;

  //if (!this.box.attr("height") || !this.box.attr("width")) return false;

  this.sample_box.append("g").attr("id", this.getSampleBoxId());
}

Location.prototype.getSampleBoxId = function() {
  return "id_" + this.dir.toLowerCase() + "_sampleBox";
};

Location.prototype.getEventName = function() {
  return "event_" + this.dir.toLowerCase();
};

Location.prototype.sortData = function(data) {
  if (data == null || data.length == 0)
    throw "Data is null, in sortData, in " + this.name;

  data = data.sort(function(a, b) {
    if (Date.parse(a.time) < Date.parse(b.time)) {
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
          this_loc.sortData(this_loc.data);
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

Location.prototype.updateOutput = function() {
  if (
    this.data == null ||
    this.data.length == 0 ||
    bounds.time_viewbox_min == null ||
    bounds.time_viewbox_max == null
  )
    throw "Bad values in updateOutput, in " + this.name;

  let this_loc = this;

  this.output = this.data.filter(function(d) {
    if (
      this_loc.bounds.time_viewbox_min <= d.time &&
      d.time <= this_loc.bounds.time_viewbox_max
    ) {
      return true;
    } else {
      return false;
    }
  });

  this.sortData(this.output);
};

Location.prototype.updateSample = function(sampleRate = 20) {
  if (this.data == null || this.data.length == 0)
    throw "Data is still null, in updateSample, in " + this.name;

  this.sample = this.data.filter(function(d, i) {
    return i % sampleRate == 0;
  });

  this.sample.push(this.data[this.data.length - 1]);

  this.sortData(this.sample);
};

Location.prototype.drawSample = function() {
  if (this.sample == null || this.sample.length == 0)
    throw "Sample is still null, in drawSample, in " + this.name;

  let this_loc = this;

  let lineFunction = d3
    .line()
    .x(function(d) {
      return SampleSelector.norm_time(d.time, this_loc.bounds, this_loc.sample_box);
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
