var sensor; //variable that represent a sensor
var sensorGroup = L.layerGroup(); //sensors layers
var fireLinesGroup = L.layerGroup(); //fire lines layers
var shadowLinesGroup = L.layerGroup(); //shadow lines layers
var layersGeoJSON = L.layerGroup(); //timeline polygons
var drawnFireLinesGroup = L.layerGroup(); //fire lines layers
var drawnShadowLinesGroup = L.layerGroup(); //shadow lines layers
//my leaflet map
var mymap = L.map('map', {
    center: [32.751589401074156, -16.893112091737557], //centered in Madeira Island
    zoom: 13,
    zoomControl: false,
    fullscreenControl: true,
});

mymap.on('click', function (e) {
    console.log("[" + e.latlng.lat + ", " + e.latlng.lng + "]")
});

//Tiles 
var mapTiles = {
    "satelite": L.tileLayer('https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=HsE7HIt6q0MJ6monGnhT', {
        attribution: '<a href="http://www.gesfogo.ulpgc.es/index.php/es/">GesFoGO M-ITI</a>'
    }).addTo(mymap),
    "google": L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
        attribution: 'google'
    }),
    "cartiqo": L.tileLayer('https://api.maptiler.com/maps/topographique/{z}/{x}/{y}.png?key=HsE7HIt6q0MJ6monGnhT', {
        attribution: '<a href="http://www.gesfogo.ulpgc.es/index.php/es/">GesFoGO M-ITI</a>'
    })
}

//Free Hand Draws/Shapes
require('leaflet-freehandshapes');

var fireLines = new L.FreeHandShapes({
    polygon: {
        className: 'fireLineDB',
        color: 'red',
        fillColor: 'red',
        opacity: 0.7,
        weight: 3,
        smoothFactor: 1
    },
    polyline: {
        color: '#D55F04',
        smoothFactor: 1
    },
    simplify_tolerance: 0.001,
    merge_polygons: true,
    concave_polygons: false
});
var shadowLines = new L.FreeHandShapes({
    polygon: {
        className: 'shadowLineDB',
        color: '#8F6F56',
        fillColor: '#8F6F56',
        weight: 3,
        smoothFactor: 0
    },
    polyline: {
        color: '#8F6F56',
        smoothFactor: 0
    },
    simplify_tolerance: 0.001,
    merge_polygons: true,
    concave_polygons: false
});


var drawnfireLines = new L.FreeHandShapes({
    polygon: {
        className: 'drawnFireLine',
        color: 'red',
        fillColor: 'red',
        opacity: 0.7,
        weight: 3,
        smoothFactor: 1
    },
    polyline: {
        color: '#D55F04',
        smoothFactor: 1
    },
    simplify_tolerance: 0.001,
    merge_polygons: true,
    concave_polygons: false
});
var drawnshadowLines = new L.FreeHandShapes({
    polygon: {
        className: 'drawnShadowLine',
        color: '#8F6F56',
        fillColor: '#8F6F56',
        weight: 3,
        smoothFactor: 0
    },
    polyline: {
        color: '#8F6F56',
        smoothFactor: 0
    },
    simplify_tolerance: 0.001,
    merge_polygons: true,
    concave_polygons: false
});

//change draw mode
document.getElementById('mode').onchange = function () {
    //freeDraw allows us to create and edit
    switch (this.value) {
        case 'nothing':
            drawnfireLines.setMode('view');
            drawnshadowLines.setMode('view');
            break;
        case 'draw-fl':
            drawnshadowLines.setMode('view');
            drawnfireLines.setMode('add');
            drawnFireLinesGroup.addLayer(drawnfireLines).addTo(mymap);
            console.log(drawnfireLines)
            drawnfireLines.on('layeradd', function (data) {
                var checkbox = document.getElementById('inputFireLineDrawn');
                checkbox.checked = true;
                hideFireLinesDrawn();
            });
            break;
        case 'draw-sl':
            drawnfireLines.setMode('view');
            drawnshadowLines.setMode('add');
            drawnShadowLinesGroup.addLayer(drawnshadowLines).addTo(mymap);
            drawnshadowLines.on('layeradd', function (data) {
                var checkbox = document.getElementById('inputShadowLineDrawn');
                checkbox.checked = true;
                hideShadowLinesDrawn();
            });
            break;
        case 'delete':
            drawnfireLines.setMode('delete');
            drawnshadowLines.setMode('delete');
            break;
        default:
            break;
    }
};



