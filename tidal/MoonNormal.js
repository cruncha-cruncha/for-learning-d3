function MoonNormal(box, bounds) {
  this.box = box;
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
  this.drawMoon();
};

MoonNormal.prototype.draw = function() {
  this.drawOrbit();
  this.drawEarth();
  this.drawMoon();
};

MoonNormal.prototype.drawMoon = function() {
  let box = this.box;
  let this_class = this;

  /*
  box.selectAll("#moon-normal-moon-padding").remove();
  box.selectAll("#moon-normal-moon").remove();
  box.selectAll("#moon-normal-moon-shadow").remove();
  */

  let orbit_r = this_class.box.attr("width") / 2 - this.fake_moon_r - 2;

  // Thursday, August 15 was a full moon
  // on the night of Saturday, August 17, the moon was waning, and 96% illuminated
  // September 14 was the next full  moon
  // On th night of October 5, the moon was waxing, 50% illuminated
  // October 13 was a the next full moon

  // so we covered slightly less than a full cycle + 3/4
  // call it 1.69

  // we started a little after full moon, which is a little past 3/4 if measured from top dead center going counter-clockwise
  // call it 0.76

  let moon_position =
    (((this.time - this.time_min) / (this.time_max - this.time_min)) *
      1.69 *
      2 *
      Math.PI +
      Math.PI * 2 * 0.76) %
    (2 * Math.PI);

  let mx = null;
  let my = null;
  mx = this_class.box.attr("width") / 2 - orbit_r * Math.sin(moon_position);
  my = this_class.box.attr("height") / 2 - orbit_r * Math.cos(moon_position);

  let data = [mx, my];
  box
    .selectAll("#moon-normal-moon-padding")
    .data([data])
    .attr("cx", function(d) {
      return d[0];
    })
    .attr("cy", function(d) {
      return d[1];
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
    .attr("r", this_class.fake_moon_r + 5)
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
    .enter()
    .append("circle")
    .attr("id", "moon-normal-moon")
    .attr("cx", function(d) {
      return d[0];
    })
    .attr("cy", function(d) {
      return d[1];
    })
    .attr("r", this_class.fake_moon_r)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("fill", "none");
  box
    .selectAll("#moon-normal-moon-shadow")
    .data([data])
    .attr("d", function(d) {
      return (
        "M" +
        d[0] +
        "," +
        (d[1] + this_class.fake_moon_r) +
        " a1,1 0 0 0 0,-" +
        this_class.fake_moon_r * 2
      );
    })
    .enter()
    .append("path")
    .attr("id", "moon-normal-moon-shadow")
    .attr("d", function(d) {
      return (
        "M" +
        d[0] +
        "," +
        (d[1] + this_class.fake_moon_r) +
        " a1,1 0 0 0 0,-" +
        this_class.fake_moon_r * 2
      );
    })
    .attr("fill", "black")
    .attr("stroke", "none");
};

MoonNormal.prototype.drawOrbit = function() {
  let box = this.box;
  let this_class = this;

  let orbit_r = this_class.box.attr("width") / 2 - this.fake_moon_r - 2;

  box.selectAll("#moon-normal-orbit").remove();

  box
    .append("circle")
    .attr("id", "moon-normal-orbit")
    .attr("cx", this_class.box.attr("width") / 2)
    .attr("cy", this_class.box.attr("height") / 2)
    .attr("r", orbit_r)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("fill", "none");
};

MoonNormal.prototype.drawEarth = function() {
  let box = this.box;
  let this_class = this;

  box.selectAll("#moon-normal-earth").remove();
  box.selectAll("#moon-normal-earth-shadow").remove();

  box
    .append("circle")
    .attr("id", "moon-normal-earth")
    .attr("cx", this_class.box.attr("width") / 2)
    .attr("cy", this_class.box.attr("height") / 2)
    .attr("r", this_class.fake_earth_r)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("fill", "none");
  box
    .append("path")
    .attr("id", "moon-normal-earth-shadow")
    .attr(
      "d",
      "M" +
        this_class.box.attr("width") / 2 +
        "," +
        (this_class.box.attr("height") / 2 + this.fake_earth_r) +
        " a1,1 0 0 0 0,-" +
        this.fake_earth_r * 2
    )
    .attr("fill", "black")
    .attr("stroke", "none");
};

MoonNormal.prototype.remove = function() {};
