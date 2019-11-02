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

MoonNormal.prototype.remove = function() {};
