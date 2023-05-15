var today = new Date();
var aniovistaingreso = today.getFullYear();
let cabanaselect = 1;
let cabanaselectmod = 1;

const fill = (number, len) =>
  "0".repeat(len - number.toString().length) + number.toString();

$(document).ready(function(){
    CargarAniosSelectPanelIngreso();
    $("#passnew2").change(function(){
        if(validaNuevaClave()){
            $("#clavesMensaje").fadeOut();
            $("#passnew1").removeClass('is-invalid');
            $("#passnew2").removeClass('is-invalid');
            $("#passnew1").addClass('is-valid');
            $("#passnew2").addClass('is-valid');
        }else{
            $("#passnew1").removeClass('is-valid');
            $("#passnew2").removeClass('is-valid');
            $("#passnew1").addClass('is-invalid');
            $("#passnew2").addClass('is-invalid');
            $("#clavesMensaje").fadeIn();
        }
    });
    $("#passnew1").change(function(){
        if($("#passnew2").val().length > 0){
            if(validaNuevaClave()){
                $("#clavesMensaje").fadeOut();
                $("#passnew1").removeClass('is-invalid');
                $("#passnew2").removeClass('is-invalid');
                $("#passnew1").addClass('is-valid');
                $("#passnew2").addClass('is-valid');
            }else{
                $("#passnew1").removeClass('is-valid');
                $("#passnew2").removeClass('is-valid');
                $("#passnew1").addClass('is-invalid');
                $("#passnew2").addClass('is-invalid');
                $("#clavesMensaje").fadeIn();
            }
        }
        
    });

    CargarGraficoIngresos();

    $("#selectIngPanel").change(function(){
        document.getElementById('chartIngresos').innerHTML = '';
        CargarGraficoIngresos();
    });

    $('#fechaIn').blur(function(){
        $("#fechaOut").prop('disabled', false);
        let fecha = new Date($('#fechaIn').val());
        fecha.setDate(fecha.getDate() + 2);
        let fecha2 = fecha.getFullYear()+'-'+fill((fecha.getMonth()+1),2)+'-'+fill(fecha.getDate(),2);

        $("#fechaOut").val(fecha2);
        $("#fechaOut").prop('min', fecha2);
        let monto = obtenervalor($('#fechaIn').val(), $('#fechaOut').val());
        $("#monto").val(monto);
        let reserva = revisarDisponibilidadReserva($("#cabanaform").val(), $('#fechaIn').val(), $('#fechaOut').val());
    });

    $('#fechaOut').blur(function(){
        let monto = obtenervalor($('#fechaIn').val(), $('#fechaOut').val());
        $("#monto").val(monto);
        let reserva = revisarDisponibilidadReserva($("#cabanaform").val(), $('#fechaIn').val(), $('#fechaOut').val());
    });

    $('#mfechaOut').blur(function(){
        //revisar reserva
        let reserva = revisarDisponibilidadReservaModificar($("#modcabanaformNew").val(), $('#mfechaIn').val(), $('#mfechaOut').val(), $('#ocModReserva').val());
    });

    $('#rut').blur(function(){
        let rut = $('#rut').val();
        const regex = /[a-zA-Z]/g

        rut = rut.replaceAll('.', '');
        rut = rut.replaceAll(regex, '');
        
        $('#rut').val(rut);
    });
    CargarDetalleDia();
    $("#fechaDetallePanel").change(function(){
        CargarDetalleDia();
    });
    let diax = new Date();
    diax.setDate(today.getDate() - 6);
    $('#desde').val(formatoAAAAMMDD(diax));
    $('#hasta').val(formatoAAAAMMDD(today));
    CargarReservas(formatoAAAAMMDD(diax),formatoAAAAMMDD(today));
});

function formatoAAAAMMDD(fecha){
    let fechabruto = new Date(fecha);
    let fecha2 = fechabruto.getFullYear()+'-'+fill((fechabruto.getMonth()+1),2)+'-'+fill(fechabruto.getDate(),2);
    return fecha2;
}
function formatoDDMMAAAA(fecha){
    let fechabruto = new Date(fecha);
    let fecha2 = fill(fechabruto.getDate(),2)+'-'+fill((fechabruto.getMonth()+1),2)+'-'+fechabruto.getFullYear();
    return fecha2;
}

function actualizarBuscarReservas(){
    let desde = $('#desde').val();
    let hasta = $('#hasta').val();

    CargarReservas(desde, hasta);
}

