const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const pool = require('../database');
const { Client } = require('node-rest-client');
const { isGeneratorFunction } = require('util/types');
const opciones = { year: 'numeric', month: 'numeric', day: 'numeric' };
const fetch = require('node-fetch-commonjs');
const bcrypt = require('bcryptjs');

const enconstru = false;
let webpay_peticion;
let webpay_respuesta;

//variables de reserva
let reserva_nombre;
let reserva_correo;
let reserva_fono;
let reserva_rut;
let reserva_cabana;
let reserva_fechaIn;
let reserva_fechaOut;
let reserva_monto;
//fin variables reserva

const fill = (number, len) =>
  "0".repeat(len - number.toString().length) + number.toString();

async function calcular_valor_reserva(fechaIn, fechaOut){
    let valores = await pool.query("select valor_lun, valor_mar, valor_mie, valor_jue, valor_vie, valor_sab, valor_dom from configuraciones where idconfiguraciones = 1");
    //console.log(valores[0].valor_lun);
    let monto = 0;
    var fechaInicio = new Date(fechaIn);
    var fechaFin = new Date(fechaOut);

    while(fechaFin.getTime() > fechaInicio.getTime()){
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        let quedia = fechaInicio.getDay();
        if(quedia == 1){ monto = monto + valores[0].valor_lun; }
        if(quedia == 2){ monto = monto + valores[0].valor_mar; }
        if(quedia == 3){ monto = monto + valores[0].valor_mie; }
        if(quedia == 4){ monto = monto + valores[0].valor_jue; }
        if(quedia == 5){ monto = monto + valores[0].valor_vie; }
        if(quedia == 6){ monto = monto + valores[0].valor_sab; }
        if(quedia == 0){ monto = monto + valores[0].valor_dom; }
    }
    return monto/2;
}

router.post('/obtenervalor_reserva', async(req, res) => {
    let monto = 0;
    monto = await calcular_valor_reserva(req.body.fechaIn, req.body.fechaOut);
    //console.log(monto);
    res.send(monto.toString());
});

router.get('/', (req, res) => {
    /*if(enconstru){
        res.render('cabana/constru');
    }
    else{
        res.render('cabana/inicio');
    }*/
    res.render('cabana/inicio');
});




/*

============ administrable =================

*/
router.post('/ObtenerDatosReservaOC', async(req, res) => {
    const oc_buscar = req.body.oc;  
    const sql = 'select * from reservas where oc = \''+oc_buscar+'\' order by fecha_reserva asc';
    let reserva = await pool.query(sql);
    res.send(reserva);
});

async function obtenerValorCabana(){
    let valor = 0;
    let resp = await pool.query("select * from configuraciones where idconfiguraciones = 1");
    valor = resp[0].valor_cabana;
    return valor;
}
async function obtenerValoresConfig(){
    let resp = await pool.query("select * from configuraciones where idconfiguraciones = 1");
    return resp[0];
}

router.post('/obtenerVentasAnual', async(req, res) => {
    const anio = req.body.anio;
    let arraydata = [{ "period": anio+'-01', value: 0 },
    { "period": anio+'-02', value: 1 },
    { "period": anio+'-03', value: 2 },
    { "period": anio+'-04', value: 3 },
    { "period": anio+'-05', value: 4 },
    { "period": anio+'-06', value: 5 },
    { "period": anio+'-07', value: 6 },
    { "period": anio+'-08', value: 7 },
    { "period": anio+'-09', value: 8 },
    { "period": anio+'-10', value: 9 },
    { "period": anio+'-11', value: 10 },
    { "period": anio+'-12', value: 11 },];

    let respuesta = await pool.query("select distinct oc, monto, MONTH(fecha_reserva) as MES from reservas where YEAR(fecha_reserva) = "+anio);
    let enero = respuesta.filter((resp) => resp.MES == 1).reduce((total, {monto}) => total + monto, 0);
    let febrero = respuesta.filter((resp) => resp.MES == 2).reduce((total, {monto}) => total + monto, 0);
    let marzo = respuesta.filter((resp) => resp.MES == 3).reduce((total, {monto}) => total + monto, 0);
    let abril = respuesta.filter((resp) => resp.MES == 4).reduce((total, {monto}) => total + monto, 0);
    let mayo = respuesta.filter((resp) => resp.MES == 5).reduce((total, {monto}) => total + monto, 0);
    let junio = respuesta.filter((resp) => resp.MES == 6).reduce((total, {monto}) => total + monto, 0);
    let julio = respuesta.filter((resp) => resp.MES == 7).reduce((total, {monto}) => total + monto, 0);
    let agosto = respuesta.filter((resp) => resp.MES == 8).reduce((total, {monto}) => total + monto, 0);
    let septiembre = respuesta.filter((resp) => resp.MES == 9).reduce((total, {monto}) => total + monto, 0);
    let octubre = respuesta.filter((resp) => resp.MES == 10).reduce((total, {monto}) => total + monto, 0);
    let noviembre = respuesta.filter((resp) => resp.MES == 11).reduce((total, {monto}) => total + monto, 0);
    let diciembre = respuesta.filter((resp) => resp.MES == 12).reduce((total, {monto}) => total + monto, 0);
    //actualizo array
    arraydata[0].value = enero;
    arraydata[1].value = febrero;
    arraydata[2].value = marzo;
    arraydata[3].value = abril;
    arraydata[4].value = mayo;
    arraydata[5].value = junio;
    arraydata[6].value = julio;
    arraydata[7].value = agosto;
    arraydata[8].value = septiembre;
    arraydata[9].value = octubre;
    arraydata[10].value = noviembre;
    arraydata[11].value = diciembre;
    res.send(arraydata);
});

