const SEARCH_TYPES = {
  REGEX: "REGEX",
  LIKE: "LIKE",
  SELECT: "SELECT",
  EXACT: "EXACT",
  ALL: "__all",
  INPUT: "INPUT",
};

const dataMap = {};
let unnamedCount = 1;
const states = {};
states[SEARCH_TYPES.ALL] = {};

function save(id) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', `http://localhost:3500/${id}`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      if (xhr.status === 200) {
          var userInfo = JSON.parse(xhr.responseText);
      }
  };
  xhr.send(JSON.stringify(dataMap[id].data));
}

function getRating(text, userValue, type) {
  let asStr = String(text);
  switch (type) {
    case SEARCH_TYPES.REGEX:
      try {
        const matches = asStr.match(new RegExp(userValue, 'g'));
        return (matches && matches.length) > 0 ? matches.length : -1;
      } catch (e) {
        return 0;
      }
    case SEARCH_TYPES.LIKE:
      let max = asStr.length > userValue.length ? asStr.length : userValue.length;
      return 1 - (levenshteinDistance(asStr.toLowerCase(), userValue.toLowerCase()) / max);
    case SEARCH_TYPES.SELECT:
      return userValue.indexOf(asStr) != -1 ? 1 : -1;
  }
}

function rateColumn(state, candidate, column) {
  const colState = state[column];
  const text = candidate[column];
  if (colState.value === undefined && state[SEARCH_TYPES.ALL] && state[SEARCH_TYPES.ALL].value === undefined) {
    return 0;
  }
  let value = 0;
  if (colState.value) {
    value += getRating(text, colState.value, colState.type);
  }
  if (value != -1 && state[SEARCH_TYPES.ALL] && state[SEARCH_TYPES.ALL].value) {
    value += getRating(text, state.__all.value, state.__all.type);
    if (value == -1) {
      return 0;
    }
  }
  return value;
}

function filterSelects(id) {
  const state = states[id];
  for (let cIndex = 0; cIndex < Object.keys(state).length; cIndex += 1) {
    const column = Object.keys(state)[cIndex];
    const columnObj = state[column];
    const selectId = `${getSelectId(dataMap[id].id, column)}_itemList`;
    if (columnObj.type == SEARCH_TYPES.SELECT) {
      const list = document.getElementById(selectId).querySelectorAll('.multiselect-checkbox');
      for (let eIndex = 1; eIndex < list.length; eIndex += 1) {
        const selector = list[eIndex].parentNode;
        const value = selector.querySelector('.multiselect-text').innerText;
        if (columnObj.eliminated && columnObj.eliminated[value] &&
          columnObj.eliminated[value] !== false &&
          (Object.keys(columnObj.eliminated[value]).length > 1 ||
          Object.keys(columnObj.eliminated[value])[0] !== column)) {
            selector.style.display = 'none';
          } else {
            selector.style.display = 'block';
          }
        }
    }
    columnObj.eliminated = undefined;
  }
  console.log(state);
}

function eliminateColumn(state, candidate, eliminator) {
  for (let cIndex = 0; cIndex < Object.keys(state).length; cIndex += 1) {
    const column = Object.keys(state)[cIndex];
    const value = String(candidate[column]);
    if (state[column].eliminated === undefined) {
      state[column].eliminated = {};
    }
    if (state[column].eliminated[value] === undefined) {
      state[column].eliminated[value] = {};
    }
    if (state[column].eliminated[value] !== false) {
      state[column].eliminated[value][eliminator] = true;
    }
  }
}

function protect(state, candidate) {
  for (let cIndex = 0; cIndex < Object.keys(state).length; cIndex += 1) {
    const column = Object.keys(state)[cIndex];
    const value = String(candidate[column]);
    if (state[column].eliminated === undefined) {
      state[column].eliminated = {};
    }
    if (state[column].eliminated[value] === undefined) {
      state[column].eliminated[value] = {};
    }
    state[column].eliminated[value] = false;
  }
}

