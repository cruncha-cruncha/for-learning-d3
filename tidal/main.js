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