router.get('/login', (req, res) => {
    res.render('admin/login')
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

router.get('/admin', (req, res) => {
    if(req.session.user_session == undefined){
        res.redirect('/login');
    }else{
        res.redirect('/paneladmin');
    }
});

router.post('/admin', async(req, res) => {
    //valido clave
    let errorMensaje = false;
    const usuario = req.body.user;
    let clave = req.body.pass;
    //clave = await bcrypt.hash(clave, 10);
    const existe_user = await pool.query("select count(*) as cuantosusuarios from usuarios where login_user = '"+usuario+"'");
    if(existe_user[0].cuantosusuarios > 0){
        const claveuser = await pool.query("SELECT login_pass, login_nombre FROM usuarios WHERE login_user = '"+usuario+"'");
        const validapass = await bcrypt.compare(clave, claveuser[0].login_pass);
        const nombreusuariofull = claveuser[0].login_nombre;
        //console.log('       valido: '+validapass);
        if(validapass == false){
            errorMensaje = true;
            res.render('admin/login', {errorMensaje})
        }else{
            //console.log(valoresCabana);
            // set session
            req.session.user_session = usuario;
            req.session.username_session = nombreusuariofull;
            req.session.session_activa = true;
           
            // fin set session

            //ingreso a admin
            //res.render('admin/admin', {usuario, nombreusuariofull, valorcabana})
            res.redirect('/paneladmin');
        }
    }
    else{
        errorMensaje = true;
        res.render('admin/login', {errorMensaje})
    }
    
});

router.get('/paneladmin', async(req, res) => {
    //console.log(req.session);
    if(req.session.user_session == undefined){
        res.redirect('/login');
    }

    // set session
    const usuario = req.session.user_session;
    const nombreusuariofull = req.session.username_session;
    let valoresCabana = await obtenerValoresConfig();
    const valor_lun = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valoresCabana.valor_lun);
    const valor_mar = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valoresCabana.valor_mar);
    const valor_mie = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valoresCabana.valor_mie);
    const valor_jue = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valoresCabana.valor_jue);
    const valor_vie = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valoresCabana.valor_vie);
    const valor_sab = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valoresCabana.valor_sab);
    const valor_dom = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valoresCabana.valor_dom);
    // fin set session 
    const fecha = new Date();
    const mesActual = fecha.getMonth() + 1; 
    const anio = fecha.getFullYear();
    const dia = fecha.getDate();
    let fechaHoy = anio+'-'+fill(mesActual,2)+'-'+fill(dia,2);
    //ingreso a admin
    res.render('admin/admin', {usuario, nombreusuariofull, valor_lun, valor_mar, valor_mie, valor_jue, valor_vie, valor_sab, valor_dom, fechaHoy})
});

router.post('/cambioPrecioCabana', async(req, res) => {
    const usuario = req.session.user_session;
    const valor_lun = req.body.val_lun;
    const valor_mar = req.body.val_mar;
    const valor_mie = req.body.val_mie;
    const valor_jue = req.body.val_jue;
    const valor_vie = req.body.val_vie;
    const valor_sab = req.body.val_sab;
    const valor_dom = req.body.val_dom;

    let respuesta = await pool.query('UPDATE configuraciones SET valor_lun = '+valor_lun+',valor_mar = '+valor_mar+',valor_mie = '+valor_mie+',valor_jue = '+valor_jue+',valor_vie = '+valor_vie+',valor_sab = '+valor_sab+',valor_dom = '+valor_dom+', usuario_modifica = \''+usuario+'\' where idconfiguraciones = 1');
    //console.log(respuesta);
    res.send(respuesta);
});

router.post('/CambioPass', async(req, res) => {
    let newpass = req.body.newpass;
    const usuario = req.session.user_session;
    newpass = await bcrypt.hash(newpass, 10);
    let respuesta = await pool.query('UPDATE usuarios SET login_pass = \''+newpass+'\' where login_user = \''+usuario+'\'');
    res.send(respuesta);
});

router.post('/RecuperaPass', async(req, res) => {
    let correo = req.body.correoRC;
    let status = '3';
    let respuesta = await pool.query("SELECT count(*) as NumUser FROM usuarios WHERE login_correo = '"+correo+"'");
    if(respuesta[0].NumUser > 0){
        let respcorreo = await enviarEmailRecuperarPass(correo);
        if(respcorreo.response.includes("250 OK")){
            status = '1';
            res.send(status);//correo enviado
        }
        else{
            status = '3';
            res.send(status); //no se envio correo
        }
    }
    else{
        status = '2';
        res.send(status);// no existe o no esta asociado a ningun usuario el correo ingresado
    }
});

router.post('/EliminaReserva', async(req, res) => {
    const oc_reserva = req.body.oc;
    let respuesta = await pool.query('delete from reservas where OC=\''+oc_reserva+'\'');
    console.log(respuesta);
    res.send(respuesta);
});

router.post('/GetReservasFiltro', async(req, res) => {
    const desde = req.body.desde;
    const hasta = req.body.hasta;
    let sql = 'select * from reservas where fecha_reserva between \''+ desde + '\' and \''+hasta + '\' order by fecha_reserva asc';
    //console.log('                               cargando sql reservas 1 semana hasta hoy')
    //console.log(sql);
    let respuesta = await pool.query(sql);
    res.send(respuesta);
});

router.post('/ReservaManual', async(req, res) => {
    const fechaIn = req.body.fechaIn;
    const fechaOut = req.body.fechaOut;
    const monto = req.body.monto;
    const rut = req.body.rut;
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const fono = req.body.fono;
    const cabana = req.body.cabanaform;

    var fechaInicio = new Date(fechaIn);
    var fechaFin = new Date(fechaOut);
    let query = '';
    let hoy = new Date();
    let oc = 'oc'+hoy.getFullYear()+fill((hoy.getMonth()+1),2)+fill(hoy.getDate(), 2)+hoy.getHours()+hoy.getMinutes()+hoy.getSeconds();
    let session_id = 'session'+hoy.getFullYear()+fill((hoy.getMonth()+1),2)+fill(hoy.getDate(),2)+hoy.getHours()+hoy.getMinutes()+hoy.getSeconds();
    while(fechaFin.getTime() > fechaInicio.getTime()){
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        let fechareserva = fechaInicio.getFullYear() + '-' + fill((fechaInicio.getMonth() + 1),2) + '-' + fill(fechaInicio.getDate(),2);
        //console.log(fechaInicio.getFullYear() + '/' + (fechaInicio.getMonth() + 1) + '/' + fechaInicio.getDate());
        let sql = 'insert into reservas (fecha_reserva, nombre, rut, fono, correo, cabana, OC, session_id, token_respuesta, monto)'
                +' values(\''+fechareserva+'\', \''+nombre+'\', \''+rut+'\', \''+fono+'\', \''+correo+'\', \''+cabana+'\', \''+oc+'\', \''+session_id+'\', \'\', '+monto+')';
        query = await pool.query(sql);
    }

    res.send(query);
});
async function checkReserva(fecha, oc){
    let fechaantes = new Date(fecha);
    fechaantes.setDate(fechaantes.getDate() - 1);
    let fecha_a = fechaantes.getFullYear() + '-' + fill((fechaantes.getMonth() + 1),2) + '-' + fill(fechaantes.getDate(),2);
    let resp1 = await pool.query('select * from reservas where oc = \''+oc+'\' and fecha_reserva = \''+fecha_a+'\'');
    let check = '';
    if(resp1.length <1){
        //es check in
        check = '<p class="text-success fw-bold">Check In</p>';
    }

    return check;
}

