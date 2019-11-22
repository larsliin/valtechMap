let map;
let markers = [];
let infowindow;
let propertyData;
const copenhagen = {
    lat: 55.676098,
    lng: 12.568337
};

// initialize Google Maps
function initMap() {

    map = new google.maps.Map(
        document.getElementById('map'), {
            center: copenhagen
        });

    // show map when tiles are loaded
    google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
        document.getElementById('map').classList.add('visible');
    });

    // create infowindow
    infowindow = new google.maps.InfoWindow({
        maxWidth: 250
    });

    getMapData('../../data/data1.json', onDataLoaded);
}

// removes existing map markers
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;
}

// render markers
function renderMapMarkers(data) {
    const bounds = new google.maps.LatLngBounds();

    if (data.length) {
        for (var i = 0; i < data.length; i++) {
            const elem = data[i];
            const latLon = elem.latLon;
            const pos = new google.maps.LatLng(latLon.lat, latLon.lon);
            const contentString = `<div><span class="map__infoheader">${elem.address1}</span></div><div class="map__infogroup--spacer">${elem.zipCode.zipCodeId} ${elem.zipCode.name}</div><div class="map__infogroup--spacer">Type: ${elem.propertyType.name}</div><div class="map__infogroup--spacer">Antal værelser: ${elem.totalNumberOfRooms}</div><div class="map__infogroup--spacer">Pris: ${elem.price}</div><div class="map__infogroup--spacer">Mægler: ${elem.broker.brokerName}</div>`;

            markers[i] = new google.maps.Marker({
                position: pos,
                map: map,
                description: elem.address1,
                content: contentString,
                id: i
            });

            google.maps.event.addListener(markers[i], 'click', function (e) {
                const ContentString = this.contentString;
                infowindow.setContent(this.content);
                infowindow.open(map, markers[this.id]);
            });

            bounds.extend(markers[i].position);
        }
        map.fitBounds(bounds);
    } else {
        map.setCenter(new google.maps.LatLng(copenhagen.lat, copenhagen.lng));

        map.setZoom(11);
    }
}

// on load JSON button click
function onDataButtonClick(e) {
    const dataUrl = e.target.getAttribute('data-url');

    getMapData(dataUrl, onDataLoaded);
}

// build JSON data buttons
function buildButtons() {
    const btnList = document.getElementsByClassName('button__data');

    // apply eventlisterne to top/right data buttons 
    for (let i = 0; i < btnList.length; i++) {
        const b = btnList[i];
        b.addEventListener('click', onDataButtonClick);
    }
}

function buildFilterForm() {
    const selectDropdownList = document.getElementsByTagName('select');
    const checkboxList = document.getElementsByClassName('form-check-input');

    document.getElementById('search').addEventListener('keyup', onFormFieldChange);

    for (let i = 0; i < selectDropdownList.length; i++) {
        const element = selectDropdownList[i];
        element.addEventListener('change', onFormFieldChange);
    }

    for (let i = 0; i < checkboxList.length; i++) {
        const element = checkboxList[i];
        element.addEventListener('change', onFormFieldChange);
    }
}

function renderSelect(select, textobj, valueobj = null) {
    const emptyOpt = document.createElement('option');

    // remove all existing options
    clearSelectOptions(select);

    // harcode first option
    emptyOpt.innerHTML = '';

    select.appendChild(emptyOpt);

    // add options to select
    for (var i = 0; i < textobj.length; i++) {
        const opt = document.createElement('option');
        opt.value = valueobj ? valueobj[i] : textobj[i];
        opt.innerHTML = textobj[i];
        select.appendChild(opt);
    }
}

// update filterform according to data
function updateForm(data) {
    // render select "type"
    const types = [...new Set(data.map(item => item.propertyType.name))];
    const typesId = [...new Set(data.map(item => item.propertyType.propertyTypeId))];

    renderSelect(document.getElementById('filter_type'), types, typesId);

    // render select "rooms"
    const roomsTotal = [...new Set(data.map(item => item.totalNumberOfRooms))];
    renderSelect(document.getElementById('filter_roomstotal'), roomsTotal);

    // render select "broker"
    const brokerName = [...new Set(data.map(item => item.broker.brokerName))];
    const brokerId = [...new Set(data.map(item => item.broker.brokerId))];

    renderSelect(document.getElementById('filter_broker'), brokerName, brokerId);

    document.getElementById('search').value = '';
}

// clear all options from select
function clearSelectOptions(select) {
    for (i = select.options.length - 1; i >= 0; i--) {
        select.remove(i);
    }
}

function onFormFieldChange(event) {
    const filteredData = getFilteredData();

    console.log(filteredData);

    // remove existing markers
    clearMarkers(event.currentTarget);

    // render map
    renderMapMarkers(filteredData);
}

function getFilteredData(elem) {
    let filterarr = propertyData;

    const formfieldsData = {
        filter_address: document.getElementById('search').value != '' ? document.getElementById('search').value : null,
        filter_type: document.getElementById('filter_type').value != '' ? document.getElementById('filter_type').value : null, /// propertyType.propertyTypeId
        filter_roomstotal: document.getElementById('filter_roomstotal').value != '' ? document.getElementById('filter_roomstotal').value : null, // totalNumberOfRooms
        filter_broker: document.getElementById('filter_broker').value != '' ? document.getElementById('filter_broker').value : null, // broker.brokerId
        filter_price1: document.getElementById('check1').checked,
        filter_price2: document.getElementById('check2').checked
    };
    
    if (formfieldsData.filter_address) {
        filterarr = filterarr.filter(function (el) {
            return (el.address1).toLowerCase().indexOf((formfieldsData.filter_address).toLowerCase()) > -1;
        });
    }

    if (formfieldsData.filter_type) {
        filterarr = filterarr.filter(function (el) {
            return el.propertyType.propertyTypeId == formfieldsData.filter_type;
        });
    }

    if (formfieldsData.filter_roomstotal) {
        filterarr = filterarr.filter(function (el) {
            return el.totalNumberOfRooms == formfieldsData.filter_roomstotal;
        });
    }

    if (formfieldsData.filter_broker) {
        filterarr = filterarr.filter(function (el) {
            return el.broker.brokerId == formfieldsData.filter_broker;
        });
    }

    if (formfieldsData.filter_price1) {
        filterarr = filterarr.filter(function (el) {
            return parseInt(el.price) <= 4000000;
        });
    }

    if (formfieldsData.filter_price2) {
        filterarr = filterarr.filter(function (el) {
            return parseInt(el.price) > 4000000;
        });
    }

    return filterarr;
}

// on JSON data loaded callback
function onDataLoaded(response) {
    // parse json
    var data = JSON.parse(response);
    propertyData = data;

    updateForm(data);

    // remove existing markers
    clearMarkers();

    // render map
    renderMapMarkers(data);

    console.log(data);
}

// load JSON data
function getMapData(url, callback) {
    const xobj = new XMLHttpRequest();

    xobj.overrideMimeType("application/json");

    xobj.open('GET', url, true);

    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            if (xobj.status == "200") {
                // on success call callback method
                callback(xobj.responseText);
            } else {
                // very simple error handling
                console.log(`Error: ${xobj.statusText}`);
            }
        }
    };

    xobj.send(null);
}

// run
function init() {
    buildButtons();

    buildFilterForm();
}

init();