function displayGeoDataTimeLine() {
    var SensorID = document.getElementById("SI").value;;
    if (SensorID == "") {
        showTimeLinePolygons();
    }
    setTimeout(function () {
        var sliderControl = L.control.sliderControl({ position: "bottomleft", layer: layersGeoJSON, follow: 0, timeAttribute: "time" });
        mymap.addControl(sliderControl);
        sliderControl.startSlider();

        sliderControl.on('rangechanged', function (e) {
            hideFireLinesDB();
            hideShadowLinesDB();
            var SensorID = document.getElementById("SI").value;
            if (SensorID != "") {
                console.log("muda foto");
                showTimeLineImg(SensorID, e.markers[0].options.time);
            }
        });
    }, 1000)
}

displayGeoDataTimeLine();

function showTimeLineImg(SensorID, date) {
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });
    var imgSensor = document.getElementById("imgIV");
    query = "SELECT TO_BASE64(timeline_sensor_captures.img) as 'img' FROM timeline_info, timeline_sensor_captures WHERE timeline_sensor_captures.sensor_id = '" + SensorID + "' AND timeline_sensor_captures.timeline_info_id = timeline_info.id and timeline_info.date ='" + date + "'";
    connection.query(query, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            if (result.length == 0) {
                imgSensor.src = "#";
            } else {
                imgSensor.src = 'data:image/png;base64,' + result[0].img + '';
            }
        }
    });
    //close 1st connection
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
}

function showTimeLinePolygons() {
    var LatLng = [];
    var Coordenadas = [];
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });
    query = "SELECT DATE_FORMAT(timeline_info.date, '%Y-%m-%d %H:%i:%s') as 'date', type, AsText(timeline_info.coordinates) as 'coords' FROM timeline_info";
    connection.query(query, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            for (i in result) {
                var resWithoutPolygon = result[i].coords.split("POLYGON((");
                var resWithoutPolygon2 = resWithoutPolygon[1].split("))");
                var res = resWithoutPolygon2[0].split(",");
                for (j in res) {
                    var coordenadas = res[j].split(" ");
                    Coordenadas = [coordenadas[1], coordenadas[0]]
                    LatLng.push(Coordenadas);
                }

                console.log(result[i].date);
                if(result[i].type == 'fire'){
                    var polygon = L.polygon(LatLng, { className: 'fireLineDB', color: 'red', fillColor: 'red', fillOpacity: 0.6, opacity: 1, time: result[i].date }, { alwaysShowDate: true })
                }else{
                    var polygon = L.polygon(LatLng, { className: 'shadowLineDB', color: 'grey', fillColor: 'grey', fillOpacity: 0.6, opacity: 1, time: result[i].date }, { alwaysShowDate: true })
                }


                layersGeoJSON.addLayer(polygon);
                LatLng = [];
                polygon.id = result[i].date;
            }
        }
    });
    //close 1st connection
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
}

document.getElementById("confirmTimeline").addEventListener("click", function updateTimeline() {
    var timelineInit = document.getElementById("timeline-init").value;
    var timelineEnd = document.getElementById("timeline-end").value;
    var step = document.getElementById("step").value;

    timelineInit = timelineInit.split("T");
    timelineEnd = timelineEnd.split("T");
    if (timelineInit != "" && timelineEnd != "" && step != "") {
        if (step <= 1440) {
            const mysql = require('mysql');
            const connection = mysql.createConnection({
                host: '127.0.0.1',
                user: 'root',
                password: '',
                database: 'nodevisor'
            });
            query = "UPDATE timeline_info SET timeline_init = '" + timelineInit[0] + " " + timelineInit[1] + ":00', timeline_end = '" + timelineEnd[0] + " " + timelineEnd[1] + ":00', step = '" + step + "' WHERE campaign_id = '1';";
            alert(timelineInit);
            alert(query);
            connection.query(query, function (err, result) {
                if (err) {
                    console.log(err);
                }
            });
            connection.end(() => {
                console.log("Connection closed with sucess.");
            });
        }
    }
});





