async function checkoutReserva(fecha, cabana){
    let fechaantes = new Date(fecha);
    fechaantes.setDate(fechaantes.getDate());
    let fecha_a = fechaantes.getFullYear() + '-' + fill((fechaantes.getMonth() + 1),2) + '-' + fill(fechaantes.getDate(),2);
    //console.log(fecha);
    //console.log(fecha_a);
    let resp1 = await pool.query('select * from reservas where cabana = \''+cabana+'\' and fecha_reserva = \''+fecha_a+'\'');
    
    let check = '';
    if(resp1.length >0){
        let resp2 = await pool.query('select * from reservas where oc = \''+resp1[0].OC+'\' and fecha_reserva = \''+fecha+'\'');
        if(resp2.length <1){
            //es check out
            check = '<p class="text-danger fw-bold">Check Out</p>'
            +'<p class="fs-6 mb-0">'+resp1[0].nombre+'</p>'
            +'<p class="fw-light font-size-sm fst-italic">'+resp1[0].fono+'</p>'
            +'<hr>';
        }
        
    }
    return check;
}

router.post('/consulta_dia', async(req, res) => {
    let cabana1 = '';
    let cabana2 = '';
    let cabana3 = '';
    let cabana4 = '';
    let cabana5 = '';
    let todo = '';
    const fecha = req.body.fecha;
    const resp_dia = await pool.query('select * from reservas where fecha_reserva = \''+fecha+'\'');
    let data_1 = resp_dia.filter((x) => x.cabana == 1);
    let data_2 = resp_dia.filter((x) => x.cabana == 2);
    let data_3 = resp_dia.filter((x) => x.cabana == 3);
    let data_4 = resp_dia.filter((x) => x.cabana == 4);
    let data_5 = resp_dia.filter((x) => x.cabana == 5);

    if(data_1.length > 0){
        let check = await checkReserva(data_1[0].fecha_reserva, data_1[0].OC);
        let checkOut = await checkoutReserva(fecha, 1);
        cabana1 = '<td>'
        +checkOut
        +check
        +'<p class="fs-6 mb-0">'+data_1[0].nombre+'</p>'
        +'<p class="fw-light font-size-sm fst-italic">'+data_1[0].fono+'</p>'
        +'</td>';
    }else{
        let checkOut = await checkoutReserva(fecha, 1);
        cabana1 = '<td>'
        +checkOut
        +'<p class="fw-bold fst-italic text-success">LIBRE</p></td>';
    }

    if(data_2.length > 0){
        let check = await checkReserva(data_2[0].fecha_reserva, data_2[0].OC);
        let checkOut = await checkoutReserva(fecha, 2);
        cabana2 = '<td>'
        +checkOut
        +check
        +'<p class="fs-6 mb-0">'+data_2[0].nombre+'</p>'
        +'<p class="fw-light font-size-sm fst-italic">'+data_2[0].fono+'</p>'
        +'</td>';
    }else{
        let checkOut = await checkoutReserva(fecha, 2);
        cabana2 = '<td>'
        +checkOut
        +'<p class="fw-bold fst-italic text-success">LIBRE</p></td>';
    }

    if(data_3.length > 0){
        let check = await checkReserva(data_3[0].fecha_reserva, data_3[0].OC);
        let checkOut = await checkoutReserva(fecha, 3);
        cabana3 = '<td>'
        +checkOut
        +check
        +'<p class="fs-6 mb-0">'+data_3[0].nombre+'</p>'
        +'<p class="fw-light font-size-sm fst-italic">'+data_3[0].fono+'</p>'
        +'</td>';
    }else{
        let checkOut = await checkoutReserva(fecha, 3);
        cabana3 = '<td>'
        +checkOut
        +'<p class="fw-bold fst-italic text-success">LIBRE</p></td>';
    }

    if(data_4.length > 0){
        let check = await checkReserva(data_4[0].fecha_reserva, data_4[0].OC);
        let checkOut = await checkoutReserva(fecha, 4);
        cabana4 = '<td>'
        +checkOut
        +check
        +'<p class="fs-6 mb-0">'+data_4[0].nombre+'</p>'
        +'<p class="fw-light font-size-sm fst-italic">'+data_4[0].fono+'</p>'
        +'</td>';
    }else{
        let checkOut = await checkoutReserva(fecha, 4);
        cabana4 = '<td>'
        +checkOut
        +'<p class="fw-bold fst-italic text-success">LIBRE</p></td>';
    }

    if(data_5.length > 0){
        let check = await checkReserva(data_5[0].fecha_reserva, data_5[0].OC);
        let checkOut = await checkoutReserva(fecha, 5);
        cabana5 = '<td>'
        +checkOut
        +check
        +'<p class="fs-6 mb-0">'+data_5[0].nombre+'</p>'
        +'<p class="fw-light font-size-sm fst-italic">'+data_5[0].fono+'</p>'
        +'</td>';
    }else{
        let checkOut = await checkoutReserva(fecha, 5);
        cabana5 = '<td>'
        +checkOut
        +'<p class="fw-bold fst-italic text-success">LIBRE</p></td>';
    }
    todo = cabana1+cabana2+cabana3+cabana4+cabana5;
    res.send(todo)
});

/*

============ fin administrable =================

============       rutas       =================

*/
router.get('/galeria', (req, res) => {
    const files = fs.readdirSync("./src/public/img_galeria");
    const filesfiltrados = files.filter(x => {
        return path.extname(x).toLowerCase() === '.jpg';
    });
    console.log(files);
    res.render('cabana/galeria', {filesfiltrados});
});

router.get('/contacto', (req, res) => {
    res.render('cabana/contacto')
});

router.get('/OKReserva', (req, res) => {
    res.render('cabana/OKReserva')
});

router.get('/NOReserva', (req, res) => {
    res.render('cabana/NOReserva')
});

router.get('/alojamiento', (req, res) => {
    res.render('cabana/alojamiento')
});

router.post('/enviarMailContacto', async(req, res) => {
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const fono = req.body.fono;
    const mensaje = req.body.mensaje;
    const info = await enviarEmail(nombre, correo, fono, mensaje);
    //console.log(info);
    res.send(info);
});

