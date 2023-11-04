/* global algoliasearch */

const userKey = document.getElementById('userKey'),
      client = algoliasearch('LKDIWAGI3B', userKey.value),
      transIndex = client.initIndex('transactions'),
      calendar = document.getElementsByClassName('calendar'),
      transSearch = document.getElementById('search-box'),
      status  = document.getElementById('search-status'),
      transRow = document.getElementById('search-results');
      
transSearch.addEventListener('input', function(){
  transSearchParams();
});
status.addEventListener('input', function(){
  transSearchParams();
});
for(let each of calendar){
  each.addEventListener('input', function(){
    transSearchParams();
  });
}

function searchTrans(content){
  transRow.innerHTML = '';
  for(let hit of content.hits){
    let tr = document.createElement('tr'),
        clientTd = document.createElement('td'),
        typeTd = document.createElement('td'),
        statusTd = document.createElement('td'),
        activityTd = document.createElement('td'),
        clientA = document.createElement('a'),
        typeA = document.createElement('a'),
        statusA = document.createElement('a'),
        activityA = document.createElement('a'),
        aArr = [clientA, typeA, statusA, activityA],
        tdArr = [clientTd, typeTd, statusTd, activityTd],
        activityDate = new Date(hit.activity);
    for(let a of aArr){
      a.setAttribute('href', `/transaction/${hit.objectID}`);
    }
    clientA.innerText = hit.client;
    clientTd.appendChild(clientA);
    typeA.innerText = hit.type;
    typeTd.appendChild(typeA);
    if(hit.status == 'previewAccept'){
      statusA.innerText = 'Preview Accepted';
    } else {
      statusA.innerText = hit.status.charAt(0).toUpperCase() + hit.status.slice(1);
    }
    statusTd.appendChild(statusA);
    activityA.innerText = activityDate.toDateString();
    activityTd.appendChild(activityA);
    for(let td of tdArr){
      tr.appendChild(td);
    }
    transRow.appendChild(tr);
  }
}
function transSearchParams(){
  let dateBottomVal = document.getElementById('date-start').value,
      dateBottom = Date.parse(dateBottomVal),
      dateTopVal = document.getElementById('date-end').value,
      dateTop = Date.parse(dateTopVal),
      query = {};
  query.filters = '';
  if(status.value != ''){
    if(isNaN(dateBottom) == false && isNaN(dateTop) == true){
      query.filters = `activity:${dateBottom} TO ${Date.now()} AND status:${status.value}`;
    } else if(isNaN(dateBottom)== true && isNaN(dateTop) == false){
      query.filters = `activity:1531243073971 TO ${dateTop} AND status:${status.value}`;
    } else if(isNaN(dateBottom)== false && isNaN(dateTop) == false){
      query.filters = `activity:${dateBottom} TO ${dateTop} AND status:${status.value}`;
    } else if(isNaN(dateBottom) == true && isNaN(dateTop) == true) {
      query.filters = `status:${status.value}`;
    }
  } else {
    if(isNaN(dateBottom) == false && isNaN(dateTop) == true){
      query.filters = `activity:${dateBottom} TO ${Date.now()}`;
    } else if(isNaN(dateBottom)== true && isNaN(dateTop) == false){
      query.filters = `activity:1531243073971 TO ${dateTop}`;
    } else if(isNaN(dateBottom)== false && isNaN(dateTop) == false){
      query.filters = `activity:${dateBottom} TO ${dateTop}`;
    }
  }
  if(transSearch.value != ''){
    query.query = transSearch.value;
  }
  transIndex.search(query, function(err, content){
    if(err){
      console.log(err);
    } else {
      searchTrans(content);
    }
  });
}