function filterRows(id) {
  const state = states[id];
  const data = dataMap[id].data;
  const filtered = [];
  const columns = Object.keys(state);
  const visible = {};
  for (let dIndex = 0; dIndex < data.length; dIndex += 1 ) {
    let candidate = data[dIndex];
    let rowRating = 0;
    let eliminated = false;
    for (let cIndex = 0; cIndex < columns.length; cIndex += 1) {
      const column = columns[cIndex];
      if (column !== SEARCH_TYPES.ALL) {
        rating = rateColumn(state, candidate, column);
        if (rating == -1) {
          eliminateColumn(state, candidate, column);
          eliminated = true;
        } else {
          rowRating += rating;
        }
      }
    }
    if (!eliminated) {
      filtered.push({candidate, rowRating});
      protect(state, candidate);
    }
  }
  filterSelects(id);
  return filtered;
}

function mapArray(data, name) {
  let columns = {};
  let unique = {};
  for (let index = 0; index < data.length; index += 1) {
    let obj = data[index];
    if (typeof obj === "object") {
      const keys = Object.keys(obj);
      for (let kIndex = 0; kIndex < keys.length; kIndex += 1) {
        const key = keys[kIndex];
        if (columns[key] === undefined) {
          unique[key] = {}
        }
        unique[key][data[index][key]] = null;
        columns[key] = Object.keys(unique[key]);
      }
    }
  }
  return columns;
}

function buildHeader(id) {
  let uniqueId = buildId('radio', dataMap[id].id, SEARCH_TYPES.ALL);
  const inputId = buildId('input', dataMap[id].id, SEARCH_TYPES.ALL);
  const likeId = buildId(uniqueId, SEARCH_TYPES.LIKE);
  const regexId = buildId(uniqueId, SEARCH_TYPES.REGEX);
  let header = `<div>
              <label>Search All: </label>
              <input onkeyup='updateAllState(this)' id='${inputId}' type='text'>
              <label>Like</label>
              <input onclick='updateAllState(this)' type='radio' name='${uniqueId}' id='${likeId}' value='${SEARCH_TYPES.LIKE}' checked>
              <label>Regex</label>
              <input type='radio' name='${uniqueId}' id='${regexId}' value='${SEARCH_TYPES.REGEX}'>
            </div><br>`;

  return header;
}

function updateAllState(e) {
  const id = splitId(e.id)[1];
  const uniqueId = buildId('radio', dataMap[id].id, SEARCH_TYPES.ALL);
  const inputId = buildId('input', dataMap[id].id, SEARCH_TYPES.ALL);

  if (states[id][SEARCH_TYPES.ALL] === undefined) {
    states[id][SEARCH_TYPES.ALL] = {};
  }

  states[id][SEARCH_TYPES.ALL].type = document.querySelector(`input[name='${uniqueId}']`).value;
  states[id][SEARCH_TYPES.ALL].value = document.getElementById(inputId).value;
  inputUpdate(id);
}

const idSeperator = '---'
function buildId() {
  let uniqueId = arguments[0];//`${id}-${column}-${attr1}`;
  for (let index = 1; index < arguments.length; index += 1) {
    uniqueId += `${idSeperator}${arguments[index]}`;
  }
  return uniqueId;
}

function splitId(id) {
  return id.split(idSeperator);
}

function setState(id, column, type, value) {
  if (!states[id]) {
    states[id] = {};
  }
  if (!states[id][column]) {
    states[id][column] = {type, value};
  } else {
    if (type) {
      states[id][column].type = type;
    }
    states[id][column].value = value;
  }
}

function getSelectId(id, column) {
  return buildId('selector', id, column);
}

function removeColumn(id, index) {
  dataMap[id].hide.push(index);
}

