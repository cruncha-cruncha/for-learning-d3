// http://romain.vuillemot.net/projects/worldcup14/
// http://mbtaviz.github.io/
// http://marcinignac.com/projects/open-budget/

// kagi chart?

// "date" is always a string representing a date, like "2019-01-01 09:45:00"
// "time" is always a date represented in milliseconds

// py -m http.server

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

let svg = d3
  .select("body")
  .append("svg")
  .attr("id", "svg")
  .attr(
    "width",
    $("body")
      .first()
      .innerWidth()
  )
  .attr("height", 600);

let location_bounds = new Bounds();
let sample_box = svg.append("g");
let sample_box_padding = new Padding(0, 50, 0, 50);
sample_box_padding.applyTo(sample_box, svg.attr("width"), 100);

let locations = [
  new Location(
    "Bella Bella",
    "Bella_Bella",
    "#76cca2",
    location_bounds,
    sample_box,
    null
  ),
  new Location(
    "Prince Rupert",
    "Prince_Rupert",
    "#45716e",
    location_bounds,
    sample_box,
    null
  ),
  new Location(
    "Tofino",
    "Tofino",
    "#3a6cc0",
    location_bounds,
    sample_box,
    null
  ),
  new Location(
    "Vancouver",
    "Vancouver",
    "#58a7e4",
    location_bounds,
    sample_box,
    null
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
      draw_locations();
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

  let sampleSelector = new SampleSelector(location_bounds, sample_box);
  sampleSelector.draw();

  
  
};