router.get('/reserva', (req, res) => {
    const fecha = new Date();
    const mesActual = fecha.getMonth() + 1; 
    const anio = fecha.getFullYear();
    const dia = fecha.getDate();
    let fechaHoy = anio+'-'+fill(mesActual,2)+'-'+fill(dia,2);
    //console.log('               #       ' + fechaHoy);
    res.render('cabana/reserva', {fechaHoy})
});

async function revisaReservaTemporal(fechaIn, fechaOut, cabana){
    //select * from webpay_temporal where fecha_reserva between '2023-02-09' and '2023-02-10' and caduca > '2023-02-09 16:19:52';
    let hoy = new Date();
    let caduca = hoy.getFullYear() + '-' + fill((hoy.getMonth() + 1),2) + '-' + fill(hoy.getDate(),2) + ' ' + fill(hoy.getHours(),2) + ':' + fill(hoy.getMinutes(),2) + ':' + fill(hoy.getSeconds(),2);
    let query = await pool.query("select caduca from webpay_temporal where fecha_reserva between '"+fechaIn+"' and '"+fechaOut+"' and cabana = "+cabana+" and caduca > '"+caduca+"'");

    return query;
}

router.post('/revisaDISPMod', async(req, res) => {
    const oc = req.body.oc;
    const cabana = req.body.cabana;
    const fechaIn = req.body.fechaIn;
    let fechaOut = req.body.fechaOut;
    let dia = new Date(req.body.fechaOut);
    fechaOut = dia.getFullYear()+'-'+fill((dia.getMonth()+1),2)+'-'+fill(dia.getDate(),2);
    //console.log('          #     '+fechaOut);
    let query = await pool.query('select count(*) as cuantasreservas from reservas where fecha_reserva between \''+fechaIn+'\' and \''+fechaOut+'\' and cabana='+cabana+' and OC <> \''+oc+'\'');
    console.log('select count(*) as cuantasreservas from reservas where fecha_reserva between \''+fechaIn+'\' and \''+fechaOut+'\' and cabana='+cabana+' and OC <> \''+oc+'\'');
    let mensaje = '';
    let disponibilidad = true;
    if(query[0].cuantasreservas>0){
        //no disponible
        disponibilidad = false;
    }else{
        //si no tiene reservas la fecha, reviso si alguien esta reservando en el momento
        const hoy = new Date();
        let respuesta_temporal = await revisaReservaTemporal(fechaIn, req.body.fechaOut, cabana);
        if(respuesta_temporal.length > 0){
            disponibilidad = false;
            let caduca = new Date(respuesta_temporal[0].caduca);
            let segundos = caduca.getTime() - hoy.getTime();
            segundos = Math.round(segundos/1000);
            let minutos = Math.floor(segundos/60);
            let calcsegmenos = minutos * 60;
            segundos = segundos - calcsegmenos;
            mensaje = "<p class='alert alert-danger'>Rango de fecha y cabaña está en proceso de pago.</p>"
            + "<br> Debe esperar " + fill(minutos, 2) + ":" + fill(Math.round(segundos), 2) + " Min.";
        }
        else{
            disponibilidad = true;
        }
    }

    res.send({disponibilidad, mensaje});
});
router.post('/revisaDISP', async(req, res) => {
    const cabana = req.body.cabana;
    const fechaIn = req.body.fechaIn;
    let fechaOut = req.body.fechaOut;
    let dia = new Date(req.body.fechaOut);
    fechaOut = dia.getFullYear()+'-'+fill((dia.getMonth()+1),2)+'-'+fill(dia.getDate(),2);
    //console.log('          #     '+fechaOut);
    let query = await pool.query('select count(*) as cuantasreservas from reservas where fecha_reserva between \''+fechaIn+'\' and \''+fechaOut+'\' and cabana='+cabana);
    //console.log(query);
    let cuantos = cuantos_dias(fechaIn, req.body.fechaOut);

    //revisar fechas disponibles si la cantidad es mayor a 0 es porque no esta disponible
    //primero reviso si hay una cabaña disponible para el rango de fechas del usuario
    let cabanasdisponiblesrf = '<h4>Cabañas Disponibles en ese rango de fechas</h4><div>';
    let otrasfechasDisp = '<h4>Fechas sugeridas</h4><div>';
    let cdrf = 0;
    let reservastemporales = 0;

    if(query[0].cuantasreservas>0){
        for(var i=1; i<6; i++){
            let query2 = await pool.query('select count(*) as cuantasreservas from reservas where fecha_reserva between \''+fechaIn+'\' and \''+fechaOut+'\' and cabana='+i);
            if(query2[0].cuantasreservas<1){
                cabanasdisponiblesrf = cabanasdisponiblesrf + "<a class='btn btn-outline-secondary disabled m-1'><i class='fa-solid fa-house'></i> "+i+"</a>";
                cdrf++;
            }
        }
        let numfec = 0;
        let fechaRevisar = '';
        let sqlquery = '';
        dia = new Date(req.body.fechaIn);
        while(numfec<5){
            dia.setDate(dia.getDate() + 1);
            fechaRevisar = dia.getFullYear() + '-' + fill((dia.getMonth() + 1),2) + '-' + fill(dia.getDate(),2);
            sqlquery = "select count(*) as reservada from reservas where fecha_reserva = '"+fechaRevisar+"'";
            let resultado = await pool.query(sqlquery);
            if(resultado[0].reservada == 0){
                otrasfechasDisp = otrasfechasDisp + "<p class='text-success'><i class='fa-regular fa-calendar-days'></i> "+fill(dia.getDate(),2)+ '-' + fill((dia.getMonth() + 1),2) + '-' +dia.getFullYear()+"</p>";
                numfec = numfec + 1;
            }
        }
        cabanasdisponiblesrf = cabanasdisponiblesrf + "</div><hr>";
    }else{
        //si no tiene reservas la fecha, reviso si alguien esta reservando en el momento
        const hoy = new Date();
        let respuesta_temporal = await revisaReservaTemporal(fechaIn, req.body.fechaOut, cabana);
        if(respuesta_temporal.length > 0){
            let caduca = new Date(respuesta_temporal[0].caduca);
            let segundos = caduca.getTime() - hoy.getTime();
            segundos = Math.round(segundos/1000);
            let minutos = Math.floor(segundos/60);
            let calcsegmenos = minutos * 60;
            segundos = segundos - calcsegmenos;
            cabanasdisponiblesrf = "<p class='alert alert-danger'>Rango de fecha y cabaña está en proceso de pago.</p>"
            + "<br> Debe esperar " + fill(minutos, 2) + ":" + fill(Math.round(segundos), 2) + " Min.";
            query[0].cuantasreservas = respuesta_temporal.length;
            reservastemporales = respuesta_temporal.length;
        }
        
    }

    res.send({query, cuantos, cabanasdisponiblesrf, cdrf, otrasfechasDisp, reservastemporales});
});

