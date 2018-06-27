function guilty() {
    console.log(id);
    console.log("guilty");
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "/aotrain/guilty?id=" + id, false); // false for synchronous request
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);
    location.reload();
}

function innocent() {
    console.log(id);
    console.log("innocent");
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "/aotrain/innocent?id=" + id, false); // false for synchronous request
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);
    location.reload();
}