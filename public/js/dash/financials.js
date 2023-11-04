/* global Stripe spinnerSwitch errorMessage successMessage client*/
const payoutInput = document.getElementById('payout-amount'),
      payoutAlert = document.getElementById('payout-alert'),
      payoutSubmit = document.getElementById('submit-request'),
      payoutSearch = document.getElementsByClassName('payout-search'),
      payoutIndex = client.initIndex('payouts');

if(payoutInput){    
  payoutInput.addEventListener('input', ()=>{
  let max = payoutInput.getAttribute('max'),
      min = payoutInput.getAttribute('min');
  if(Number(payoutInput.value) > max || Number(payoutInput.value) < min) {
    payoutSubmit.setAttribute('disabled', true);
    payoutAlert.classList.remove('inactive');
  } else {
    payoutSubmit.removeAttribute('disabled');
    payoutAlert.classList.add('inactive'); 
  }
});
  payoutSubmit.addEventListener('click', ()=>{
    let form = document.getElementById(payoutSubmit.dataset.form),
        spinner = document.getElementById(payoutSubmit.dataset.spinner),
        receipt = document.getElementById('payout-receipt');
    spinnerSwitch(form, spinner);
    if(Number(payoutInput.value) < Number(payoutInput.getAttribute('max')) && Number(payoutInput.value) > Number(payoutInput.getAttribute('min'))) {
      let account = document.getElementById('payout-account').value,
          amount = Number(payoutInput.value).toFixed(2)*100,
          url = '/payment/payout',
          init = {
            method:'POST',
            credentials: 'include',
            body: JSON.stringify({amount, external_account:account, stripe_account:payoutSubmit.dataset.account}),
            headers: {
              'content-type' : 'application/json'
            }
          };
      fetch(url, init)
      .then((response)=>{
        if(response.ok == true){
          return response.json();
        } else {
          throw response.json();
        }
      })
      .then((data)=>{
        payoutReceipt(data);
        spinnerSwitch(spinner, receipt);
      })
      .catch((err)=>{
        errorMessage(err);
      })
    } else {
      errorMessage({message:`Please make sure you have the funds to cover your request.`});
    }
  });
}
for(let each of payoutSearch){
  each.addEventListener('input', function(){
    payoutSearchParams();
  });
}

function payoutReceipt (data) {
  let accepted = document.getElementById('payout-accepted'),
      amount = document.getElementById('paid-amount'),
      id = document.getElementById('payout-id'),
      new_available = Number(payoutInput.getAttribute('max')) - (data.amount/100),
      availableAmount = document.getElementById('available-amount'),
      date = new Date(data.created*1000),
      symbol;
      if(['AUD','CAD','HKD','NZD','SGD','USD'].includes(data.currency.toUpperCase())){
      symbol = '$';
      } else if(data.currency.toUpperCase() == 'GBP'){
      symbol = '&#163;';
      } else if(data.currency.toUpperCase() == 'JPY'){
      symbol = '&#165;';
      } else {
      symbol = '&#8364;';
      }
      accepted.innerText = date.toDateString();
      id.innerText = data.id;
      availableAmount.innerText = new_available;
      if(data.currency == 'jpy'){
        amount.innerText = `${symbol}${data.amount}`;
      } else {
        amount.innerText = `${symbol}${(data.amount/100).toFixed(2)}`;
      }
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
            id_td = document.createElement('td'),
            amount_td = document.createElement('td'),
            date_td = document.createElement('td'),
            date = new Date(hit.created*1000),
            month = months[date.getMonth()],
            day = date.getDate(),
            year = date.getFullYear(),
            full_date = `${month} ${day}, ${year}`;
        id_td.innerText = hit.id;
        amount_td.innerText = `$${(hit.amount/100).toFixed(2)}`;
        date_td.innerText = `${full_date}`;
        tr.appendChild(id_td);
        tr.appendChild(amount_td);
        tr.appendChild(date_td);
        row.appendChild(tr);
      }
    }
  });
}