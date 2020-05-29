var marker1 = L.marker([51.5, -0.09], { time: "2013-01-22 08:42:26+01" });
var marker2 = L.marker([51.6, -0.09], { time: "2013-01-22 10:00:26+01" });
var marker3 = L.marker([51.7, -0.09], { time: "2013-01-22 10:03:29+01" });
var polygon1 = L.polygon([
    [32.751589401074156, -16.893112091737557], // start point
    [32.751819589648335, -16.920664420821403],
    [32.76159954908414, -16.94118391324711, ],
    [32.73215569845409, -16.926709719676907],
    [32.751589401074156, -16.893112091737557] // end point = start point
], {
    fillColor: 'yellow',
    fillOpacity: 0.5,
    time: "2013-01-22 10:24:59+01"
});
var pointA = new L.LatLng(51.8, -0.09);
var pointB = new L.LatLng(51.9, -0.2);
var pointList = [pointA, pointB];

var polyline = new L.Polyline(pointList, {
    time: "2013-01-22 10:24:59+01",
    color: 'red',
    weight: 3,
    opacity: 1,
    smoothFactor: 1
});


layerGroup = L.layerGroup([marker1, marker2, marker3, polyline, polygon1]);
var sliderControl = L.control.sliderControl({ position: "bottomleft", layer: layerGroup, range: true });
mymap.addControl(sliderControl);
sliderControl.startSlider();