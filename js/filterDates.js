var datas = [];
var datasDB = [];
var dataInicial = new Date("05-29-20 12:25:00");
var dataFinal = new Date("05-29-20 13:00:00");
var step = 25 * 60000;
var dataInicialIntervalo = dataInicial.getTime();
var dataFinalIntervalo = dataInicialIntervalo + step;
var dataInicial = dataInicial.getFullYear() + "-" + (dataInicial.getMonth() + 1) + "-" + dataInicial.getDate() + " " + dataInicial.getHours() + ":" + dataInicial.getMinutes() + ":" + dataInicial.getSeconds();
var dataFinal = dataFinal.getFullYear() + "-" + (dataFinal.getMonth() + 1) + "-" + dataFinal.getDate() + " " + dataFinal.getHours() + ":" + dataFinal.getMinutes() + ":" + dataFinal.getSeconds();

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'nodevisor'
});

query = "SELECT DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') as 'date' FROM timeline_info where date between '" + dataInicial + "' and '" + dataFinal + "' ORDER BY `timeline_info`.`date` ASC";
console.log(query);
connection.query(query, function(err, result) {
    if (err) {
        console.log(err);
    } else {
        for (i in result) {
            datasDB.push(Date.parse(result[i].date));
            console.log("Data: " + result[i].date + "-> " + datasDB[i]);
        }
    }
    var i = 0;
    while (i < datasDB.length) {
        if (datasDB[i] > dataInicialIntervalo && datasDB[i] <= dataFinalIntervalo) {
            datas.push(datasDB[i]);
            console.log("Data metida no array de comp: " + datasDB[i] + " = " + result[i].date)
            i++;
        } else {
            console.log("[" + i + "] -> " + "Fora de intervalo");
            dataEscolhida = Math.max(...datas);
            datas = [];
            console.log("Data escolhida para representação:  " + dataEscolhida + " -> " + (new Date(dataEscolhida).toLocaleString()));
            dataInicialIntervalo = dataFinalIntervalo;
            dataFinalIntervalo = dataInicialIntervalo + step;
        }
        if (i == datasDB.length) {
            console.log("[" + i + "] -> " + "Fora de intervalo");
            dataEscolhida = Math.max(...datas);
            datas = [];
            console.log("Data escolhida para representação:  " + dataEscolhida + " -> " + (new Date(dataEscolhida).toLocaleString()));
            break;
        }
    }
});

connection.end(() => {
    console.log("Connection closed with sucess.");
});