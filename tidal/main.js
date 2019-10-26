// http://romain.vuillemot.net/projects/worldcup14/
// http://mbtaviz.github.io/
// http://marcinignac.com/projects/open-budget/

// kagi chart?

// "orbit of the moon"

// "date" is always a string representing a date, like "2019-01-01 09:45:00"
// "time" is always a date represented in milliseconds

// py -m http.server

// add scales to selection and output

d3.select("#loadData").on("click", function() {
  go();
});

function go() {
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
      "Vancouver",
      "Vancouver",
      "#58a7e4",
      location_bounds,
      sample_box,
      output_box,
      [svg3.attr("width") / 1.0531746, svg3.attr("width") / 1.087704918]
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

  let location_dispatch = d3.dispatch(
    ...locations.map(loc => {
      return loc.getEventName();
    })
  );

  let coastLine = new CoastLine(locations, svg3);

  let coastLine_dispatch = d3.dispatch(coastLine.getEventName());

  coastLine_dispatch.on(coastLine.getEventName(), function() {
    coastLine.draw();
  });

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
        }
      });
    });

    d3.select("#updateOutput").on("click", function() {
      barrier = locations.map(function() {
        return false;
      });

      locationScales.drawYoutput();
      locationScales.removeXoutput();

      locations.forEach(function(loc) {
        loc.updateOutput();
        loc.drawOutput(location_dispatch);
      });
    });
  };

  locations.forEach(function(loc) {
    loc.readData(files, location_dispatch);
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
        draw_locations();
        coastLine.readData(coastLine_dispatch);
      }
    });
  });
}