//get all sensors from DB and visualize them in mymap
getInstances();

function getInstances() {
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });
    //start connection
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    //query for capture all properties values of instanced sensors
    query = "SELECT sensor.id, sensor.longitude, sensor.latitude, commands.yaw_lat, commands.yaw_long, commands.angle FROM sensor,commands WHERE commands.sensor_id = sensor.id"
    connection.query(query, function (err, result, fields) {
        if (err) {
            console.log("Query Error");
        }
        var lat; //latitude
        var long; //longitude
        var yaw_long; //yaw
        var yaw_lat; //yaw
        var angles; //angle
        for (i in result) {
            lat = result[i].latitude; //saving latitude from db
            long = result[i].longitude; //saving longitude from db
            yaw_lat = result[i].yaw_lat;
            yaw_long = result[i].yaw_long;
            angles = result[i].angle;

            if (angles <= 0) {
                angles = 1;
            }
            if (yaw_lat == 0) {
                yaw_lat = lat;
            }
            if (yaw_long == 0) {
                yaw_long = long;
            }

            //when we got lat and long we instance the sensors in map
            if (lat != undefined && long != undefined) {
                //creationg of sensor in map 

                var cameraPoint = [long, lat]
                var targetPoint = [yaw_long, yaw_lat]

                var type = 'Feature';
                var properties = {
                    angle: angles
                };

                var geometries = {
                    type: 'GeometryCollection',
                    geometries: [{
                        type: 'Point',
                        coordinates: cameraPoint
                    }, {
                        type: 'Point',
                        coordinates: targetPoint
                    }]
                };

                var points = {
                    type: type,
                    properties: properties,
                    geometry: geometries
                }
                var options = {
                    draggable: false,
                    control: false,
                    angleMarker: true
                }

                //camera instance 

                var cam = L.geotagPhoto.camera(points, options)

                //camera
                cam._cameraIcon.options.iconUrl = './images/camera.png';

                //target
                cam._targetIcon.options.iconUrl = './images/down-arrow.png';
                cam._targetIcon.options.iconSize = [25, 40]

                //angle
                cam._angleIcon.options.iconUrl = './images/marker.svg';
                cam._angleIcon.options.iconSize = [25, 20]

                cam.options.id = result[i].id;

                cam.addTo(mymap);

                cam.on('change', function (event) {
                    document.getElementById("btn_hidden_angle").value = this.getFieldOfView().properties.angle;
                    document.getElementById("btn_hidden_yaw_lat").value = this.getTargetLatLng().lat;
                    document.getElementById("btn_hidden_yaw_long").value = this.getTargetLatLng().lng;
                })

                //enable / disable drag&drop
                var count = 0;
                var openedSensor;
                var openedWindow;
                var openedSensorTargetLatLng;
                var openedSensorFieldOfView;
                var idOpenedSensor;

                cam.on('dblclick', function (event) {
                    if (count == 0) {
                        count++;
                        openedSensor = this;
                        idOpenedSensor = this.options.id;
                        openedSensorFieldOfView = openedSensor.getFieldOfView();
                        openedSensorTargetLatLng = openedSensor.getTargetLatLng();
                        this.setDraggable(true)
                        this._cameraMarker.dragging.disable()
                        this._targetMarker.dragging.enable()
                        this._angleMarker.dragging.enable()
                        var win = L.control.window(map, {
                            title: 'Yaw Configuration!',
                            maxWidth: 350,
                            modal: false,
                            closeButton: false
                        });
                        openedWindow = win;
                        win.prompt({
                            callback: function () {
                                updateYaw(idOpenedSensor);
                                count = 0;
                            },
                            buttonOK: "Confirm values"
                        });
                        win.show();
                        win.showOn([0, 0]); //show window in top-left side
                    } else {
                        if (confirm("If you click on another sensor the current sensor config will close. Are you sure you want to do that?")) {
                            count = 0;
                            openedWindow.hide();
                            openedSensor.setDraggable(false);
                            openedSensor.setAngle(openedSensorFieldOfView.properties.angle);
                            openedSensor.setTargetLatLng(openedSensorTargetLatLng);
                        }
                    }
                });

                //show information in nodeVisor when we click the sensor
                cam.on('click', function (id) {
                    id = this.options.id; // sensor id clicked
                    var idS = document.getElementById("SI").value = id; //send a hidden value with the id : SI-> Sensor ID
                    showSensorInfo(); //call function to show info in NV
                })

                sensorGroup.addLayer(cam).addTo(mymap);

                lat = undefined; //reseting lat from new call to db 
                long = undefined; //reseting long from new call to db  
            }
        }
        sensorGroup.eachLayer(function (layer) {
            layer.setDraggable(false)
        });
    });
    //close connection
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
}