router.post('/ObtenerReservas', async(req, res) => {
    const dia = req.body.dia;
    const mesActual = req.body.mesActual;
    let anio = req.body.anio;
    let anioProx = anio;
    let mesProximo = parseInt(mesActual) +1;
    if(mesProximo>12) { mesProximo = mesProximo-12; anioProx = parseInt(anio)+1; }
    
    
    let fechaIn = anio+'-'+mesActual+'-'+dia;
    let fechaOut = anio+'-'+mesProximo+'-30';
    mesProximo = fill(mesProximo, 2);
    if(mesProximo == 2){ fechaOut = anio+'-'+mesProximo+'-28'; }
    if(mesProximo == 1 || mesProximo == 3 || mesProximo == 5 || mesProximo == 7 || mesProximo == 8 || mesProximo == 10 || mesProximo == 12){ fechaOut = anioProx+'-'+mesProximo+'-31'; }

    let sql = 'select fecha_reserva, cabana from reservas where fecha_reserva between \''+fechaIn+'\' and \''+fechaOut+'\'';
    let query = await pool.query(sql);
    let arregloFechas = query.map((x) => {
        let title = '' + x.cabana;
        let fecha = new Date(x.fecha_reserva);
        let start = fecha.getFullYear() + '-' + fill((fecha.getMonth() + 1), 2) + '-' + fill(fecha.getDate(), 2);
        let backgroundColor = '#A51D00';
        let borderColor = '#881800';
        if(x.cabana == 2){backgroundColor = '#002D76';borderColor = '#003FA5';}
        if(x.cabana == 3){backgroundColor = '#008A15';borderColor = '#006D11';}
        if(x.cabana == 4){backgroundColor = '#6A0087';borderColor = '#520069';}
        if(x.cabana == 5){backgroundColor = '#E68400';borderColor = '#D87C00';}
        //let start = fecha.toLocaleString('es-ES', opciones);
        return {title, start, backgroundColor, borderColor}
    });
    //console.log(arregloFechas);
    res.send(arregloFechas);
});

router.post('/reservarFechaCabana', async(req, res) => {
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const fono = req.body.fono;
    const rut = req.body.rut;
    const cabana = req.body.cabana;
    var fechaInicio = new Date(req.body.fechaIn);
    var fechaFin = new Date(req.body.fechaOut);
    while(fechaFin.getTime() > fechaInicio.getTime()){
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        fechareserva = fechaInicio.getFullYear() + '-' + (fechaInicio.getMonth() + 1) + '-' + fechaInicio.getDate();
        //console.log(fechaInicio.getFullYear() + '/' + (fechaInicio.getMonth() + 1) + '/' + fechaInicio.getDate());
        let sql = 'insert into reservas (fecha_reserva, nombre, rut, fono, correo, cabana) values(\''+fechareserva+'\', \''+nombre+'\', \''+rut+'\', \''+fono+'\', \''+correo+'\', '+cabana+')';
        let query = await pool.query(sql);
        //console.log(query);
    }
    
    res.send(true);
});

function cuantos_dias(fechaIn, fechaOut){
    let cuantos = 0;
    var fechaInicio = new Date(fechaIn);
    var fechaFin = new Date(fechaOut);
    while(fechaFin.getTime() > fechaInicio.getTime()){
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        cuantos = cuantos + 1;
    }
    return cuantos;
}

function extension(element) {
    var extName = path.extname(element);
    return extName === '.jpg' || extName === '.jpeg'; 
};

// ============ envio de correos ===================

async function enviarEmail(nombre, correo, fono, mensaje) {
    const config = {
        host: 'mail.manantialsietetazas.cl',
        port: 465,
        auth: {
            user: 'contacto@manantialsietetazas.cl',
            pass: 'Manantial.2022'
        }
    }
    const texto = '<html>'
    +'<head>'
    +'    <meta charset="UTF-8">'
    +'    <meta http-equiv="X-UA-Compatible" content="IE=edge">'
    +'    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    +'    <title>EMAIL</title>'
    +'</head>'
    +'<body>'
    +'<h2>La siguiente persona trata de contactar via web:</h2><hr>'
    +'    <table style="width:100%;">'
    +'        <tbody>'
    +'            <tr>'
    +'                <td>Nombre:</td>'
    +'                <td>'+nombre+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Correo:</td>'
    +'                <td>'+correo+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Fono:</td>'
    +'                <td>'+fono+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Mensaje:</td>'
    +'                <td><p style="text-align: justify;">'+mensaje+'</p></td>'
    +'            </tr>'
    +'        </tbody>'
    +'    </table>'
    +'</body>'
    +'</html>';
    const bodymensaje = {
        from: 'contacto@manantialsietetazas.cl',
        to: 'contacto@manantialsietetazas.cl',
        subject: 'Información - Contacto Web',
        html: texto
    }

    const transport = nodemailer.createTransport(config);
    const info = await transport.sendMail(bodymensaje);
    return info;
}