function CargarReservas(fechadesde, fechahasta){
    $.ajax({
        method: "POST",
        url: "/GetReservasFiltro",
        async: true,
        data: { desde: fechadesde, hasta: fechahasta},
        success: function(resp){
            //console.log(resp.length);
            let tabla = '';
            if(resp.length>0){
                for(i=0; i<resp.length;i++){
                    tabla += '<tr>';
                    tabla += '<td>'+resp[i].rut+'</td>';
                    tabla += '<td>'+resp[i].nombre+'</td>';
                    tabla += '<td>'+resp[i].cabana+'</td>';
                    tabla += '<td>'+resp[i].OC+'</td>';
                    tabla += '<td>'+formatoDDMMAAAA(resp[i].fecha_reserva)+'</td>';
                    tabla += '<td class="text-center"><button type="button" class="btn btn-warning" onclick="modificaReserva(\''+resp[i].OC+'\')"><i class="fa-solid fa-pen"></i></button> <button type="button" class="btn btn-danger" onclick="eliminarReserva(\''+resp[i].OC+'\')"><i class="fa-solid fa-trash"></i></button></td>';
                    tabla += '</tr>';
                }
                
            }else{
                tabla += '<tr>';
                tabla += '<td colspan="6" class="text-center">sin reservas...</td>'
                + '</tr>';
            }
            document.getElementById('tablaEliReservas').innerHTML = tabla;
        }
    });
}

function eliminarReserva(OC){
    let mensaje = '<p class="text-center">¿Seguro que desea eliminar la reserva OC: ' + OC + '?</p>';
    document.getElementById('mensajeEliminaReserva').innerHTML = mensaje;
    $('#ocEliReserva').val(OC);
    $("#delReservaModal").modal('show');
}

function modificaReserva(OC){
    $("#NoDispModReservaMensaje").hide();
    $("#NoDispModReservaMensaje2").hide();
    $('#SiDispModReservaMensaje').hide();
    $('#btnModificarReserva').prop('disabled', true);
    $('#ocModReserva').val(OC);
    $.ajax({
        method: "POST",
        url: "/ObtenerDatosReservaOC",
        async: true,
        data: { oc: OC},
        success: function(resp){
            //datos reserva
            let index_endreserva = resp.length - 1;
            let mfin = resp[0].fecha_reserva;
            let mfout = resp[index_endreserva].fecha_reserva;
            mfin = mfin.split('T')[0];
            mfout = mfout.split('T')[0];
            cabanaselectmod = resp[0].cabana;
            cabanaSeleccionarM(cabanaselectmod);
            $('#mfechaIn').val(mfin);
            $('#mfechaOut').val(mfout);
            $('#modcabanaformOriginal').val(resp[0].cabana);
            $('#modcabanaformNew').val(resp[0].cabana);
        }
    });
    $("#editReservaModal").modal('show');
}

function ModificarReservaConfirma(){
    const cabana_original = $('#modcabanaformOriginal').val();
    const cabana_new = $('#modcabanaformNew').val();
    
}

function ConfirmarEliminarReserva(){
    let oc_eliminar = $('#ocEliReserva').val();
    $.ajax({
        method: "POST",
        url: "/EliminaReserva",
        async: true,
        data: { oc: oc_eliminar},
        success: function(resp){
            //document.getElementById('tbodyDetallePanel').innerHTML = resp;
            $("#delReservaModal").modal('hide');
            actualizarBuscarReservas();
        }
    });

}

function CargarDetalleDia(){
    let dia = $("#fechaDetallePanel").val();
    $.ajax({
        method: "POST",
        url: "/consulta_dia",
        async: true,
        data: { fecha: dia},
        success: function(resp){
            document.getElementById('tbodyDetallePanel').innerHTML = resp;
        }
    });
}

function NewReservaManual(){
    $("#rut").val('');
    $("#nombre").val('');
    $("#correo").val('');
    $("#fono").val('');
    $("#monto").val('');
    $("#fechaOut").val('');
    $("#fechaOut").prop('disabled', true);
    $("#NoDispReservaMensaje").hide();
    $("#errorResManualMensaje").hide();

    $("#fechaOut").removeClass('is-invalid');
    $("#monto").removeClass('is-invalid');
    $("#rut").removeClass('is-invalid');
    $("#nombre").removeClass('is-invalid');
    $("#correo").removeClass('is-invalid');
    $("#fono").removeClass('is-invalid');

    cabanaselect = 1;
    cabanaSeleccionar(cabanaselect);
}