//save sensors in layer group

//sensorGroup = L.layerGroup(sensores).addTo(mymap);
var layerGroups = {
    "Sensors": sensorGroup
}
var control = L.control.layers(mapTiles, layerGroups).addTo(mymap);
mymap.on('overlayadd', function () {
    sensorGroup.eachLayer(function (layer) {
        layer.setDraggable(false)
    });
});

function updateYaw(idSensor) {
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });
    //start connection
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("successful connection");
    });

    var id = idSensor;
    var btn_hidden_angle = document.getElementById("btn_hidden_angle").value;
    var btn_hidden_yaw_long = document.getElementById("btn_hidden_yaw_long").value
    var btn_hidden_yaw_lat = document.getElementById("btn_hidden_yaw_lat").value

    //query for capture all specifc tech info from sensor
    $query = "UPDATE commands SET yaw_lat='" + btn_hidden_yaw_lat + "', yaw_long ='" + btn_hidden_yaw_long + "', angle ='" + btn_hidden_angle + "' WHERE sensor_id=" + id;
    //$query = "select * from sensor"
    connection.query($query, function (err, result, fields) {
        if (err) {
            console.log("Query Error");
        }
    })

    //close button
    sensorGroup.eachLayer(function (layer) {
        if (layer.options.id == id) {
            layer.setDraggable(false)
        } else {
            //pass
        }
    });
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
}

function showConfigMenu() {
    var idSensor = document.getElementById("SI").value;
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });
    //start connection
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    var table_2 = document.getElementById("nv_table_2");

    //query for capture all posible commands/commands
    $query = "SELECT * FROM commands, sensor WHERE sensor_id ='" + idSensor + "'";
    connection.query($query, function (err, result, fields) {
        if (err) {
            console.log("Query Error");
        } else {
            setTimeout(function () {
                table_2.innerHTML =
                    '<form class="form-inline">' +
                    '<tr><th> Commands: </th><td class="text-center" id ="aham"> ' +
                    '<select class="btn-success custom-select w-25 ml-3 mr-3" id="commands">' +
                    '<option name="option" value="nada">None</option>' +
                    '<option name="option" value="amin">Change pitch min</option>' +
                    '<option name="option" value="amax">Change pitch max</option>' +
                    '<option name="option" value="cf">Change capture frequency</option>' +
                    '</select>' +
                    '<input class="text-center ml-3 mr-3" id="Box" value="" type="text" disabled >' +
                    '<input type = "submit" class="btn-success ml-3 mr-3" value = "Confirm values" onclick = "updates();">' +
                    '<input type="hidden" id="idSensor" value="' + idSensor + '">' +
                    '</form>';

                setTimeout(function () {
                    document.getElementById("commands").onchange = function () {
                        var box = document.getElementById("Box");

                        box.setAttribute("disabled", "disabled");
                        switch (this.value) {

                            case 'amin':
                                box.style.visibility = "visible";
                                box.removeAttribute("disabled");
                                box.value = result[0].pitch_min;
                                box.type = 'text';
                                break;
                            case 'amax':
                                box.style.visibility = "visible";
                                box.removeAttribute("disabled");
                                box.value = result[0].pitch_max;
                                box.type = 'text';
                                break;
                            case 'cf':
                                box.style.visibility = "visible";
                                box.removeAttribute("disabled");
                                box.value = result[0].capt_freq
                                box.type = 'time';
                                box.step = 1;
                                break;
                            default:
                                box.style.visibility = "visible";
                                box.value = ''
                                break;
                        }
                    };
                }, 200);
            }, 200);
        }
    });

    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
}

