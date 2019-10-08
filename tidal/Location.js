function Location(name, dir, color, bounds, box) {
    this.name = name;
    this.dir = dir;
    this.color = color;
    this.bounds = bounds;
    this.box = box;
    this.data = [];
    this.output = [];
    this.done_read = false;

    if (!this.box.attr("height") || !this.box.attr("width")) return false;

    this.box.append("g").attr("id", this.getId());
  }

  Location.prototype.getId = function() {
    return "id_" + this.dir.toLowerCase();
  };

  Location.prototype.getEventName = function() {
    return "event_" + this.dir.toLowerCase();
  };

  Location.prototype.sortData = function(data) {
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
    read = read.map(function(row) {
      row.time = Date.parse(row.time);
      return row;
    });

    return read;
  };

  Location.prototype.readData = function(files, dispatch) {
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
    this.bounds.time_viewbox_min = time_viewbox_min;
    this.bounds.time_viewbox_max = time_viewbox_max;
  };

  Location.prototype.updateOutput = function() {
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

  Location.prototype.draw = function(data = this.output) {
    let this_loc = this;

    let lineFunction = d3
      .line()
      .x(function(d) {
        return norm_time(d.time, this_loc.bounds, this_loc.box);
      })
      .y(function(d) {
        return norm_encoder(d.encoder, this_loc.bounds, this_loc.box);
      })
      .curve(d3.curveLinear);

    let path = this.box
      .select("#" + this_loc.getId())
      .selectAll("path")
      .data([data]);
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