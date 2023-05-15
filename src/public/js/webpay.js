
$(document).ready(function(){
    $('#navReserva').addClass('active');
    $('#navGaleria').removeClass('active');
    $('#navInicio').removeClass('active');
    $('#navContacto').removeClass('active'); 
});

function pagar(){
    document.formpagar.submit();
}