function updates() {
    var valor = document.getElementById("commands").value;
    var idSensor = document.getElementById("idSensor").value;
    switch (valor) {
        case 'amin':
            updatePitchMin(idSensor);
            break;
        case 'amax':
            updatePitchMax(idSensor);
            break;
        case 'cf':
            updateCaptFreq(idSensor);
            break;
        default:
            //pass
            break;
    }
}

function updatePitchMin(idSen) {
    var amin = document.getElementById('Box').value;

    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });

    //iniciar conexao
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    $query = "UPDATE commands SET pitch_min = '" + amin + "' WHERE commands.sensor_id = '" + idSen + "' ";
    connection.query($query, function (err, result, fields) {
        if (err) {
            alert("Query Error.");
        } else {
            alert("Min Pitch changed Sucessfuly.");
            location.reload();
        }
    });
    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
};

function updatePitchMax(idSen) {
    var amax = document.getElementById('Box').value;

    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });

    //iniciar conexao
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    $query = "UPDATE commands SET pitch_max = '" + amax + "' WHERE commands.sensor_id = '" + idSen + "' ";
    connection.query($query, function (err, result, fields) {
        if (err) {
            console.log("Query Error.");
        } else {
            alert("Max Pitch changed Sucessfuly.");
            location.reload();
        }
    });
    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
};


function updateCaptFreq(idSen) {
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });

    //iniciar conexao
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    var capture_frequency = document.getElementById('Box').value;


    $query = 'UPDATE sensor SET capt_freq= "' + capture_frequency + '" WHERE sensor.id = ' + idSen;
    console.log($query);
    connection.query($query, function (err, result, fields) {
        if (err) {
            console.log("Query Error.");
        } else {
            alert("Capture Frequency changed Sucessfuly.");
            location.reload();
        }
    });
    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
};

function showSensorInfo() {
    var idSensor = document.getElementById("SI").value;
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });
    //start connection
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    let table_1 = document.getElementById("nv_table_1");

    //query for capture all properties values of instanced sensors
    $query = "SELECT sensor.id as 'idSensor', longitude, latitude, capt_freq, DATE_FORMAT(time_stamp, '%d-%m-%Y %H:%i:%s') as 'time_stamp', bateria as 'battery', equipa as 'response_team', serial_number, communication, alarm_id, camera_len_lenght, battery_capacity from sensor, techspecifications where sensor.id = techspecifications.sensor_id and sensor.id = " + idSensor;
    console.log($query);
    connection.query($query, function (err, result, fields) {
        if (err) {
            console.log("Query Error" + err);
        } else {
            setTimeout(function () {
                table_1.innerHTML =
                    '<form><tr><th> Sensor: </th><td id="s-i">' + result[0].idSensor + '</td></tr>' +
                    '<tr><th> Latitude: </th><td>' + result[0].latitude + '</td></tr>' +
                    '<tr><th> Longitude: </th><td>' + result[0].longitude + '</td></tr>' +
                    '<tr><th> Capture Frequency: </th><td id="cf">' + result[0].capt_freq + '</td></tr>' +
                    '<tr><th> Bateria: </th><td>' + result[0].battery + '</td></tr>' +
                    '<tr><th> Team: </th> <td><input id="team" class="w-25" type="text" value="' + result[0].response_team + '">' + result[0].time_stamp + '<input type = "submit" class="btn-success ml-2" value = "Update Team" onclick = "updateTeam();"></td>' +
                    '<tr><th> Serial Number: </th><td id="s-i">' + result[0].serial_number + '</td></tr>' +
                    '<tr><th> Actual Communication Service: </th><td id="s-i">' + result[0].communication + '</td></tr>' +
                    '<tr><th> Alarm type: </th><td id="s-i">' + result[0].alarm_id + '</td></tr>' +
                    '<tr><th> Max len lenght: </th><td id="s-i">' + result[0].camera_len_lenght + '</td></tr>' +
                    '<tr><th> Battery Capacity: </th><td id="s-i">' + result[0].battery_capacity + '</td></tr>' +
                    '<input type="hidden" id="SI" value="' + idSensor + '"></form>';
                changeImg(idSensor, 'buttVis');
            }, 200);
        }

    });

    connection.end(() => {
        console.log("Connection closed with sucess.");
    });

    showConfigMenu();
}