async function enviarEmailPago(nombre, correo, fono, cabana, fechaIn, fechaOut, fechaPago, monto, oc) {
    const config = {
        host: 'mail.manantialsietetazas.cl',
        port: 465,
        auth: {
            user: 'contacto@manantialsietetazas.cl',
            pass: 'Manantial.2022'
        }
    }
    
    var fcpago = new Date(fechaPago);
    if(fechaIn.length<1){
        fechaIn = '0000-00-00';
    }
    if(fechaOut.length<1){
        fechaOut = '0000-00-00';
    }
    var fcin = fechaIn.split('-');
    var fcout = fechaOut.split('-');

    var fcpago_text = fill(fcpago.getDate(),2) +'-'+ fill((fcpago.getMonth() + 1),2) +'-'+ fcpago.getFullYear() +' '+ fill(fcpago.getHours(),2) +':'+ fill(fcpago.getMinutes(),2) +':'+ fill(fcpago.getSeconds(),2);
    
    const texto = '<html>'
    +'<head>'
    +'    <meta charset="UTF-8">'
    +'    <meta http-equiv="X-UA-Compatible" content="IE=edge">'
    +'    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    +'    <title>COMPROBANTE PAGO WEBPAY PLUS</title>'
    +'</head>'
    +'<body>'
    +'<h2>Comprobante de pago reserva via web:</h2><hr>'
    +'    <table style="width:100%;">'
    +'        <tbody>'
    +'            <tr>'
    +'                <td>OC:</td>'
    +'                <td>'+oc+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Nombre:</td>'
    +'                <td>'+nombre+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Correo:</td>'
    +'                <td>'+correo+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Fono:</td>'
    +'                <td>'+fono+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Cabaña:</td>'
    +'                <td>'+cabana+'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Fecha Entrada:</td>'
    +'                <td>'+ fcin[2] + '-' + fcin[1] + '-' + fcin[0] +'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Fecha Salida:</td>'
    +'                <td>'+ fcout[2] + '-' + fcout[1] + '-' + fcout[0] +'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Fecha/Hora Pago:</td>'
    +'                <td>'+ fcpago_text +'</td>'
    +'            </tr>'
    +'            <tr>'
    +'                <td>Monto Pagado:</td>'
    +'                <td>'+new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)+'</td>'
    +'            </tr>'
    +'        </tbody>'
    +'    </table>'
    +'<br><br><br>'
    +'<a href=\'https://www.manantialsietetazas.cl/pdf/INFORMATIVO.pdf\'>Informativo</a>'
    +'<a href=\'https://www.manantialsietetazas.cl/pdf/POLITICAS_DE_RESERVAS.pdf\'>Politicas de Reservas</a>'
    //+'<a href=\'\'>Reglamento Interno</a>'
    +'<br><br><br>'
    +'<img src=\'https://www.manantialsietetazas.cl/img_index/bannercorreo.jpg\' style="width: 100%;"/>'
    +'</body>'
    +'</html>';
    const bodymensaje = {
        from: 'contacto@manantialsietetazas.cl',
        to: correo,
        cc: 'pagos@manantialsietetazas.cl',
        subject: 'Pago reserva - Manantial Siete Tazas',
        html: texto
    }

    const transport = nodemailer.createTransport(config);
    const info = await transport.sendMail(bodymensaje);
    return info;
}

async function enviarEmailRecuperarPass(correo) {
    const config = {
        host: 'mail.manantialsietetazas.cl',
        port: 465,
        auth: {
            user: 'contacto@manantialsietetazas.cl',
            pass: 'Manantial.2022'
        }
    }
    
    var newpass = generatePass();
    var clave_crypt = await bcrypt.hash(newpass, 10);
    var resp = await pool.query("UPDATE usuarios SET login_pass = '"+clave_crypt+"' WHERE login_correo = '"+correo+"'");
    const texto = '<html>'
    +'<head>'
    +'    <meta charset="UTF-8">'
    +'    <meta http-equiv="X-UA-Compatible" content="IE=edge">'
    +'    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    +'    <title>Recuperar Contraseña</title>'
    +'</head>'
    +'<body>'
    +'<h2>Se ha solicitado recuperar contraseña</h2> <br>Favor ingresar con la siguiente clave (recuerde cambiar su contraseña por una personal):<hr>'
    +'    <table style="width:60%;">'
    +'        <tbody>'
    +'            <tr>'
    +'                <td>Nueva Contraseña:</td>'
    +'                <td><strong>'+newpass+'</strong></td>'
    +'            </tr>'
    +'        </tbody>'
    +'    </table>'
    +'<br><br><br>'
    +'<img src=\'https://www.manantialsietetazas.cl/img_index/bannercorreo.jpg\' style="width: 100%;"/>'
    +'</body>'
    +'</html>';
    const bodymensaje = {
        from: 'contacto@manantialsietetazas.cl',
        to: correo,
        subject: 'Recuperación de Contraseña - Manantial Siete Tazas',
        html: texto
    }

    const transport = nodemailer.createTransport(config);
    const info = await transport.sendMail(bodymensaje);
    return info;
}
// ============ fin envio de correos ===================

function sumarDias(fecha, dias){
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
}

function generatePass() {
    var pass = '';
    var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 
            'abcdefghijklmnopqrstuvwxyz0123456789@#$';
      
    for (let i = 1; i <= 12; i++) {
        var char = Math.floor(Math.random()
                    * str.length + 1);
          
        pass += str.charAt(char)
    }
      
    return pass;
}
//webpay
// url PRODUCCION https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions
// url PRUEBAS https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions
// Tbk-Api-Key-Id 597055555532   pruebas
// Tbk-Api-Key-Secret '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';
const TbkUrl = 'https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions';
// const TbkApiKeyId = 597047716159;   produccion
// const TbkApiKeySecret = '0fd4a7b5-dc75-4d96-8240-c6e576dc5aca';
const TbkApiKeyId = 597047716159;
const TbkApiKeySecret = '0fd4a7b5-dc75-4d96-8240-c6e576dc5aca';

/*router.get('/webpay', (req, res) => {
    res.redirect('/reserva');
});*/
async function reservaTemporal(fechaIn, fechaOut, cabana){
    let hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() + 4);
    let fechaInicio = new Date(fechaIn);
    let fechaFin = new Date(fechaOut);
    let caduca = "";
    while(fechaFin.getTime() > fechaInicio.getTime()){
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        let fechareserva = fechaInicio.getFullYear() + '-' + fill((fechaInicio.getMonth() + 1),2) + '-' + fill(fechaInicio.getDate(),2);
        caduca = hoy.getFullYear() + '-' + fill((hoy.getMonth() + 1),2) + '-' + fill(hoy.getDate(),2) + ' ' + fill(hoy.getHours(),2) + ':' + fill(hoy.getMinutes(),2) + ':' + fill(hoy.getSeconds(),2);
        //console.log(fechaInicio.getFullYear() + '/' + (fechaInicio.getMonth() + 1) + '/' + fechaInicio.getDate());
        let sql = 'insert into webpay_temporal (fecha_reserva, cabana, caduca) values(\''+fechareserva+'\', '+cabana+', \''+caduca+'\')';
        let query = await pool.query(sql);
    }
}