function buildMenu(id) {
  const columnsObj = dataMap[id].columns;
  const columns = Object.keys(columnsObj);
  let menu = '';
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    const uniqueId = buildId('radio', dataMap[id].id, column);//`${id}-${column}-radio`;
    const selectId = buildId(uniqueId, SEARCH_TYPES.SELECT);//`${uniqueId}-${SEARCH_TYPES.SELECT}`;
    const likeId = buildId(uniqueId, SEARCH_TYPES.LIKE);
    const regexId = buildId(uniqueId, SEARCH_TYPES.REGEX);
    const textId = buildId('input', dataMap[id].id, column, 'text');
    setState(id, column, SEARCH_TYPES.SELECT);
    let datalist = `<select class='multi-select-column' id='${getSelectId(dataMap[id].id, column)}' multiple>`;
    for (let uIndex = 0; uIndex < columnsObj[column].length; uIndex += 1) {
      let value = columnsObj[column][uIndex];
      datalist += `<option value='${value}'>${value}</option>`
    }
    datalist += '</select>';
    menu += `<th class='relative column-${index}'>
    <label>${column}</label>
    <br>
    <input hidden type='text' id='${textId}'>
    ${datalist}
    <br>
    <label>s</label>
    <input type='radio' name='${uniqueId}' id='${selectId}' value='${SEARCH_TYPES.SELECT}' checked>
    <label>l</label>
    <input type='radio' name='${uniqueId}' id='${likeId}' value='${SEARCH_TYPES.LIKE}'>
    <label>r</label>
    <input type='radio' name='${uniqueId}' id='${regexId}' value='${SEARCH_TYPES.REGEX}'>
    <button class='close-btn' onclick='removeColumn("${id}", ${index})'>X</button>
    </th>`;
  }
  return menu;
}

let lookUpId = 0;
const lookUpObj = {};
function buildBody(data, id) {
  let body = '';
  const keys = Object.keys(dataMap[id].columns)
  let count = 1;
  for (let index = 0; index < data.length; index += 1) {
    const clazz = count++ % 2 === 0 ? 'tr-even' : 'tr-odd';
    lookUpObj[lookUpId] = {id, data: data[index]};
    body += `<tr look-up-id='${lookUpId++}' onclick='openPopUp(this)' class='${clazz}'>`;
    for(let kIndex = 0; kIndex < keys.length; kIndex += 1) {
      body += `<td class='column-${kIndex}'>${data[index][keys[kIndex]]}</td>`
    }
    body += '</tr>';
  }
  return body;
}

function hideAll(id) {
  const elems = document.getElementById(`utility-filter-${dataMap[id].ufId}`).getElementsByClassName('tab-ctn');
  for (let index = 0; index < elems.length; index += 1) {
    const elem = elems[index];
    elem.style.display = 'none';
  }
}

function displayTable(id, anchor) {
  hideAll(id);
  document.getElementById(`utility-filter-${dataMap[id].ufId}`).querySelector('.tab-active').classList.remove('tab-active');
  let elem = document.getElementById(`${dataMap[id].id}-cnt`);
  elem.style.display = 'block';
  anchor.classList.add('tab-active');
}

function buildTable(id, data) {
  let table = "<table><tr>"
  table += buildMenu(id);
  table += `'</tr><tbody id='tbody-${id}'>`;
  table += buildBody(data, id);
  table += '</tbody></table>';

  return table;
}

function multiSelectSetup(id) {
  return function () {
    const columnsObj = dataMap[id].columns;
    const columns = Object.keys(columnsObj);
    for (let index = 0; index < columns.length; index += 1) {
      column = columns[index];
      for (let uIndex = 0; uIndex < columnsObj[column].length; uIndex += 1) {
        document.multiselect(`#${getSelectId(dataMap[id].id, column)}`);
      }
    }
  }
}