function changeImg(id, type) {
    if (id == "") {
        alert("Please, click on the sensor to see the image .")
        return;
    }
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });
    //start connection
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    //query returns Base64 encode images from db
    $query = 'SELECT TO_BASE64(visible_img) as vis_base, TO_BASE64(termal_img) as term_base FROM sensor WHERE id =' + id;
    connection.query($query, function (err, result, fields) {
        if (err) {
            console.log("Query Error");
        }
        var imgSensor = document.getElementById("imgIV");
        switch (id) {
            case '7':
                //visible img
                if (type == 'buttVis') {
                    //setting the img -> base64
                    imgSensor.src = 'data:image/png;base64,' + result[0].vis_base + '';
                    break;
                }
                //termal img
                imgSensor.src = 'data:image/png;base64,' + result[0].term_base + '';
                break;
            case '8':
                if (type == 'buttVis') {
                    imgSensor.src = 'data:image/png;base64,' + result[0].vis_base + '';
                    break;
                }
                //termal img
                imgSensor.src = 'data:image/png;base64,' + result[0].term_base + '';
                break;
            case '9':
                if (type == 'buttVis') {
                    imgSensor.src = 'data:image/png;base64,' + result[0].vis_base + '';
                    break;
                }
                //termal img
                imgSensor.src = 'data:image/png;base64,' + result[0].term_base + '';
                break;
            case '14':
                if (type == 'buttVis') {
                    imgSensor.src = 'data:image/png;base64,' + result[0].vis_base + '';
                    break;
                }
                //termal img
                imgSensor.src = 'data:image/png;base64,' + result[0].term_base + '';
                break;
            default:
                imgSensor.src = 'imagens/na.png';
        }
        imgSensor.setAttribute('width', '98%');
        imgSensor.setAttribute('height', '242px');
    });
    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });

}

function updateTeam() {
    var idSensor = document.getElementById('SI').value;
    var newTeam = document.getElementById('team').value;

    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });

    //iniciar conexao
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    $query = 'UPDATE sensor SET equipa = "' + newTeam + '" WHERE sensor.id = ' + idSensor;
    console.log($query);
    connection.query($query, function (err, result, fields) {
        if (err) {
            alert("Query Error." + err);
        } else {
            alert("Team changed with sucess.");
            location.reload();
        }
    });
    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
}

