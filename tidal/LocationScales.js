function LocationScales(bounds, sample_box, output_box) {
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.output_box = output_box;

  this.sample_box.append("g").attr("id", this.getSampleWeeksId());
  this.sample_box.append("g").attr("id", this.getSampleDaysId());
  
  this.output_box.append("g").attr("id", this.getOutputEncoderId());
}

LocationScales.prototype.getSampleWeeksId = function() {
  return "id_sample_weeks_scale";
};

LocationScales.prototype.getSampleDaysId = function() {
  return "id_sample_days_scale";
};

LocationScales.prototype.getOutputEncoderId = function() {
  return "id_output_encoder_scale";
};

LocationScales.prototype.drawSample = function() {
  let four_hours = 1000 * 60 * 60 * 4;
  let two_minutes = 1000 * 60 * 2;
  let one_day = 1000 * 60 * 60 * 24;
  let one_week = one_day * 7;

  let x;

  x = this.bounds.time_min;

  let weeks = [];
  x = this.bounds.time_min;
  while (x <= this.bounds.time_max) {
    weeks.push({ name: moment(x).format("MMM D"), value: x, opacity: 1 });
    x += one_week;
  }
  weeks.push({ name: "", value: x, opacity: 1 });
  weeks.push({
    name: moment("October 1, 2019", "MMMM D, YYYY").format("MMM D"),
    value: parseFloat(moment("October 1, 2019", "MMMM D, YYYY").valueOf()),
    opacity: 0.5
  });

  let this_scale = this;

  let enter_weeks = this.sample_box
    .select("#" + this.getSampleWeeksId())
    .selectAll("line")
    .data(weeks)
    .enter();

  enter_weeks
    .append("line")
    .attr("x1", function(d) {
      return SampleSelector.norm_time(
        d.value,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y1", 0)
    .attr("x2", function(d) {
      return SampleSelector.norm_time(
        d.value,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y2", function(d, i) {
      if (i == 0) {
        return 40;
      } else {
        return 20;
      }
    })
    .attr("stroke", "black")
    .style("opacity", function(d) {
      return d.opacity;
    });

  enter_weeks
    .append("text")
    .text(function(d) {
      return d.name;
    })
    .attr("x", function(d) {
      return (
        SampleSelector.norm_time(
          d.value,
          this_scale.bounds,
          this_scale.sample_box
        ) + 5
      );
    })
    .attr("y", function(d, i) {
      if (i == 0) {
        return 38;
      } else {
        return 18;
      }
    })
    .style("opacity", function(d) {
      return d.opacity;
    });

  let first_week = [];
  x = this.bounds.time_min;
  first_week.push({ name: moment(x).format("ddd")[0], value: x });
  first_week.push({ name: moment((x += one_day)).format("ddd")[0], value: x });
  first_week.push({ name: moment((x += one_day)).format("ddd")[0], value: x });
  first_week.push({ name: moment((x += one_day)).format("ddd")[0], value: x });
  first_week.push({ name: moment((x += one_day)).format("ddd")[0], value: x });
  first_week.push({ name: moment((x += one_day)).format("ddd")[0], value: x });
  first_week.push({ name: moment((x += one_day)).format("ddd")[0], value: x });

  let enter_days = this.sample_box
    .select("#" + this.getSampleDaysId())
    .selectAll("line")
    .data(first_week)
    .enter();

  enter_days
    .append("line")
    .attr("x1", function(d) {
      return SampleSelector.norm_time(
        d.value,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y1", 0)
    .attr("x2", function(d) {
      return SampleSelector.norm_time(
        d.value,
        this_scale.bounds,
        this_scale.sample_box
      );
    })
    .attr("y2", 20)
    .attr("stroke", "black")
    .style("opacity", 0.5);

  enter_days
    .append("text")
    .text(function(d) {
      return d.name;
    })
    .attr("x", function(d) {
      return (
        SampleSelector.norm_time(
          d.value,
          this_scale.bounds,
          this_scale.sample_box
        ) + 5
      );
    })
    .attr("y", 18)
    .style("opacity", 0.5);
};

/*
let norm_encoder = function(encoder, bounds, box) {
  return (
    box.attr("height") -
    ((encoder - bounds.encoder_min) /
      (bounds.encoder_max - bounds.encoder_min)) *
      box.attr("height")
  );
};
*/

LocationScales.prototype.drawXoutput = function() {
    console.log("here");

  let x = this.bounds.encoder_min;
  data = [];

  while (x <= this.bounds.encoder_max) {
    data.push(x);
    x += 1;
  }

  let this_scale = this;

  let enter_encoder = this.output_box
    .select("#" + this.getOutputEncoderId())
    .selectAll("line")
    .data(data)
    .enter();

  enter_encoder
    .append("line")
    .attr("x1", 0)
    .attr("y1", function(d) {
      return norm_encoder(d, this_scale.bounds, this_scale.output_box);
    })
    .attr("x2", 20)
    .attr("y2", function(d) {
      return norm_encoder(d, this_scale.bounds, this_scale.output_box);
    })
    .attr("stroke", "black")
    .style("opacity", 0.5);
};

LocationScales.prototype.drawYoutput = function() {};