function buildTabs(ids, startIndex) {
  let tabs = ['<ul class="nav nav-tabs">'];
  for (let i = 0; i < ids.length; i += 1) {
    let clazz = 'tab';
    if (i === 0) {
      clazz += ' tab-active';
    }
    tabs.push(`<li class="active"><a id='tab-${startIndex + i}' class='${clazz}' onclick='displayTable("${startIndex + i}", this)'>${ids[i]}</a></li>`);
  }
  return tabs.join('') + "</ul>";
}

function closePopUp() {
    const haze = document.querySelector('#pop-up-haze');
    const id = haze.querySelector('look-up-id').id;
    sort(lookUpObj[id].id);
    haze.style.display = 'none';
}

function updateData(elem, id, label) {
  lookUpObj[id].data[label] = elem.value;
}

let edit = true;
function openPopUp(elem) {
    let headers = elem.parentElement.parentElement.querySelectorAll('th');
    let values = elem.querySelectorAll('td');
    const id = elem.attributes['look-up-id'].value;
    let body = `<look-up-id id='${id}'></look-up-id>`;
    for (let index = 0; index < headers.length; index += 1) {
      const value = values[index].innerText;
      const label = headers[index].querySelector('label').innerText.trim();
      body += `<label>
                  ${label}:
              </label>`;
      if (edit) {
        body += `<br><textarea onchange='updateData(this, ${id}, "${label}")'>${value}</textarea><br>`;
      } else {
        body += ` ${value}<br>`
      }
    }
    document.querySelector('#pop-up').innerHTML = body;
    document.querySelector('#pop-up-haze').style.display = 'block';
}

function buildPopUp() {
  let haze = document.createElement('div');
  haze.id = 'pop-up-haze';
  haze.onclick = closePopUp;
  haze.style.display = 'none';
  haze.innerHTML = `<div onclick='stopPropagation()' id='pop-up'><h2>Pop Up</h2></div></div>`;
  return haze;
}

function onLoad() {
  let elems = document.getElementsByTagName('utility-filter');
  let ufId = 0;
  let objectId = 0;
  for (index = 0; index < elems.length; index += 1) {
    let elem = elems[index];
    elem.id = `utility-filter-${ufId}`;
    let tableId;
    let data = JSON.parse(elem.innerText);
    if (Array.isArray(data)) {
      tableId = unnamedCount;
      elem.innerHTML = "";
      elem.style.display = 'block';
      dataMap[unnamedCount] = { elem, hide:[], objectId, data, id: unnamedCount, columns: mapArray(data)};

      let display = buildHeader(unnamedCount);
      display += buildTable(unnamedCount, dataMap[unnamedCount].data);

      elem.innerHTML = display;
      setTimeout(multiSelectSetup(unnamedCount), 0);
      unnamedCount += 1;
    } else if (typeof data === 'object') {
      tableId = unnamedCount;
      const keys = Object.keys(data);
      elem.innerHTML = "";
      elem.style.display = 'block';
      let display = buildTabs(keys, unnamedCount);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        dataMap[String(unnamedCount)] = { elem, objectId, hide:[], ufId, data: data[key], id: unnamedCount, columns: mapArray(data[key]), name: key };
        display += `<div class='tab-ctn' id='${unnamedCount}-cnt'>`;
        display += buildHeader(unnamedCount);
        display += buildTable(unnamedCount, dataMap[String(unnamedCount)].data);
        display += '</div>';key
        setTimeout(multiSelectSetup(unnamedCount), 0);
        unnamedCount += 1;
      }
      elem.innerHTML = `<div>${display}<button onclick='save("${objectId}")'>save</button></div>`;
      ufId++;
      displayTable(tableId, document.querySelector(`#tab-${tableId}`));
      objectId++;
    }
  }
  document.querySelector('body').appendChild(buildPopUp());

  document.querySelector('#pop-up').addEventListener('click', function(event){
    event.stopPropagation();
  });
  document.body.onclick= function(e){
     e=window.event? event.srcElement: e.target;
     if(e.tagName.toLowerCase() == 'input' && e.type.toLowerCase() === 'radio')radioUpdate(e);
  }
  document.body.onkeyup= function(e){
     e=window.event? event.srcElement: e.target;
     if(e.tagName.toLowerCase() == 'input' && e.type.toLowerCase() === 'text')columnInputUpdate(e);
  }

  document.body.onchange = function(e){
     e=window.event? event.srcElement: e.target;
     if(e.tagName.toLowerCase() == 'input' && e.className === 'multiselect-checkbox')selectInputUpdate(e);
  }

  document.multiselect('#testSelect1');
}

