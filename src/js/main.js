// initialize Google Maps
function initMap() {
    const uluru = {
        lat: -25.344,
        lng: 131.036
    };
    
    const map = new google.maps.Map(
        document.getElementById('map'), {
            zoom: 4,
            center: uluru
        });
    
        const marker = new google.maps.Marker({
        position: uluru,
        map: map
    });
}

function onDataButtonClick(e) {
    const dataUrl = e.target.getAttribute('data-url');

    getMapData(dataUrl, onDataLoaded);
}

function buildButtons() {
    const btnList = document.getElementsByClassName('button__data');

    // apply eventlisterne to top/right data buttons 
    for (let i = 0; i < btnList.length; i++) {
        const b = btnList[i];
        b.addEventListener('click', onDataButtonClick);
    }
}

function onDataLoaded(response){
    // parse json
    var data = JSON.parse(response);

    // render map
    renderMap(data);
}

function getMapData(url, callback) {
    const xobj = new XMLHttpRequest();

    xobj.overrideMimeType("application/json");

    xobj.open('GET', url, true);

    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            if(xobj.status == "200"){
                // on success call callback method
                callback(xobj.responseText);                
            }else{
                // very simple error handling
                console.log(`Error: ${xobj.statusText}`);
            }
        }
    };

    xobj.send(null);
}

function renderMap(data){
    console.log(data);
}

function init() {
    buildButtons();

    getMapData('../../data/data1.json', onDataLoaded);
}

init();