function revisarDisponibilidadReserva(cabana, fechaIn, fechaOut){
    let disponible = true;
    $.ajax({
        method: "POST",
        url: "/revisaDISP",
        async: true,
        data: { cabana: cabana, fechaIn: fechaIn, fechaOut: fechaOut },
        success: function(resp){
            if(resp.query[0].cuantasreservas == 0){
                //SI
                $('#btnReservaManual').prop('disabled', false);
                $("#NoDispReservaMensaje").hide();
                disponible = true;
            }else{
                //NO
                $('#btnReservaManual').prop('disabled', true);
                $("#NoDispReservaMensaje").show();
                disponible = false;
            }
        }
    });
    return disponible;
}

function revisarDisponibilidadReservaModificar(cabana, fechaIn, fechaOut, oc){
    let disponible = true;
    $.ajax({
        method: "POST",
        url: "/revisaDISPMod",
        async: true,
        data: { cabana: cabana, fechaIn: fechaIn, fechaOut: fechaOut, oc: oc },
        success: function(resp){
            if(resp.disponibilidad){
                //SI
                $('#btnModificarReserva').prop('disabled', false);
                $("#NoDispModReservaMensaje").hide();
                $("#NoDispModReservaMensaje2").hide();
                $('#SiDispModReservaMensaje').show();
                disponible = true;
            }else{
                //NO
                $('#btnModificarReserva').prop('disabled', true);
                $("#NoDispModReservaMensaje").show();
                $('#SiDispModReservaMensaje').hide();
                disponible = false;
                if(resp.mensaje != ''){
                    //tiene reserva temporal
                    document.getElementById('NoDispModReservaMensaje2').innerHTML = resp.mensaje;
                    $("#NoDispModReservaMensaje2").show();
                }
            }
        }
    });
    return disponible;
}

function GuardarReservaManual(){
    if(RevisaReservaManual()){
        const cabana = $("#cabanaform").val();
        const f_in = $("#fechaIn").val();
        const f_out = $("#fechaOut").val();
        const mount = $("#monto").val();
        const dni = $("#rut").val();
        const name = $("#nombre").val();
        const mail = $("#correo").val();
        const phone = $("#fono").val();

        $.ajax({
            method: "POST",
            url: "/ReservaManual",
            async: true,
            data: { cabanaform: cabana, fechaIn: f_in, fechaOut: f_out, monto: mount, rut: dni, nombre: name, correo: mail, fono: phone },
            success: function(resp){
                if(resp.affectedRows>0){
                    $("#errorResManualMensaje").hide();
                    //listo
                    $("#resManualModal").modal('hide');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    var mensaje = "Se ha ingresado exitosamente la reserva.";
                    document.getElementById('mensajetoast').innerHTML = mensaje;
                    $('#mensajepopup').toast('show');
                    
                }else{
                    $("#NoReservaManualMensaje").fadeIn();
                }
            }
        });

    }
    else{
        $("#errorResManualMensaje").show();
    }
}

function obtenervalor(fechaIn, fechaOut){
    let monto = 0;
    $.ajax({
        method: "POST",
        url: "/obtenervalor_reserva",
        async: false,
        data: { fechaIn: fechaIn, fechaOut: fechaOut },
        success: function(resp){
            monto = resp;
        }
    });

    return monto;
}

function RevisaReservaManual(){
    let validador = true;
    const fechaOut = $("#fechaOut").val();
    const monto = $("#monto").val();
    const rut = $("#rut").val();
    const nombre = $("#nombre").val();
    const correo = $("#correo").val();
    const fono = $("#fono").val();

    if(fechaOut == ''){
        validador = false;
        $("#fechaOut").addClass('is-invalid');
    }
    else{
        $("#fechaOut").removeClass('is-invalid');
    }

    if(monto <1){
        validador = false;
        $("#monto").addClass('is-invalid');
    }
    else{
        $("#monto").removeClass('is-invalid');
    }

    if(nombre.length < 1){
        $("#nombre").addClass('is-invalid');
        validador = false;
    }else{
        $("#nombre").removeClass('is-invalid');
    }

    var validEmail =  /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
    if (!validEmail.test(correo)){
        $("#correo").addClass('is-invalid');
        validador = false;
    }else{
        $("#correo").removeClass('is-invalid');
    }
 
    if(fono.length < 8 || fono.length > 9){
        $("#fono").addClass('is-invalid');
        validador = false;
    }else{
        $("#fono").removeClass('is-invalid');
    }

    if(rut.length < 9 || rut.length > 10){
        $("#rut").addClass('is-invalid');
        validador = false;
    }else{
        $("#rut").removeClass('is-invalid');
    }

    return validador;
}

