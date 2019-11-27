let propertyData;
let isFirstRun = true;
let map;
let markers = [];
let infowindow;
let bounds;
let copenhagen = {
    lat: 55.676098,
    lng: 12.568337
};
let isMapZoomedOut = false;

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

    getMapData('../../data/data1.json', onDataLoaded);
}

// render markers
function renderMapMarkers(data) {
    bounds = new google.maps.LatLngBounds();

    // loop through all properties and render markers
    if (data.length) {
        // if any properties in data
        for (var i = 0; i < data.length; i++) {
            const elem = data[i];

            markers[i] = new google.maps.Marker({
                position: new google.maps.LatLng(elem.latLon.lat, elem.latLon.lon),
                map: map,
                description: elem.address1,
                content: `<div><span class="map__infoheader">${elem.address1}</span></div><div class="map__infogroup--spacer">${elem.zipCode.zipCodeId} ${elem.zipCode.name}</div><div class="map__infogroup--spacer">Type: ${elem.propertyType.name}</div><div class="map__infogroup--spacer">Antal værelser: ${elem.totalNumberOfRooms}</div><div class="map__infogroup--spacer">Pris: ${elem.price}</div><div class="map__infogroup--spacer">Mægler: ${elem.broker.brokerName}</div>`,
                id: i
            });

            google.maps.event.addListener(markers[i], 'click', function (e) {
                const ContentString = this.contentString;
                infowindow.setContent(this.content);
                infowindow.open(map, markers[this.id]);
            });

            bounds.extend(markers[i].position);
        }

        if (isMapZoomedOut) {
            map.fitBounds(bounds);
            map.setZoom(13);
        }
    } else {
        // if no markers zoom out
        map.setCenter(new google.maps.LatLng(copenhagen.lat, copenhagen.lng));

        map.setZoom(11);

        isMapZoomedOut = true;
    }
}

// removes existing map markers
function clearMarkers(m) {
    for (var i = 0; i < m.length; i++) {
        m[i].setMap(null);
    }
    m.length = 0;
}

// load JSON data
function getMapData(url, callback) {
    const xobj = new XMLHttpRequest();

    xobj.overrideMimeType("application/json");

    xobj.open('GET', url, true);

    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            if (xobj.status == "200") {
                callback(xobj.responseText);
            } else {
                console.log(`Error: ${xobj.statusText}`);
            }
        }
    };

    xobj.send(null);
}

function onDataLoaded(response) {
    var data = JSON.parse(response);

    propertyData = data;

    if (isFirstRun) {
        buildButtons();

        buildFilterForm();

        isFirstRun = false;
    }

    // update filterform acording to current data
    updateForm(data);

    // remove existing markers
    clearMarkers(markers);

    // render map
    renderMapMarkers(data);

    map.fitBounds(bounds);
}

// build JSON data buttons
function buildButtons() {
    const btnList = document.getElementsByClassName('button__data');

    // apply eventlisterne to top/right data buttons 
    for (let i = 0; i < btnList.length; i++) {
        btnList[i].addEventListener('click', onDataButtonClick);
    }
}

function onDataButtonClick(e) {
    const dataUrl = e.target.getAttribute('data-url');

    getMapData(dataUrl, onDataLoaded);
}

// build filterform and apply eventlisteners and handlers
function buildFilterForm() {
    const selectDropdownList = document.getElementsByTagName('select');
    const checkboxList = document.getElementsByClassName('form-check-input');

    document.getElementById('filter_address').addEventListener('keyup', onFormFieldChange);

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
    clearMarkers(markers);

    // render map
    renderMapMarkers(filteredData);
}

