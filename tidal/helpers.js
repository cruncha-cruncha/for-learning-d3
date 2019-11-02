function Bounds() {
  this.time_min = null;
  this.time_max = null;
  this.time_viewbox_min = null;
  this.time_viewbox_max = null;
  this.time_viewbox_lag_min = null;
  this.time_viewbox_lag_max = null;
  this.encoder_min = null;
  this.encoder_max = null;
}

function Margin(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left;
}

Margin.prototype.applyTo = function(elem, width, height) {
  elem.attr("width", width - this.left - this.right);
  elem.attr("height", height - this.top - this.bottom);
  elem.attr("transform", "translate(" + this.left + ", " + this.top + ")");
};

let norm_encoder = function(encoder, bounds, box) {
  return (
    box.attr("height") -
    ((encoder - bounds.encoder_min) /
      (bounds.encoder_max - bounds.encoder_min)) *
      box.attr("height")
  );
};

let addDays = function(time, days) {
  let out = new Date(time);
  out.setDate(date.getDate() + days);
  return out.getTime();
};

// Vancouver is UTC-7 during daylight savings
let ZONE_OFFSET = 1000 * 60 * 60 * 7;