function cabanaSeleccionar(id){
    $('#checkcab1').removeClass('active');
    $('#checkcab2').removeClass('active');
    $('#checkcab3').removeClass('active');
    $('#checkcab4').removeClass('active');
    $('#checkcab5').removeClass('active');
    cabanaselect = id;
    $('#cabanaform').val(id);
    $('#checkcab'+cabanaselect).addClass('active');
    if($('#fechaOut').val() != ''){
        let reserva = revisarDisponibilidadReserva(id, $('#fechaIn').val(), $('#fechaOut').val());
    }

}

function cabanaSeleccionarM(id){
    $('#btnModificarReserva').prop('disabled', true);
    $('#mcheckcab1').removeClass('active');
    $('#mcheckcab2').removeClass('active');
    $('#mcheckcab3').removeClass('active');
    $('#mcheckcab4').removeClass('active');
    $('#mcheckcab5').removeClass('active');
    cabanaselectmod = id;
    $('#modcabanaformNew').val(id);
    $('#mcheckcab'+cabanaselectmod).addClass('active');
    if($('#mfechaOut').val() != ''){
        let reserva = revisarDisponibilidadReservaModificar($("#modcabanaformNew").val(), $('#mfechaIn').val(), $('#mfechaOut').val(), $('#ocModReserva').val());
    }
}

function valoresCabanasModal(){
    const val_lun = $("#valorlun").val().replaceAll("$","").replaceAll(".", "");
    const val_mar = $("#valormar").val().replaceAll("$","").replaceAll(".", "");
    const val_mie = $("#valormie").val().replaceAll("$","").replaceAll(".", "");
    const val_jue = $("#valorjue").val().replaceAll("$","").replaceAll(".", "");
    const val_vie = $("#valorvie").val().replaceAll("$","").replaceAll(".", "");
    const val_sab = $("#valorsab").val().replaceAll("$","").replaceAll(".", "");
    const val_dom = $("#valordom").val().replaceAll("$","").replaceAll(".", "");
    
    $("#nvalor_lun").val(val_lun);
    $("#nvalor_mar").val(val_mar);
    $("#nvalor_mie").val(val_mie);
    $("#nvalor_jue").val(val_jue);
    $("#nvalor_vie").val(val_vie);
    $("#nvalor_sab").val(val_sab);
    $("#nvalor_dom").val(val_dom);
}
function ObtenerDataAnual(){
    const anioselect = $("#selectIngPanel").val();
    let data;
    $.ajax({
        method: "POST",
        url: "/obtenerVentasAnual",
        async: false,
        data: { anio: anioselect},
        success: function(resp){
            data = resp;
        }
    });
    return data;
}
function CargarGraficoIngresos(){
    let data_anual = ObtenerDataAnual();

    new Morris.Bar({
        // ID of the element in which to draw the chart.
        element: 'chartIngresos',
        // Chart data records -- each entry in this array corresponds to a point on
        // the chart.
        data: data_anual,
        /*data: [
            { "period": '2023-01', value: 200000 },
            { "period": '2023-02', value: 100000 },
            { "period": '2023-03', value: 500000 },
            { "period": '2023-04', value: 500000 },
            { "period": '2023-05', value: 100000 },
            { "period": '2023-06', value: 700000 },
            { "period": '2023-07', value: 120000 },
            { "period": '2023-08', value: 160000 },
            { "period": '2023-09', value: 190000 },
            { "period": '2023-10', value: 330000 },
            { "period": '2023-11', value: 270000 },
            { "period": '2023-12', value: 90000 },
        ],*/
        // The name of the data record attribute that contains x-values.
        xkey: 'period',
        // A list of names of data record attributes that contain y-values.
        ykeys: ['value'],
        // Labels for the ykeys -- will be displayed when you hover over the
        // chart.
        labels: ['Reservas'],
        resize: true,
        preUnits: '$'
      });
}

function CargarAniosSelectPanelIngreso(){
    let anio = aniovistaingreso - 5;
    let txtOptionSelect = "";
    
    while(anio <= aniovistaingreso){
        //console.log('año    '+anio);
        if(anio == aniovistaingreso){
            txtOptionSelect += "<option value=\""+anio+"\" selected>"+anio+"</option>";
        }else{
            txtOptionSelect += "<option value=\""+anio+"\">"+anio+"</option>";
        }
        anio++;
    }
    document.getElementById('selectIngPanel').innerHTML = txtOptionSelect;
    //document.getElementById('selectResPanel').innerHTML = txtOptionSelect;
}

function validaNuevaClave(){
    var clave1 = $("#passnew1").val();
    var clave2 = $("#passnew2").val();

    if(clave1 == clave2){
        return true;
    }
    else{
        return false;
    }
}