// update filterform according to data
function updateForm(data) {
    // render select "type"
    // get all unique property types from data
    const types = [...new Set(data.map(item => item.propertyType.name))];
    const typesId = [...new Set(data.map(item => item.propertyType.propertyTypeId))];
    renderSelect(document.getElementById('filter_type'), getDataItemSorted(types, typesId));

    // render select "rooms"
    // get all unique rooms from data
    const roomsTotal = [...new Set(data.map(item => item.totalNumberOfRooms))];
    renderSelect(document.getElementById('filter_roomstotal'), getDataItemSorted(roomsTotal));

    // render select "broker"
    // get all unique brokers from data
    const brokerName = [...new Set(data.map(item => item.broker.brokerName))];
    const brokerId = [...new Set(data.map(item => item.broker.brokerId))];
    renderSelect(document.getElementById('filter_broker'), getDataItemSorted(brokerName, brokerId));

    document.getElementById('filter_address').value = '';
}

function renderSelect(select, textobj) {
    const emptyOpt = document.createElement('option');

    // remove all existing options
    clearSelectOptions(select);

    // first option empty
    emptyOpt.innerHTML = '';

    select.appendChild(emptyOpt);

    // add options to select
    for (var i = 0; i < textobj.length; i++) {
        const opt = document.createElement('option');
        opt.value = textobj[i].val;
        opt.innerHTML = textobj[i].label;
        select.appendChild(opt);
    }
}

// clear all options from select
function clearSelectOptions(select) {
    for (i = select.options.length - 1; i >= 0; i--) {
        select.remove(i);
    }
}

// returns filtered data on form change
function getFilteredData() {
    let tmpFilterArr = propertyData,
        resultArr = [],
        priceArr1 = [],
        priceArr2 = [],
        formfieldsData = getFormData();
        
    if (formfieldsData.filter_address) {
        tmpFilterArr = tmpFilterArr.filter(function (el) {
            return (el.address1).toLowerCase().indexOf((formfieldsData.filter_address).toLowerCase()) > -1;
        });
    }

    if (formfieldsData.filter_type) {
        tmpFilterArr = tmpFilterArr.filter(function (el) {
            return el.propertyType.propertyTypeId == formfieldsData.filter_type;
        });
    }

    if (formfieldsData.filter_roomstotal) {
        tmpFilterArr = tmpFilterArr.filter(function (el) {
            return el.totalNumberOfRooms == formfieldsData.filter_roomstotal;
        });
    }

    if (formfieldsData.filter_broker) {
        tmpFilterArr = tmpFilterArr.filter(function (el) {
            return el.broker.brokerId == formfieldsData.filter_broker;
        });
    }

    if (formfieldsData.filter_price1) {
        priceArr1 = tmpFilterArr.filter(function (el) {
            return parseInt(el.price) <= 4000000;
        });
    }

    if (formfieldsData.filter_price2) {
        priceArr2 = tmpFilterArr.filter(function (el) {
            return parseInt(el.price) > 4000000;
        });
    }

    // combine temp price arrays into one array
    if (formfieldsData.filter_price1 || formfieldsData.filter_price2) {
        resultArr = [...priceArr1, ...priceArr2];
    } else {
        resultArr = tmpFilterArr;
    }

    return resultArr;
}

// returns object with form element value
// assigned to form element id for better overview
function getFormData() {
    const formfieldsData = {};
    const inpList = document.getElementsByClassName('frm__inp');

    [...inpList].forEach((elem) => {
        if (elem.getAttribute('type') === 'checkbox') {
            formfieldsData[elem.getAttribute('id')] = elem.checked;
        } else if (elem.getAttribute('id') === 'filter_address') {
            formfieldsData[elem.getAttribute('id')] = elem.value;
        } else {
            formfieldsData[elem.getAttribute('id')] = elem.value != '' ? elem.value : null;
        }
    });
    return formfieldsData;
}

// returns sorted select dropdown data
function getDataItemSorted(labelarr, valarr = null) {
    let arr = [];
    for (let i = 0; i < labelarr.length; i++) {
        arr.push({
            label: labelarr[i],
            val: valarr ? valarr[i] : labelarr[i]
        });
    }
    return arr.sort(sortObject);
}

function sortObject(a, b) {
    if (a.label < b.label) {
        return -1;
    }
    if (a.label > b.label) {
        return 1;
    }
    return 0;
}