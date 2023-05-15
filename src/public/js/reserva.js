let cabanaselect = 1;
let ocupaciones = Array();

const fill = (number, len) =>
  "0".repeat(len - number.toString().length) + number.toString();

$(document).ready(function(){
    obtenerOcupaciones();
    $('#navReserva').addClass('active');
    $('#navGaleria').removeClass('active');
    $('#navInicio').removeClass('active');
    $('#navContacto').removeClass('active');
    $('#checkcab'+cabanaselect).addClass('active');

    $('#fechaIn').blur(function(){
        $("#fechaOut").prop('disabled', false);
        let fecha = new Date($('#fechaIn').val());
        fecha.setDate(fecha.getDate() + 3);
        let fecha2 = fecha.getFullYear()+'-'+fill((fecha.getMonth()+1),2)+'-'+fill(fecha.getDate(),2);
        //console.log("fecha2 "+fecha2)
        $("#fechaOut").val(fecha2);
        $("#fechaOut").prop('min', fecha2);
    });

    $('#rut').blur(function(){
        let rut = $('#rut').val();
        const regex = /[a-zA-Z]/g

        rut = rut.replaceAll('.', '');
        rut = rut.replaceAll(regex, '');
        
        $('#rut').val(rut);
    });

    $('#fechaIn').change(function(){
        resetDisponibilidad();
    });
    $('#fechaOut').change(function(){
        resetDisponibilidad();
    });
    $('#checkcab1').click(function(){
        resetDisponibilidad();
    });
    $('#checkcab2').click(function(){
        resetDisponibilidad();
    });
    $('#checkcab3').click(function(){
        resetDisponibilidad();
    });
    $('#checkcab4').click(function(){
        resetDisponibilidad();
    });
    $('#checkcab5').click(function(){
        resetDisponibilidad();
    });
});

function obtenerOcupaciones(){
    const fecha = new Date();
    const mesActual = fecha.getMonth() + 1; 
    const anio = fecha.getFullYear();
    const dia = fecha.getDate();
    $.ajax({
        method: "POST",
        url: "/ObtenerReservas",
        async: true,
        data: { dia: dia, mesActual: mesActual, anio: anio},
        success: function(resp){
            //console.log(resp);
            ocupaciones = resp;
            var calendarEl = document.getElementById('calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                //height: 500,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: ''
                },
                firstDay: 1,
                locales: 'es',
                events: ocupaciones
            });
            calendar.render();
        }
    });
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
}

function revisarDisponibilidad(){
    //alert($('#btnDisp').text());
    document.getElementById("btnDisp").innerHTML = 'Revisando <i class="fa-solid fa-spinner fa-spin"></i>';
    //$('#btnDisp').text('Revisando <i class="fa-solid fa-spinner fa-spin"></i>');
    const cabana = cabanaselect;
    const fechaIn = $('#fechaIn').val();
    let fechaOut = $('#fechaOut').val();
    if(fechaOut == '') { 
        let fecha = new Date($('#fechaIn').val());
        fecha.setDate(fecha.getDate() + 3);
        let fecha2 = fecha.getFullYear()+'-'+fill((fecha.getMonth()+1),2)+'-'+fill(fecha.getDate(),2);
        $('#fechaOut').val(fecha2); 
        fechaOut = fecha2;
        $("#fechaOut").prop('min', fecha2);
    }
    $("#fechaOut").prop('disabled', false);
    $.ajax({
        method: "POST",
        url: "/revisaDISP",
        async: true,
        data: { cabana: cabana, fechaIn: fechaIn, fechaOut: fechaOut },
        success: function(resp){
            if(resp.query[0].cuantasreservas == 0){
                //console.log('dias de reserva = '+resp.cuantos);
                $('#cuantos_dias').val(resp.cuantos);
                okDisponibilidad(true, fechaIn, fechaOut);
            }else{
                if(resp.reservastemporales >0){
                    document.getElementById('posiblesFechas').innerHTML = resp.cabanasdisponiblesrf;
                    okDisponibilidad(false, fechaIn, fechaOut);
                }
                else{
                    document.getElementById('posiblesFechas').innerHTML = '';
                    if(resp.cdrf>0){
                        let textSugerencias = "<br>";
                        textSugerencias = textSugerencias + resp.cabanasdisponiblesrf;
                        document.getElementById('posiblesFechas').innerHTML += textSugerencias;
                    }
                    //otrasfechasDisp
                    document.getElementById('posiblesFechas').innerHTML += resp.otrasfechasDisp;
                    okDisponibilidad(false, fechaIn, fechaOut);
                }
                
            }
        }
    });
    //okDisponibilidad(true);
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

function okDisponibilidad(estado, fechaIn, fechaOut){
    $("#revisando").show();
    //let monto = $('#cuantos_dias').val() * 50000;
    let monto = obtenervalor(fechaIn, fechaOut);
    
    let montoformato = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
    if(estado){
        $("#mensajeNO").hide();
        $("#posiblesFechas").hide();
        $("#btnDisp").prop('disabled', true);
        $("#mensajeOK").fadeIn(1000);
        $("#reservaDatos").fadeIn(1200);
        document.getElementById("mensajeOK").innerHTML = 'Cabaña disponible para reservar!<br> Check In el <strong>'+fechaIn+'</strong> a las <strong>14:00 PM</strong>'
        +'<br>Check Out el <strong>'+fechaOut+'</strong> a las <strong>11:30 AM</strong>'
        +'<br>Monto a cancelar('+$('#cuantos_dias').val()+' noches): <strong>'+montoformato+'</strong>'
        +'<br><br>Tienes 4 minutos para pagar reserva, sin que te quiten el cupo.';
    }else{
        $("#reservaDatos").hide();
        $("#mensajeNO").fadeIn(1000);
        $("#posiblesFechas").fadeIn(1200);
        
    }
    document.getElementById("btnDisp").innerHTML = 'Ver disponibilidad';
}

function resetDisponibilidad(){
    $("#revisando").hide();
    $("#mensajeNO").hide();
    $("#posiblesFechas").hide();
    $("#mensajeOK").hide();
    $("#reservaDatos").hide();
    $("#btnDisp").prop('disabled', false);
}

function ReservarFecha(){
    //$("#btnReservar").prop('disabled', true);
    const cabana = cabanaselect;
    
    const fechaIn = $('#fechaIn').val();
    const fechaOut = $('#fechaOut').val();
    const nombre = $('#nombre').val();
    const rut = $('#rut').val();
    const fono = $('#fono').val();
    const correo = $('#correo').val();
    const cuantosdias = $('#cuantos_dias').val();
    if(validador_formpago()){
        document.formreserva.submit();
        
    }

}
function validador_formpago(){
    let validador = true;
    const nombre = $("#nombre").val();
    const correo = $("#correo").val();
    const fono = $("#fono").val();
    const rut = $("#rut").val();
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
