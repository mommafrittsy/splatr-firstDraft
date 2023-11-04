/* global algoliasearch */

const userKey = document.getElementById('userKey'),
      client = algoliasearch('LKDIWAGI3B', userKey.value),
      transIndex = client.initIndex('transactions'),
      payoutIndex = client.initIndex('payouts'),
      calendar = document.getElementsByClassName('calendar'),
      transSearch = document.getElementById('search-box'),
      status  = document.getElementById('status'),
      transRow = document.getElementById('search-results'),
      payoutSearch = document.getElementsByClassName('payout-search');
      
      
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
for(let each of payoutSearch){
  each.addEventListener('input', function(){
    payoutSearchParams();
  });
}




function searchTrans(content){
  transRow.innerHTML = '';
  for(let hit of content.hits){
    let tr = document.createElement('tr'),
        clientTd = document.createElement('td'),
        artistTd = document.createElement('td'),
        typeTd = document.createElement('td'),
        statusTd = document.createElement('td'),
        activityTd = document.createElement('td'),
        clientA = document.createElement('a'),
        artistA = document.createElement('a'),
        typeA = document.createElement('a'),
        statusA = document.createElement('a'),
        activityA = document.createElement('a'),
        aArr = [clientA, artistA, typeA, statusA, activityA],
        tdArr = [clientTd, artistTd, typeTd, statusTd, activityTd],
        activityDate = new Date(hit.activity);
    for(let a of aArr){
      a.setAttribute('href', `/transaction/${hit.objectID}`);
    }
    clientA.innerText = hit.client;
    clientTd.appendChild(clientA);
    artistA.innerText = hit.artist;
    artistTd.appendChild(artistA);
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
  let dateBottomVal = document.getElementById('date-bottom').value,
      dateBottom = Date.parse(dateBottomVal),
      dateTopVal = document.getElementById('date-top').value,
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
function payoutSearchParams(){
  let amountMin = document.getElementById('payout-start-amount').value,
      amountMax = document.getElementById('payout-end-amount').value,
      dateStartVal = document.getElementById('payout-start-date').value,
      dateStart = Date.parse(dateStartVal)/1000,
      dateEndVal = document.getElementById('payout-end-date').value,
      dateEnd = Date.parse(dateEndVal)/1000,
      createdFilter,
      amountFilter,
      query = {};
      
  query.filters = '';
  if(isNaN(dateStart) == false && isNaN(dateEnd) == true){
    createdFilter = `created:${dateStart - 43200} TO ${dateStart + 43200}`;
  } else if(isNaN(dateEnd) == false && isNaN(dateStart) == true){
    createdFilter = `created:${dateEnd - 43200} TO ${dateEnd + 43200}`;
  } else if(isNaN(dateEnd) == false && isNaN(dateStart) == false) {
    createdFilter = `created:${dateStart} TO ${dateEnd}`;
  } else {
    createdFilter = undefined;
  }
  if(amountMin != 0 && amountMax == 0){
    amountFilter =`amount:${amountMin * 100} TO ${amountMin * 100}`;
  } else if(amountMin == 0 && amountMax != 0){
    amountFilter = `amount:${amountMax * 100} TO ${amountMax * 100}`;
  } else if(amountMin != 0 && amountMax != 0) {
    amountFilter = `amount:${amountMin*100} TO ${amountMax*100}`;
  } else {
    amountFilter = undefined;
  }
  if(amountFilter != undefined && createdFilter == undefined){
    query.filters = amountFilter;
  } else if(amountFilter == undefined && createdFilter != undefined){
    query.filters = createdFilter;
  } else if (amountFilter != undefined && createdFilter != undefined) {
    query.filters = amountFilter.concat(' AND ', createdFilter);
  }
  payoutIndex.search(query, function(err, content){
    if(err){
      console.log(err);
    } else {
      let row = document.getElementById('payout-data');
          
      row.innerHTML = " ";
      for(let hit of content.hits){
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            tr = document.createElement('tr'),
            amount_td = document.createElement('td'),
            date_td = document.createElement('td'),
            date = new Date(hit.created*1000),
            month = months[date.getMonth()],
            day = date.getDay(),
            year = date.getFullYear(),
            full_date = `${month} ${day}, ${year}`;
        
        amount_td.innerText = `$${(hit.amount/100).toFixed(2)}`;
        date_td.innerText = `${full_date}`;
        tr.appendChild(amount_td);
        tr.appendChild(date_td);
        row.appendChild(tr);
      }
    }
  });
}