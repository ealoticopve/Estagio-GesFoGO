function showTimeLine(sensorID) {
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

    $query = "SELECT * from timeline WHERE sensor_id =" + sensorID;
    connection.query($query, function(err, result, fields) {
        if (err) {
            alert("Query Error.");
        }

        var i = 0;
        var currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 1)
        var input = 80;
        console.log("Hora atual:" + currentDate.toUTCString())

        while (i < result[0].nr_captures) {

            var docID = i.toString();

            console.log(docID)
            console.log(result)

            var capture = document.createElement("LI");
            var dataxd = document.createTextNode("Hora intermedia");

            capture.setAttribute("id", i);
            capture.appendChild(dataxd);
            document.getElementById("list").appendChild(capture);
            console.log(document.getElementById("list"))

            if (i == 0) {
                if (currentDate.getMinutes() - input < 0) {
                    currentDate.setHours(currentDate.getHours() - 1)
                    currentDate.setMinutes((60 - input) + currentDate.getMinutes());
                    console.log("Hora inicial:" + currentDate.toUTCString())
                    document.getElementById(i).innerHTML = currentDate.toUTCString();
                } else {
                    currentDate.setMinutes(currentDate.getMinutes() - input)
                    console.log("Hora inicial:" + currentDate.toUTCString())
                    document.getElementById(i).innerHTML = currentDate.toUTCString();
                }
            } else if (i == (result[0].nr_captures) - 1) {
                var currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 1)
                console.log("Hora final:" + currentDate.toUTCString())
                document.getElementById(i).innerHTML = currentDate.toUTCString();
            }
            i++;
        }
    });

    //fechar conexao
    connection.end(() => {
        console.log("Connection closed with sucess.");
    });
}

var coorJson = {
    fires: {
        1: {
            id: 1,
            lat: 32.761609401074156,
            long: -16.893112091737557,
            time: '1'
        },
        2: {
            id: 1,
            lat: 32.721609401074156,
            long: -16.893112091737557,
            time: '2'
        },
        3: {
            id: 1,
            lat: 32.741609401074156,
            long: -16.893112091737557,
            time: '3'
        },
        4: {
            id: 1,
            lat: 32.731609401074156,
            long: -16.893112091737557,
            time: '4'
        }
    }

}
var latt;
var longg;

function t(v) {
    console.log(coorJson.fires)
    for (i in coorJson.fires) {
        if (coorJson.fires[i].time == v) {

            latt = coorJson.fires[i].lat
            longg = coorJson.fires[i].long
        }
        //console.log(coorJson.fires[i].lat)
    }
    console.log(v)
    switch (v) {
        case '1':
            polygon._latlngs[0][0].lat = latt
            polygon._latlngs[0][0].lng = longg
            break;
        case '2':
            polygon._latlngs[0][0].lat = latt
            polygon._latlngs[0][0].lng = longg
            break;
        case '3':
            polygon._latlngs[0][0].lat = latt
            polygon._latlngs[0][0].lng = longg
            break;
        case '4':
            polygon._latlngs[0][0].lat = latt
            polygon._latlngs[0][0].lng = longg
            break;
    }
}