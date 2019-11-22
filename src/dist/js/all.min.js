let map;
let markers = [];
let infowindow;
let propertyData;

// initialize Google Maps
function initMap() {
    const denmark = {
        lat: 56.2639198,
        lng: 9.5017853
    };

    map = new google.maps.Map(
        document.getElementById('map'), {
            center: denmark
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
    renderMapMarkers(filteredData.length ? filteredData : propertyData);
}

function getFilteredData(elem) {
    let filterarr = [];

    const formfieldsData = {
        filter_type: document.getElementById('filter_type').value != '' ? document.getElementById('filter_type').value : null,
        filter_roomstotal: document.getElementById('filter_roomstotal').value != '' ? document.getElementById('filter_roomstotal').value : null,
        filter_broker: document.getElementById('filter_broker').value != '' ? document.getElementById('filter_broker').value : null
    };

    for (let i = 0; i < propertyData.length; i++) {
        let add = false;
        const o = propertyData[i];

        if (formfieldsData.filter_type) {
            if (String(o.propertyType.propertyTypeId) == formfieldsData.filter_type) {
                add = true;
            }
        }
        if (formfieldsData.filter_roomstotal) {
            if (String(o.totalNumberOfRooms) == formfieldsData.filter_roomstotal) {
                add = true;
            }
        }
        if (formfieldsData.filter_broker) {
            if (String(o.broker.brokerId) == formfieldsData.filter_broker) {
                add = true;
            }
        }
        if (add) {
            filterarr.push(o);
        }
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