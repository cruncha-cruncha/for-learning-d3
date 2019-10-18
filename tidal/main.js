// http://romain.vuillemot.net/projects/worldcup14/
// http://mbtaviz.github.io/
// http://marcinignac.com/projects/open-budget/

// kagi chart?

// "orbit of the moon"

// "date" is always a string representing a date, like "2019-01-01 09:45:00"
// "time" is always a date represented in milliseconds

// py -m http.server

// add scales to selection and output

let loading_text = "loading";
let loading = d3
  .select("body")
  .append("text")
  .text(loading_text)
  .attr("x", 0)
  .attr("y", 20)
  .style("fill", "black");

let updateLoadingText = function() {
  loading.text(function() {
    loading_text += ".";
    return loading_text;
  });
};

let loadingTextInterval = setInterval(updateLoadingText, 500);

let svg1 = d3
  .select("#svg1")
  .attr(
    "width",
    $("body")
      .first()
      .innerWidth()
  )
  .attr("height", 150);

let svg2 = d3
  .select("#svg2")
  .attr(
    "width",
    $("body")
      .first()
      .innerWidth()
  )
  .attr("height", 600);

let svg3 = d3
  .select("#svg3")
  .attr(
    "width",
    $("body")
      .first()
      .innerWidth() / 2
  )
  .attr(
    "height",
    $("body")
      .first()
      .innerWidth() / 2
  );

let location_bounds = new Bounds();
let sample_box = svg1.append("g");
let sample_box_margin = new Margin(0, 50, 50, 50);
sample_box_margin.applyTo(sample_box, svg1.attr("width"), svg1.attr("height"));
let sample_scale_box = svg1.append("g");
let sample_scale_box_margin = new Margin(100, 50, 0, 50);
sample_scale_box_margin.applyTo(
  sample_scale_box,
  svg1.attr("width"),
  svg1.attr("height")
);
let output_box = svg2.append("g");
let output_box_margin = new Margin(50, 50, 50, 50);
output_box_margin.applyTo(output_box, svg2.attr("width"), svg2.attr("height"));

let locations = [
  new Location(
    "Bella Bella",
    "Bella_Bella",
    "#76cca2",
    location_bounds,
    sample_box,
    output_box
  ),
  new Location(
    "Prince Rupert",
    "Prince_Rupert",
    "#45716e",
    location_bounds,
    sample_box,
    output_box
  ),
  new Location(
    "Tofino",
    "Tofino",
    "#3a6cc0",
    location_bounds,
    sample_box,
    output_box
  ),
  new Location(
    "Vancouver",
    "Vancouver",
    "#58a7e4",
    location_bounds,
    sample_box,
    output_box
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
let locationScales = new LocationScales(
  location_bounds,
  sample_scale_box,
  output_box
);

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
      coastLine.draw();
      locationScales.drawSample();
      locationScales.drawXoutput();
    }
  });
});

let draw_locations = function() {
  locations.forEach(function(loc) {
    loc.updateBounds();
  });

  locations.forEach(function(loc) {
    loc.drawSample();
  });

  loading.remove();
  clearInterval(loadingTextInterval);

  let sampleSelector = new SampleSelector(
    location_bounds,
    sample_box,
    locationScales
  );
  sampleSelector.updateBounds();
  sampleSelector.draw();

  locations.forEach(function(loc) {
    loc.updateOutput();
    loc.drawOutput(null);
  });

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
      }
    });
  });

  d3.select("#updateOutput").on("click", function() {
    barrier = locations.map(function() {
      return false;
    });

    locations.forEach(function(loc) {
      loc.updateOutput();
      loc.drawOutput(location_dispatch);
    });
  });
};