function FullscreenMV() {
    var e2 = document.getElementById("MV");
    if (document.fullscreenElement === null) {
        if (e2.requestFullscreen) {
            e2.requestFullscreen();
        } else if (e2.mozRequestFullScreen) { /* Firefox */
            e2.mozRequestFullScreen();
        } else if (e2.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            e2.webkitRequestFullscreen();
        } else if (e2.msRequestFullscreen) { /* IE/Edge */
            e2.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function FullscreenNV() {
    var e2 = document.getElementById("NV");
    if (document.fullscreenElement === null) {
        if (e2.requestFullscreen) {
            e2.requestFullscreen();
        } else if (e2.mozRequestFullScreen) { /* Firefox */
            e2.mozRequestFullScreen();
        } else if (e2.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            e2.webkitRequestFullscreen();
        } else if (e2.msRequestFullscreen) { /* IE/Edge */
            e2.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

//clicking the button -> call function -> 2 different ways -> same result
document.getElementById('buttVis').onclick = function () {
    var id = document.getElementById('SI').value;
    changeImg(id, 'buttVis');
}
document.getElementById('buttTerm').addEventListener('click', function () {
    var id = document.getElementById('SI').value;
    changeImg(id, 'buttTerm');
}, false);

function FullscreenIV() {
    var imgSensor = document.getElementById("imgIV");
    var e2 = document.getElementById("IV");
    if (document.fullscreenElement === null) {
        if (e2.requestFullscreen) {
            e2.requestFullscreen();
        } else if (e2.mozRequestFullScreen) { /* Firefox */
            e2.mozRequestFullScreen();
        } else if (e2.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            e2.webkitRequestFullscreen();
        } else if (e2.msRequestFullscreen) { /* IE/Edge */
            e2.msRequestFullscreen();
        }
        imgSensor.setAttribute('width', '98%');
        imgSensor.setAttribute('height', '85%');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        imgSensor.setAttribute('width', '98%');
        imgSensor.setAttribute('height', '242px');
    }
}

var command = L.control({ position: 'topleft' });

command.onAdd = function (mymap) {
    var div = L.DomUtil.create('div');
    div.innerHTML = `
    <div class="dropdown text-center">
    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        Hide Layers
    </button>
    <div class="dropdown-menu btn btn-info text-center">
    <div class="dropdown-item btn btn-info text-center">
        <label>Fire Lines (DB)</label>
        <input class="dropdown-item" type="checkbox" id="inputFireLineDB" onclick="hideFireLinesDB()" name="Fire Lines DB" checked>
    </div>
    <div class="dropdown-item btn btn-info text-center">
        <label>Shadow Lines (DB)</label>
        <input class="dropdown-item" type="checkbox" id="inputShadowLineDB" onclick="hideShadowLinesDB()" name="Shadow Lines DB" checked>
    </div>
    <div class="dropdown-item btn btn-info text-center">
        <label>Fire Lines (Drawn)</label>
        <input class="dropdown-item" type="checkbox" id="inputFireLineDrawn" onclick="hideFireLinesDrawn()" name="Fire Lines Drawn">
    </div>
    <div class="dropdown-item btn btn-info text-center">
        <label>Shadow Lines (Drawn)</label>
        <input class="dropdown-item" type="checkbox" id="inputShadowLineDrawn" onclick="hideShadowLinesDrawn()" name="Shadow Lines Drawn">
    </div>
    </div>
    </div>
    `;
    div.ondblclick = (e) => {
        e.stopPropagation();
    };
    return div;
};

command.addTo(mymap); //your map variable

function hideFireLinesDB() {
    var checkbox = document.getElementById('inputFireLineDB');
    var x = document.getElementsByClassName("fireLineDB");
    var i;
    if (checkbox.checked != true) {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
    } else {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "block";
        }
    }
}

function hideShadowLinesDB() {
    var checkbox = document.getElementById('inputShadowLineDB');
    var x = document.getElementsByClassName("shadowLineDB");
    var i;
    if (checkbox.checked != true) {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
    } else {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "block";
        }
    }
}

function hideShadowLinesDrawn() {
    var checkbox = document.getElementById('inputShadowLineDrawn');
    var x = document.getElementsByClassName("drawnShadowLine");
    var i;
    if (checkbox.checked != true) {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        drawnshadowLines.setMode('view');
        document.getElementById("drawsl").disabled = true;
    } else {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "block";
        }
        if (document.getElementById('mode').value == 'draw-sl') {
            drawnshadowLines.setMode('add');
        }
        document.getElementById("drawsl").disabled = false;
    }
}

function hideFireLinesDrawn() {
    var checkbox = document.getElementById('inputFireLineDrawn');
    var x = document.getElementsByClassName("drawnFireLine");
    var i;
    if (checkbox.checked != true) {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        drawnfireLines.setMode('view');
        document.getElementById("drawfl").disabled = true;
    } else {
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "block";
        }
        if (document.getElementById('mode').value == 'draw-fl') {
            drawnfireLines.setMode('add');
        }
        document.getElementById("drawfl").disabled = false;
    }

}

createDrawnLayer("fire");
createDrawnLayer("shadow");

function createDrawnLayer(type) {
    var latlng = [];
    var coordinate = [];
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });

    query = "SELECT AsText(`firelines_coords_drawn`) as 'coords' FROM drawn_polygons WHERE type = '" + type + "'";
    console.log(query)
    connection.query(query, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result)
            for (i in result) {
                var resWithoutPolygon = result[i].coords.split("POLYGON((");
                var resWithoutPolygon2 = resWithoutPolygon[1].split("))");
                var res = resWithoutPolygon2[0].split(",");
                for (j in res) {
                    var coordenadas = res[j].split(" ");
                    coordinate = [coordenadas[1], coordenadas[0]]
                    latlng.push(coordinate);
                }
                if (type == "fire") {
                    drawnFireLinesGroup.addLayer(drawnfireLines).addTo(mymap);
                    drawnfireLines.addPolygon([
                        latlng
                    ], true, true, true);
                    console.log(drawnfireLines)
                    hideFireLinesDrawn();

                }
                else {
                    drawnShadowLinesGroup.addLayer(drawnshadowLines).addTo(mymap);
                    drawnshadowLines.addPolygon([
                        latlng
                    ], true, true, true);
                    hideShadowLinesDrawn();
                }
                latlng = [];
            }
            connection.end(() => {
                console.log("Connection closed with sucess.");
            });
        }
    });
}