function columnInputUpdate(e) {
  let arr = splitId(e.id);
  const id = arr[1];
  const column = arr[2];
  const type = arr[3];
  value = e.parentNode.querySelector('input').value;
  setState(id, column, undefined, value);
  inputUpdate(id);
}

function findFirstUp(e, selector) {
  while (!e.parentNode.querySelector(selector)) {
    e = e.parentNode;
  }
  return e.parentNode.querySelector(selector);
}

function selectInputUpdate(e) {
  const selectElem = findFirstUp(e, 'select');
  let arr = splitId(selectElem.id);
  const id = arr[1];
  const column = arr[2];
  const type = arr[3];
  const selected = selectElem.querySelectorAll('option[selected=selected]');
  value = Array.from(selected).map(el => el.value);
  setState(id, column, undefined, value);
  inputUpdate(id);
}

function radioUpdate(e) {
  let arr = splitId(e.id);
  const id = arr[1];
  const column = arr[2];
  const type = arr[3];
  let value;
  if (type === SEARCH_TYPES.SELECT) {
    const selected = e.parentNode.querySelectorAll('option[selected=selected]');
    value = Array.from(selected).map(el => el.value);
    e.parentNode.querySelector('input').style.display = "none";
    e.parentNode.getElementsByClassName('multiselect-wrapper')[0].style.display = "inline-block";
  } else {
    value = e.parentNode.querySelector('input').value;
    e.parentNode.querySelector('input').style.display = "inline-block";
    if (column != '__all') {
      e.parentNode.getElementsByClassName('multiselect-wrapper')[0].style.display = "none";
    }
  }

  setState(id, column, type, value);
  sort(id);
}

function sort(id) {
  let filtered = filterRows(id);
  filtered.sort(function (a, b) {return b.rowRating - a.rowRating});
  filtered = Array.from(filtered).map(el => el.candidate);
  dataMap[id].elem.querySelector(`#tbody-${id}`).innerHTML = buildBody(filtered, id);
}

let updatePending = false;
let doneTyping = false;
let wait = 400
function inputUpdate(id) {
  function run() {
    if (doneTyping) {
      updatePending = false;
      sort(id);
    } else {
      doneTyping = true;
      setTimeout(run, wait);
    }
  }
  doneTyping = false;
  if (!updatePending) {
    doneTyping = true;
    updatePending = true;
    setTimeout(run, wait);
  }
}

// The following function is from https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/string/levenshtein-distance/levenshteinDistance.js
function levenshteinDistance(a, b) {
  const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    distanceMatrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    distanceMatrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      distanceMatrix[j][i] = Math.min(
        distanceMatrix[j][i - 1] + 1, // deletion
        distanceMatrix[j - 1][i] + 1, // insertion
        distanceMatrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return distanceMatrix[b.length][a.length];
}

var script = document.createElement("script");
script.src = 'https://jozsefmorrissey.github.io/not-related/utility-filter/js/multiselect.min.js';
document.head.appendChild(script);

var style = document.createElement("link");
style.href = 'https://jozsefmorrissey.github.io/not-related/utility-filter/styles/multiselect.css';
style.rel = 'stylesheet';
document.head.appendChild(style);

console.log("rt: " + document.currentScript.getAttribute('run-type'));

window.addEventListener('load', onLoad);