/*******************
* INSERT Polygons DB
********************
INSERT INTO timeline_info (`firelines_coords`,`date`)
VALUES(PolygonFromText('POLYGON((-16.893112091737557 32.751589401074156,-16.920664420821403 32.751819589648335,-16.94118391324711 32.76159954908414,-16.926709719676907 32.73215569845409,-16.893112091737557 32.751589401074156))'),'2020-05-29 07:16:19')

);*/

/****************
* Get Polygons DB
*****************
SELECT date, AsText(`firelines_coords`) as coords FROM timeline_info
*/

/****************
* Polygons in DB
*****************
'POLYGON((-16.899375915527347 32.76382049705545, -16.90126419067383 32.764830951896165, -16.908731460571293 32.76324308914018, -16.91576957702637 32.76750138448129, -16.915855407714847 32.76021163614798, -16.91980361938477 32.7615830205243, -16.922121047973636 32.764542251683366, -16.924180984497074 32.762521323979996,  -16.92375183105469 32.75948984641337, -16.918859481811527 32.75739662309657, -16.913623809814457 32.75010604745824,-16.899375915527347 32.76382049705545))'),'2020-05-29 07:16:19')
'POLYGON((-16.899375915527347 32.76382049705545, -16.90126419067383 32.764830951896165, -16.908731460571293 32.76324308914018, -16.91576957702637 32.76750138448129, -16.915855407714847 32.76021163614798, -16.91980361938477 32.7615830205243, -16.922121047973636 32.764542251683366, -16.924180984497074 32.762521323979996,  -16.92375183105469 32.75948984641337, -16.918859481811527 32.75739662309657, -16.913623809814457 32.75010604745824, -16.903409957885746 32.74996167359807, -16.903238296508793 32.75985074201205,-16.899375915527347 32.76382049705545))'),'2020-05-29 07:16:19')
'POLYGON((-16.899375915527347 32.76382049705545, -16.90126419067383 32.764830951896165, -16.908731460571293 32.76324308914018, -16.91576957702637 32.76750138448129, -16.915855407714847 32.76021163614798, -16.91980361938477 32.7615830205243, -16.922121047973636 32.764542251683366, -16.924180984497074 32.762521323979996,  -16.92375183105469 32.75948984641337, -16.918859481811527 32.75739662309657, -16.913623809814457 32.75010604745824, -16.903409957885746 32.74996167359807, -16.903393951401508 32.75385968568664, -16.89944198310773 32.751116657927284, -16.898754684274024 32.747435093167134,-16.893170381250208 32.74591911051183, -16.890077536498563 32.74303145313693, -16.88835928941431 32.74382556824491,-16.889562062373276 32.74779603761608,-16.885094619954238 32.74692976848172,  -16.88286089874472 32.74952855061362,-16.883290460515774 32.751621958861996, -16.888445201768516 32.75248818236663,-16.88526644466266 32.7576131657215,-16.88646921762163 32.75790188840227,-16.885696006433715 32.76071688548088,-16.88878885118538 32.76078906372299,-16.890077536498563 32.756169538276,-16.89179578358282 32.75624172020406, -16.893685855375494 32.76057252882118,-16.89540410245973 32.76136648755334, -16.897208261898193 32.760428171927416,-16.903238296508793 32.75985074201205,-16.899375915527347 32.76382049705545))'),'2020-05-29 07:16:19')

-16.881822762693098 32.74609492393925, -16.8660169072774 32.74638354876402, -16.862580851752256 32.73685843585667, -16.866188710053667 32.72964176339931, -16.87099918778888 32.73325017266499, -16.874778848866537 32.73079647025668, -16.88852307096713 32.735126487755224, -16.881822762693098 32.74609492393925






*/