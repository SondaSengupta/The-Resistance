$(function(){
    var socket = io();
    var qr = document.getElementById("qrcode")
    if(qr){
        new QRCode(qr, location.href + '/play');
    }
});
