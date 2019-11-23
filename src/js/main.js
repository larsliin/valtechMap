let map;
let markers = [];
let infowindow;
let propertyData;
let bounds;
let copenhagen = { lat: 55.676098, lng: 12.568337 };
const isFitBounds = false;

// initialize Google Maps
function initMap() {
    map = new google.maps.Map(
        document.getElementById('map'), {
            center: copenhagen,
            zoom: 13
          });

    // show map when tiles are loaded
    google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
        document.getElementById('map').classList.add('visible');
    });

    // create infowindow
    infowindow = new google.maps.InfoWindow({
        maxWidth: 250
    });

    // load data when map is ready
    getMapData('../../data/data1.json', onDataLoaded);
}

// render markers
function renderMapMarkers(data) {
    bounds = new google.maps.LatLngBounds();

    // loop through all properties and render markers
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
        if(isFitBounds){
            map.fitBounds(bounds);
        }
    } else {
        map.setCenter(new google.maps.LatLng(copenhagen.lat, copenhagen.lng));

        map.setZoom(11);
    }
}

// removes existing map markers
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;
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

// on JSON data loaded callback
function onDataLoaded(response) {
    // parse json
    var data = JSON.parse(response);
    
    propertyData = data;

    // update filterform acording to current data
    updateForm(data);

    // remove existing markers
    clearMarkers();

    // render map
    renderMapMarkers(data);

    // 
    if(!isFitBounds){
        map.fitBounds(bounds);
    }
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

// on load JSON button click
function onDataButtonClick(e) {
    const dataUrl = e.target.getAttribute('data-url');

    getMapData(dataUrl, onDataLoaded);
}

// build filterform and apply eventlisteners and handlers
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

function onFormFieldChange(event) {
    const filteredData = getFilteredData();

    // remove existing markers
    clearMarkers(event.currentTarget);

    // render map
    renderMapMarkers(filteredData);
}

// update filterform according to data
function updateForm(data) {
    // render select "type"
    // get all unique property types from data
    const types = [...new Set(data.map(item => item.propertyType.name))];
    const typesId = [...new Set(data.map(item => item.propertyType.propertyTypeId))];
    
    renderSelect(document.getElementById('filter_type'), types, typesId);

    // render select "rooms"
    // get all unique rooms from data
    const roomsTotal = [...new Set(data.map(item => item.totalNumberOfRooms))];
    renderSelect(document.getElementById('filter_roomstotal'), roomsTotal);

    // render select "broker"
    // get all unique brokers from data
    const brokerName = [...new Set(data.map(item => item.broker.brokerName))];
    const brokerId = [...new Set(data.map(item => item.broker.brokerId))];

    renderSelect(document.getElementById('filter_broker'), brokerName, brokerId);

    document.getElementById('search').value = '';
}

function renderSelect(select, textobj, valueobj = null) {
    const emptyOpt = document.createElement('option');

    // remove all existing options
    clearSelectOptions(select);

    // push textstring and values into array of objects for sorting and better transparancy
    let o = [];
    for (let i = 0; i < textobj.length; i++) {
        const label = textobj[i];
        const val = valueobj ? valueobj[i] : textobj[i];
        o.push({label: textobj[i], val: val});        
    }

    // harcode first option
    emptyOpt.innerHTML = '';

    select.appendChild(emptyOpt);

    // add options to select
    for (var i = 0; i < o.length; i++) {
        const opt = document.createElement('option');
        opt.value = o[i].val ? o[i].val : o[i].label;
        opt.innerHTML = o[i].label;
        select.appendChild(opt);
    }
}

// clear all options from select
function clearSelectOptions(select) {
    for (i = select.options.length - 1; i >= 0; i--) {
        select.remove(i);
    }
}

// returns filtered data
function getFilteredData(elem) {
    let filterarr = propertyData;

    const formfieldsData = {
        filter_address: document.getElementById('search').value != '' ? document.getElementById('search').value : null,
        filter_type: document.getElementById('filter_type').value != '' ? document.getElementById('filter_type').value : null, // propertyType.propertyTypeId
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
    let resultarr = [];
    let p1 = [];
    let p2 = [];
    if (formfieldsData.filter_price1) {
        p1 = filterarr.filter(function (el) {
            return parseInt(el.price) <= 4000000;
        });
    }


    if (formfieldsData.filter_price2) {
        p2 = filterarr.filter(function (el) {
            return parseInt(el.price) > 4000000;
        });
    }
    
    if(p1.length || p2.length){
        resultarr = [...p1, ...p2];
    }else{
        resultarr = filterarr;
    }

    return resultarr;
}

// run
function init() {
    buildButtons();

    buildFilterForm();
}

init();