function deleteDrawnLayer(type){
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });

    query = "DELETE FROM drawn_polygons WHERE type = '" + type + "'";
    console.log(query)
    connection.query(query, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted with success.");
        }
    });

}

function insertDrawnLayer(type){
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisor'
    });

    query = "SELECT AsText(`coordinates`) as 'coords', campaign_id, type, date FROM timeline_info WHERE type = '" + type + "'";
    connection.query(query, function (err, result) {
        if (err) {
            console.log(err);
        } else {

            connection.end(() => {
                console.log("Connection closed with sucess.");
            });

            for (i in result) {

                const connection2 = mysql.createConnection({
                    host: '127.0.0.1',
                    user: 'root',
                    password: '',
                    database: 'nodevisor'
                });

                var query = "INSERT INTO drawn_polygons (id_campaign, firelines_coords_drawn, type) VALUES (" + result[i].campaign_id + ", PolygonFromText('" + result[i].coords + "'), '" + result[i].type + "')";
                console.log(query);
                connection2.query(query, function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        connection2.end(() => {
                            console.log("Connection closed with sucess.");
                        });
                    }
                });
            }
            
        }
    })
    
}

function saveLayer(type){
    layersSave = [];
    var groupLayers;

    if(type == 'fire'){
        groupLayers = drawnFireLinesGroup._layers;
    }else if(type == 'shadow'){
        groupLayers = drawnShadowLinesGroup._layers;
    }

    Object.keys(groupLayers).forEach(function(key) {
        var layersDrawn = groupLayers[key];
        Object.keys(layersDrawn._layers).forEach(function(key2) {
            var layerDrawn = layersDrawn._layers[key2];
            layersSave.push(layerDrawn);
        });
    });

    const mysql = require('mysql');

    layersSave.forEach(layer => {
        var polygon = "";
        var firstlatlng;
        var index = 0;
        layer._latlngs[0].forEach(latlngs => {
            if (index == 0){
                firstlatlng = latlngs.lng + " " + latlngs.lat + ", ";
            }
            polygon += latlngs.lng + " " + latlngs.lat + ", ";
            index++;
        });
        polygon += firstlatlng;
        polygon = polygon.substring(0, polygon.length - 2)

        var query = "INSERT INTO drawn_polygons (id_campaign, firelines_coords_drawn, type) VALUES (" + 1 + ", PolygonFromText('POLYGON((" + polygon + "))'), '" + type + "')";

        console.log(query);
        
        const connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'nodevisor'
        });

        connection.query(query, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                connection.end(() => {
                    console.log("Connection closed with sucess.");
                });
            }
        });

    });

}

function revertDrawns(){
    deleteDrawnLayer("fire");
    deleteDrawnLayer("shadow");
    setTimeout(function() {
        insertDrawnLayer("fire");
    }, 500)
    setTimeout(function() {
        insertDrawnLayer("shadow");
    }, 500)
    setTimeout(function() {
        location.reload();
    }, 1500)
    
}

function saveDrawns(){
    deleteDrawnLayer("fire");
    deleteDrawnLayer("shadow");
    setTimeout(function() {
        saveLayer('fire');
    }, 500)
    setTimeout(function() {
        saveLayer('shadow');
    }, 500)
    setTimeout(function() {
        location.reload();
    }, 1500)
}