function resetCC(){
    $("#clavesMensaje").hide();
    $("#passnew1").removeClass('is-invalid');
    $("#passnew2").removeClass('is-invalid');
    $("#passnew1").removeClass('is-valid');
    $("#passnew2").removeClass('is-valid');
    $("#pass").val('');
    $("#passnew1").val('');
    $("#passnew2").val('');
}

function resetBotonesPanel(){
    $("#btnIngresosPanel").removeClass('btn-warning');
    $("#btnReservasPanel").removeClass('btn-warning');
    $("#btnDetallaPanel").removeClass('btn-warning');

    $("#btnIngresosPanel").addClass('btn-outline-warning');
    $("#btnReservasPanel").addClass('btn-outline-warning');
    $("#btnDetallaPanel").addClass('btn-outline-warning');
}

function VerIngresosPanel(){
    resetBotonesPanel();
    $("#btnIngresosPanel").addClass('btn-warning');

    $("#reservasPanel").hide();
    $("#detallePanel").hide();
    $("#ingresosPanel").fadeIn();
}

function VerReservasPanel(){
    resetBotonesPanel();
    $("#btnReservasPanel").addClass('btn-warning');

    $("#ingresosPanel").hide();
    $("#detallePanel").hide();
    $("#reservasPanel").fadeIn();
}

function VerDetallePanel(){
    resetBotonesPanel();
    $("#btnDetallaPanel").addClass('btn-warning');

    $("#reservasPanel").hide();
    $("#ingresosPanel").hide();
    $("#detallePanel").fadeIn();
}

function CambiarValorCabana(){
    let nvalor_lun = $("#nvalor_lun").val().replaceAll(".", "");
    let nvalor_mar = $("#nvalor_mar").val().replaceAll(".", "");
    let nvalor_mie = $("#nvalor_mie").val().replaceAll(".", "");
    let nvalor_jue = $("#nvalor_jue").val().replaceAll(".", "");
    let nvalor_vie = $("#nvalor_vie").val().replaceAll(".", "");
    let nvalor_sab = $("#nvalor_sab").val().replaceAll(".", "");
    let nvalor_dom = $("#nvalor_dom").val().replaceAll(".", "");
    if(nvalor_lun == '') { nvalor_lun = 0; }
    if(nvalor_mar == '') { nvalor_mar = 0; }
    if(nvalor_mie == '') { nvalor_mie = 0; }
    if(nvalor_jue == '') { nvalor_jue = 0; }
    if(nvalor_vie == '') { nvalor_vie = 0; }
    if(nvalor_sab == '') { nvalor_sab = 0; }
    if(nvalor_dom == '') { nvalor_dom = 0; }

    $.ajax({
        method: "POST",
        url: "/cambioPrecioCabana",
        async: true,
        data: { val_lun: nvalor_lun, val_mar: nvalor_mar, val_mie: nvalor_mie, val_jue: nvalor_jue, val_vie: nvalor_vie, val_sab: nvalor_sab, val_dom: nvalor_dom},
        success: function(resp){
            //console.log(resp.affectedRows);
            if(resp.affectedRows>0){
                //$("#valorcabana").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valorcabana));
                $("#valorlun").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(nvalor_lun));
                $("#valormar").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(nvalor_mar));
                $("#valormie").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(nvalor_mie));
                $("#valorjue").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(nvalor_jue));
                $("#valorvie").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(nvalor_vie));
                $("#valorsab").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(nvalor_sab));
                $("#valordom").val(new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(nvalor_dom));

                $("#cambioValorCabanaModal").modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();

                var mensaje = "Se ha cambiado precio de cabañas exitosamente.";
                document.getElementById('mensajetoast').innerHTML = mensaje;

                $('#mensajepopup').toast('show');
            }else{
                $("#ValorCambioMensaje").fadeIn();
            }
        }
    });
}

function CambiarPass(){
    var clave1 = $("#passnew1").val();
    if(validaNuevaClave()){
        $.ajax({
            method: "POST",
            url: "/CambioPass",
            async: true,
            data: { newpass: clave1},
            success: function(resp){
                if(resp.affectedRows>0){
                    $("#NocambioMensaje").hide();
                    $("#cambioclaveModal").modal('hide');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    $("#passnew1").val('');
                    $("#passnew2").val('');
                    var mensaje = "Se ha cambiado su contraseña exitosamente.";
                    document.getElementById('mensajetoast').innerHTML = mensaje;

                    $('#mensajepopup').toast('show');
                }else{
                    $("#NocambioMensaje").fadeIn();
                }
            }
        });
    }
}