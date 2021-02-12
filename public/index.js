$(document).ready(function() {
    params = getHashParams();

    var access_token = params.access_token;

    if (access_token) {
        $("#login").hide();
        $("#links").show();
    } else {
        $("#login").show();
        $("#links").hide();
    }
});

function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}