router.post('/webpay', async(req, res) => {
    //console.log('                     ##'+ req.body.correo);
    if(req.body.correo == "" || req.body.correo == undefined){
        res.redirect('/reserva');
    }
    else{
        reserva_nombre = req.body.nombre;
        reserva_correo = req.body.correo;
        reserva_fono = req.body.fono;
        reserva_rut = req.body.rut;
        reserva_cabana = req.body.cabanaform;
        reserva_fechaIn = req.body.fechaIn;
        reserva_fechaOut = req.body.fechaOut;
        
        if(reserva_cabana <0 || reserva_cabana == '') { reserva_cabana = 1; }

        // set session
        req.session.reserva_nombre = reserva_nombre;
        req.session.reserva_correo = reserva_correo;
        req.session.reserva_fono = reserva_fono;
        req.session.reserva_rut = reserva_rut;
        req.session.reserva_cabana = reserva_cabana;
        req.session.reserva_fechaIn = reserva_fechaIn;
        req.session.reserva_fechaOut = reserva_fechaOut;
        req.session.reserva_monto = 0;
        // fin set session
        //reserva temporal
        await reservaTemporal(reserva_fechaIn, reserva_fechaOut, reserva_cabana);
        const cuantosdias = req.body.cuantos_dias;
        //let monto = 50000 * cuantosdias;
        let monto = await calcular_valor_reserva(reserva_fechaIn, reserva_fechaOut);
        req.session.reserva_monto = monto;
        //console.log(' monto calculado: ' + monto);
        reserva_monto = monto;
        let montoformato = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
        let hoy = new Date();
        let oc = 'oc'+hoy.getFullYear()+fill((hoy.getMonth()+1),2)+fill(hoy.getDate(), 2)+hoy.getHours()+hoy.getMinutes()+hoy.getSeconds();
        let session_id = 'session'+hoy.getFullYear()+fill((hoy.getMonth()+1),2)+fill(hoy.getDate(),2)+hoy.getHours()+hoy.getMinutes()+hoy.getSeconds();
        //console.log(oc+'    '+session_id);
        req.session.oc = oc;
        req.session.session_id = session_id;
        res.render('webpay/webpay', {oc, session_id, monto, montoformato, cuantosdias})
    }
    
});

router.get('/webpay_retorno', async(req, res) => {
    //req.session.destroy();
    let clasemensaje = 'alert-danger';
    let mensaje = '';

    var cliente2 = new Client();
    const { token_ws, TBK_TOKEN } = req.query;
    console.log('         token_ws  ' + token_ws);
    console.log('         TBK_TOKEN  ' + TBK_TOKEN);
    if(token_ws == undefined) {
        res.render('cabana/NOReserva')
        //res.redirect('/reserva');
    }
    else{
        let noexiste = false;
        noexiste = await noexisteTokenBD(token_ws);
        //console.log('           NO existe? '+ resp);
        //console.log('               token '+token_ws);
        var args = {
            data: {},
            requestConfig:{
                timeout: 4000
            },
            responseConfig: {
                timeout: 4000
            },
            method: 'PUT',
            headers: { "Content-Type": "application/json", "Tbk-Api-Key-Id": TbkApiKeyId, "Tbk-Api-Key-Secret": TbkApiKeySecret }
        };
        const respuesta = await fetch(TbkUrl+"/"+token_ws, args);
        //console.log(respuesta);
        const data = await respuesta.json();
        
        webpay_respuesta = data;
        console.log(webpay_respuesta);
        if(webpay_respuesta.error_message == "The transactions's date has passed max time (7 days) to recover the status" || webpay_respuesta.error_message == "Transaction has an invalid finished state: aborted"){
            mensaje = 'La transaccion tiene más de los 7 días de límite de tiempo para recuperar detalle del estado.';
            res.render('webpay/retorno', {webpay_respuesta, clasemensaje, mensaje})
        }
        else{
           
            let pagoautorizado = false;
            if(webpay_respuesta.status == 'AUTHORIZED' || webpay_respuesta.status == 'INITIALIZED') {
                pagoautorizado = true; 
                clasemensaje = 'alert-success';
                mensaje = 'Reserva Lista! Pago realizado exitosamente. Se envió un mail con el comprobante de reserva a '+ req.session.reserva_correo;
                //console.log('       correo sesion: '+req.session.reserva_correo);
                if(req.session.reserva_correo == undefined){
                    let correoreserva = await buscarCorreoToken(token_ws);
                    if(correoreserva == ''){
                        mensaje = 'Reserva Lista! Pago realizado exitosamente. Se envió un mail con el comprobante de reserva.';
                    }else{
                        mensaje = 'Reserva Lista! Pago realizado exitosamente. Se envió un mail con el comprobante de reserva a '+ correoreserva;
                    }
                }
                //console.log('           no existe? ', noexiste);
                if(noexiste == true){
                    //console.log('                     pasa a mandar mensaje y a registrar');
                    await reservaOKConfirmada(webpay_respuesta, token_ws, req);
                }
            }
            else{
                mensaje = 'Error al procesar pago. ' + webpay_respuesta.status;
                
                if(webpay_respuesta.vci == 'TSN'){
                    mensaje = mensaje + 'Autenticación Rechazada';
                }
                if(webpay_respuesta.vci == 'NP'){
                    mensaje = mensaje + 'No Participa, sin autenticación';
                }
                if(webpay_respuesta.vci == 'U3'){
                    mensaje = mensaje + 'Falla conexión, Autenticación Rechazada';
                }
                if(webpay_respuesta.vci == 'A'){
                    mensaje = mensaje + 'Intentó';
                }
                if(webpay_respuesta.vci == 'CNP1'){
                    mensaje = mensaje + 'Comercio no participa';
                }
                if(webpay_respuesta.vci == 'EOP'){
                    mensaje = mensaje + 'Error operacional';
                }
                if(webpay_respuesta.vci == 'BNA'){
                    mensaje = mensaje + 'BIN no adherido';
                }
                if(webpay_respuesta.vci == 'ENA'){
                    mensaje = mensaje + 'Emisor no adherido';
                }
            }
            //console.log(webpay_respuesta);
            //console.log('           #   response:       ' + req.cookies.reserva_nombre);
            let tienecuotas = false;
            if(webpay_respuesta.installments_number > 0){ tienecuotas = true; }
            webpay_respuesta.amount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(webpay_respuesta.amount);
            if(webpay_respuesta.installments_amount >0){
                webpay_respuesta.installments_amount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(webpay_respuesta.installments_amount);
            }
            else{
                webpay_respuesta.installments_amount = 'Valor a definir con banco';
            }
            
            var fcpago = new Date(webpay_respuesta.transaction_date);
            var fcpago_text = fill(fcpago.getDate(),2) +'-'+ fill((fcpago.getMonth() + 1),2) +'-'+ fcpago.getFullYear() +' '+ fill(fcpago.getHours(),2) +':'+ fill(fcpago.getMinutes(),2) +':'+ fill(fcpago.getSeconds(),2);
            webpay_respuesta.transaction_date = fcpago_text;
            if(webpay_respuesta.payment_type_code == 'VD'){ webpay_respuesta.payment_type_code = 'Venta Débito'; }
            if(webpay_respuesta.payment_type_code == 'VN'){ webpay_respuesta.payment_type_code = 'Venta Normal'; }
            if(webpay_respuesta.payment_type_code == 'VC'){ webpay_respuesta.payment_type_code = 'Venta en cuotas'; }
            if(webpay_respuesta.payment_type_code == 'SI'){ webpay_respuesta.payment_type_code = '3 cuotas sin interés'; }
            if(webpay_respuesta.payment_type_code == 'S2'){ webpay_respuesta.payment_type_code = '2 cuotas sin interés'; }
            if(webpay_respuesta.payment_type_code == 'VP'){ webpay_respuesta.payment_type_code = 'Venta Prepago'; }
            if(webpay_respuesta.payment_type_code != 'VC' && webpay_respuesta.payment_type_code.includes('C')){ 
                webpay_respuesta.payment_type_code = webpay_respuesta.payment_type_code.replace('C', '');
                webpay_respuesta.payment_type_code = webpay_respuesta.payment_type_code + ' Cuotas sin interés';
            }
            res.render('webpay/retorno', {webpay_respuesta, clasemensaje, mensaje, tienecuotas, pagoautorizado})
        }
    }
    
    

    
});

