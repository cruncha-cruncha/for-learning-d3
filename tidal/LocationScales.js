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
