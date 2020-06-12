var sensor; //variable that represent a sensor
var sensorGroup = L.layerGroup(); //sensors layers
var fireLinesGroup = L.layerGroup(); //fire lines layers
var shadowLinesGroup = L.layerGroup(); //shadow lines layers
var layersGeoJSON = L.layerGroup(); //timeline polygons
//my leaflet map
var mymap = L.map('map', {
    center: [32.751589401074156, -16.893112091737557], //centered in Madeira Island
    zoom: 13,
    zoomControl: false,
    fullscreenControl: true,
});

mymap.on('click', function(e) {
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
        className: 'fireLine',
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
        className: 'shadowLine',
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
document.getElementById('mode').onchange = function() {
    //freeDraw allows us to create and edit
    switch (this.value) {
        case 'nothing':
            fireLines.setMode('view');
            shadowLines.setMode('view');
            break;
        case 'draw-fl':
            shadowLines.setMode('view');
            fireLines.setMode('add');
            fireLinesGroup.addLayer(fireLines).addTo(mymap);
            fireLines.on('layeradd', function(data) {
                var checkbox = document.getElementById('inputFireLine');
                checkbox.checked = true;
                hideFireLines();
                console.log('Terminei o desenho');
            });
            break;
        case 'draw-sl':
            fireLines.setMode('view');
            shadowLines.setMode('add');
            shadowLinesGroup.addLayer(shadowLines).addTo(mymap);
            shadowLines.on('layeradd', function(data) {
                var checkbox = document.getElementById('inputShadowLine');
                checkbox.checked = true;
                hideShadowLines();
                console.log('Terminei o desenho');
            });
            break;
        case 'delete':
            fireLines.setMode('delete');
            shadowLines.setMode('delete');
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
    connection.query(query, function(err, result, fields) {
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

                cam.on('change', function(event) {
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

                cam.on('dblclick', function(event) {
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
                            callback: function() {
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
                cam.on('click', function(id) {
                    id = this.options.id; // sensor id clicked
                    var idS = document.getElementById("SI").value = id; //send a hidden value with the id : SI-> Sensor ID
                    showInfoNV(idS); //call function to show info in NV
                })

                sensorGroup.addLayer(cam).addTo(mymap);

                lat = undefined; //reseting lat from new call to db 
                long = undefined; //reseting long from new call to db  
            }
        }
        sensorGroup.eachLayer(function(layer) {
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
mymap.on('overlayadd', function() {
    sensorGroup.eachLayer(function(layer) {
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
    connection.query($query, function(err, result, fields) {
        if (err) {
            console.log("Query Error");
        }
    })

    //close button
    sensorGroup.eachLayer(function(layer) {
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



function showSpecifSensorNV() {
    //show sensor static info from DB in NV
    if (document.getElementById("SI").value === "") { //cheking if we clicked a sensor 
        alert("Please, click on the sensor to show its configurations.")
        return;
    }

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
        console.log("successful connection");
    });

    //query for capture all specifc tech info from sensor
    $query = "SELECT * FROM techspecifications WHERE sensor_id ='" + idSensor + "'";
    connection.query($query, function(err, result, fields) {
        if (err) {
            console.log("Query Error");
        }
        var table = document.getElementById("nv_table");

        //time out to get the doc ready
        //displaying sensor technical info 
        setTimeout(function() {
            for (var i = 0, row; row = table.rows[i]; i++) {
                for (var j = 0, col; col = row.cells[j]; j++) {
                    table.innerHTML =
                        '<tr><th> Sensor: </th><td>' + result[0].sensor_id + '</td></tr>' +
                        '<tr><th> Serial number: </th><td>' + result[0].serial_number + '</td></tr>' +
                        '<tr><th> Actual Communication Service: </th><td>' + result[0].communication + '</td></tr>' +
                        '<tr><th> Alarm type: </th><td>' + result[0].alarm_id + '</td></tr>' +
                        '<tr><th> Maximun len lenght: </th><td>' + result[0].camera_len_lenght + '</td></tr>' +
                        '<tr><th> Battery Capacity: </th><td>' + result[0].battery_capacity + '</td></tr>' +
                        '<th><button id="config" class="btn-success" onclick="configMenu();"> Configurate Sensor </button></th>' +
                        '<input type="hidden" id="SI" value="' + result[0].sensor_id + '">';
                }
            }
        }, 200);
    });
    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });

}

function configMenu() {
    //show info from DB in NV
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

    //query for capture all posible commands/commands
    $query = "SELECT * FROM commands,sensor WHERE sensor_id ='" + idSensor + "'";
    connection.query($query, function(err, result, fields) {
        if (err) {
            console.log("Query Error");
        }

        var table = document.getElementById("nv_table");
        var idSensor = result[0].sensor_id;
        //time out to get the doc ready
        setTimeout(function() {
            for (var i = 0, row; row = table.rows[i]; i++) {
                for (var j = 0, col; col = row.cells[j]; j++) {
                    table.innerHTML =
                        '<tr><th> Comandos: </th><td class="text-center" id ="aham"> ' +
                        '<select class="btn-success custom-select" id="commands">' +
                        '<option name="option" value="nada">None</option>' +
                        '<option name="option" value="amin">Change pitch min</option>' +
                        '<option name="option" value="amax">Change pitch max</option>' +
                        '<option name="option" value="cf">Change capture frequency</option>' +
                        '</select>' +
                        '<input class="text-center" id="Box" value="" type="text" disabled >' +
                        '<form>' +
                        '<th><br><input type = "submit" class="btn-success" value = "Confirm values" onclick = "updates();"></th>' +
                        '<input type="hidden" id="idSensor" value="' + idSensor + '">' +
                        '</form>';

                }
            }

            setTimeout(function() {
                document.getElementById("commands").onchange = function() {
                    var box = document.getElementById("Box");

                    box.setAttribute("disabled", "disabled");
                    switch (this.value) {

                        case 'amin':
                            box.style.visibility = "visible";
                            box.removeAttribute("disabled");
                            box.value = result[0].pitch_min;
                            break;
                        case 'amax':
                            box.style.visibility = "visible";
                            box.removeAttribute("disabled");
                            box.value = result[0].pitch_max;
                            break;
                        case 'cf':
                            box.style.visibility = "visible";
                            box.removeAttribute("disabled");
                            box.value = result[0].capt_freq
                            break;
                        default:
                            box.style.visibility = "visible";
                            box.value = ''
                            break;
                    }
                };
            }, 200);
        }, 200);
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
    connection.query($query, function(err, result, fields) {
        if (err) {
            alert("Query Error.");
        }
        location.reload();
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
    connection.query($query, function(err, result, fields) {
        if (err) {
            console.log("Query Error.");
        }
        location.reload();
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
        database: 'nodevisordb'
    });

    //iniciar conexao
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });


    var capture_frequency = document.getElementById('Box').value;
    if (capture_frequency >= 60) {
        capture_frequency = 59;
    }

    $query = 'UPDATE property SET value= "' + capture_frequency + '" WHERE propertytype_id = "50" and entity_id = "' + idSen + '"';
    connection.query($query, function(err, result, fields) {
        if (err) {
            console.log("Query Error.");
        }
        alert("Capture Frequency changed Sucessfuly.");
        location.reload();
    });
    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
};

function showInfoNV(id) {
    //show info from DB in NV

    if (document.getElementById("SI").value === "") {
        alert("Please, click on the sensor to show its state.")
        return;
    }

    var idSensor = document.getElementById("SI").value;
    const mysql = require('mysql');
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nodevisordb'
    });
    //start connection
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    //query for capture all properties values of instanced sensors
    $query = "SELECT entitytype.entitytype_name, entity.id, entity.entity_name, propertytype.propertytype_name, property.value FROM entitytype,propertytype, entity, property WHERE entitytype.entitytype_name ='sensor' AND entity.entitytype_id = entitytype.id and propertytype.entitytype_id = entitytype.id and property.entity_id = entity.id and property.propertytype_id = propertytype.id and entity.id = '" + idSensor + "'";
    connection.query($query, function(err, result, fields) {
        if (err) {
            console.log("Query Error");
        }
        // capture particular sensor properties 
        for (i in result) {

            switch (result[i].propertytype_name) {
                case 'longitude':
                    var longitude = result[i].value;
                    break;
                case 'latitude':
                    var latitude = result[i].value;
                    break;
                case 'capt_freq':
                    var capt_freq = result[i].value;
                    break;
                case 'battery':
                    var battery = result[i].value;
                    break;
                case 'response_team':
                    var response_team = result[i].value;
                    break;
                case 'time_stamp':
                    var time_stamp = result[i].value;
                    break;
                default:
                    break;
            }
        }
        var table = document.getElementById("nv_table");

        //time out to get the doc ready
        setTimeout(function() {
            table.innerHTML =
                        '<form><tr><th> Sensor: </th><td id="s-i">' + idSensor + '</td></tr>' +
                        '<tr><th> Latitude: </th><td>' + latitude + '</td></tr>' +
                        '<tr><th> Longitude: </th><td>' + longitude + '</td></tr>' +
                        '<tr><th> Capture Frequency: </th><td id="cf">' + capt_freq + '</td></tr>' +
                        '<tr><th> Bateria: </th><td>' + battery + '</td></tr>' +
                        '<tr><th> Team: </th> <td><input id="team" type="text" value="' + response_team + '">' + time_stamp + '<br><input type = "submit" class="btn-success" value = "Update Team"onclick = "updateTeam();"></td>' +
                        '<input type="hidden" id="SI" value="' + idSensor + '">' +
                        '</form>';
            changeImg(idSensor, 'buttVis');
        }, 200);
    });
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
    connection.query($query, function(err, result, fields) {
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
        imgSensor.setAttribute('height', '273px');
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
        database: 'nodevisordb'
    });

    //iniciar conexao
    connection.connect((err) => {
        if (err) {
            return console.log(err.stack);
        }
        console.log("Sucessfuly connection");
    });

    $query = 'UPDATE property SET value= "' + newTeam + '" WHERE propertytype_id = "67" and entity_id = "' + idSensor + '"';
    connection.query($query, function(err, result, fields) {
        if (err) {
            alert("Query Error.");
        }
        alert("Team changed with sucess.");
        location.reload();

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
document.getElementById('buttVis').onclick = function() {
    var id = document.getElementById('SI').value;
    changeImg(id, 'buttVis');
}
document.getElementById('buttTerm').addEventListener('click', function() {
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
        imgSensor.setAttribute('height', '273px');
    }
    
}

var command = L.control({position: 'topleft'});

command.onAdd = function (mymap) {
    var div = L.DomUtil.create('div');
    div.innerHTML = `
    <div class="dropdown text-center">
    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        Hide Layers
    </button>
    <div class="dropdown-menu btn btn-info text-center">
    <div class="dropdown-item btn btn-info text-center">
        <label>Fire Lines</label>
        <input class="dropdown-item" type="checkbox" id="inputFireLine" onclick="hideFireLines()" name="Fire Lines" checked>
    </div>
    <div class="dropdown-item btn btn-info text-center">
        <label>Shadow Lines</label>
        <input class="dropdown-item" type="checkbox" id="inputShadowLine" onclick="hideShadowLines()" name="Shadow Lines" checked>
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

function hideFireLines(){
    var checkbox = document.getElementById('inputFireLine');
    var x = document.getElementsByClassName("fireLine");
    var i;
    if(checkbox.checked != true){
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        fireLines.setMode('view');
        document.getElementById("drawfl").disabled = true;
    }else{
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "block";
        }
        if(document.getElementById('mode').value == 'draw-fl'){
            fireLines.setMode('add');
        }
        document.getElementById("drawfl").disabled = false;
    }
    
}

function hideShadowLines(){
    var checkbox = document.getElementById('inputShadowLine');
    var x = document.getElementsByClassName("shadowLine");
    var i;
    if(checkbox.checked != true){
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        shadowLines.setMode('view');
        document.getElementById("drawsl").disabled = true;
    }else{
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "block";
        }
        if(document.getElementById('mode').value == 'draw-sl'){
            shadowLines.setMode('add');
        }
        document.getElementById("drawsl").disabled = false;
    }
}