async function noexisteTokenBD(token){
    let noexiste = true;
    let query = await pool.query("select count(*) as cuantasfechas from reservas where token_respuesta = '"+token+"'");
    if(query[0].cuantasfechas > 0){ noexiste = false;}
    //console.log('       NO EXISTE PAGO? ', noexiste);
    return noexiste;
}

async function buscarCorreoToken(token){
    let correo = '';
    let query = await pool.query("select correo from reservas where token_respuesta = '"+token+"' limit 1");
    if(query.length>0){
        correo = query[0].correo;
    }
    return correo;
}

async function reservaOKConfirmada(webpay_respuesta, token_ws, req){
    if(req.session.reserva_rut == undefined){
        let sql_sess = 'select * from sessions where data like \'%'+webpay_respuesta.buy_order+'%\'';
        //console.log('               '+sql_sess);
        let resp_session = await pool.query(sql_sess);
        //console.log(resp_session);
        if(resp_session.length>0){
            //console.log('               rescate de session');
            let datos = JSON.parse(resp_session[0].data);
            //console.log(datos);
            req.session.reserva_nombre = datos.reserva_nombre;
            req.session.reserva_correo = datos.reserva_correo;
            req.session.reserva_fono = datos.reserva_fono;
            req.session.reserva_rut = datos.reserva_rut;
            req.session.reserva_cabana = datos.reserva_cabana;
            req.session.reserva_fechaIn = datos.reserva_fechaIn;
            req.session.reserva_fechaOut = datos.reserva_fechaOut;
        }
    }
    // session
    reserva_nombre = req.session.reserva_nombre;
    reserva_correo = req.session.reserva_correo;
    reserva_fono = req.session.reserva_fono;
    reserva_rut = req.session.reserva_rut;
    reserva_cabana = req.session.reserva_cabana;
    reserva_fechaIn = req.session.reserva_fechaIn;
    reserva_fechaOut = req.session.reserva_fechaOut;
    //console.log('           registrando en BD....');
    // reserva sql
    var fechaInicio = new Date(reserva_fechaIn);
    var fechaFin = new Date(reserva_fechaOut);
    while(fechaFin.getTime() > fechaInicio.getTime()){
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        let fechareserva = fechaInicio.getFullYear() + '-' + fill((fechaInicio.getMonth() + 1),2) + '-' + fill(fechaInicio.getDate(),2);
        //console.log(fechaInicio.getFullYear() + '/' + (fechaInicio.getMonth() + 1) + '/' + fechaInicio.getDate());
        let sql = 'insert into reservas (fecha_reserva, nombre, rut, fono, correo, cabana, OC, session_id, token_respuesta, monto)'
                +' values(\''+fechareserva+'\', \''+reserva_nombre+'\', \''+reserva_rut+'\', \''+reserva_fono+'\', \''+reserva_correo+'\', \''+reserva_cabana+'\', \''+webpay_respuesta.buy_order+'\', \''+webpay_respuesta.session_id+'\', \''+token_ws+'\', '+webpay_respuesta.amount+')';
        let query = await pool.query(sql);
    }
    //  CORREO CONFIRMACION
    //console.log('       enviando correo comprobante de pago....');
    let correoConf = await enviarEmailPago(reserva_nombre, reserva_correo, reserva_fono, reserva_cabana, reserva_fechaIn, reserva_fechaOut, webpay_respuesta.transaction_date, webpay_respuesta.amount, webpay_respuesta.buy_order);
    //  FIN CORREO CONFIRMACION
    //console.log(correoConf);
}

router.post('/webpay_pagar', async(req, res) => {
    webpay_peticion = "";
    //console.log('                                   webpay_pagar');
    //onsole.log(req.session);
    let monto = req.session.reserva_monto;
    if(req.body.umount != undefined){
        monto = req.body.umount;
    }
    //var cliente = new Client();
    let bodyt = {
        "buy_order": req.session.oc,
        "session_id": req.session.session_id,
        "amount": monto,
        "return_url": "https://www.manantialsietetazas.cl/webpay_retorno"
       };
    var args = {
        method: 'POST',
        body: JSON.stringify(bodyt),
        headers: { "Content-Type": "application/json", "Tbk-Api-Key-Id": TbkApiKeyId, "Tbk-Api-Key-Secret": TbkApiKeySecret }
    };
    /*cliente.post(TbkUrl, args, function(data, response){
        webpay_peticion = data;
    });*/
    const respuesta1 = await fetch(TbkUrl, args);
    webpay_peticion = await respuesta1.json();
    
    //console.log(webpay_peticion);
    res.render('webpay/pagar', {webpay_peticion});
    
});
//fin webpay

module.exports = router;