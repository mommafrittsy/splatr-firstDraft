/*global Stripe fetch xhr*/
const switches = document.getElementsByClassName('switch'),
      stripe = Stripe('pk_live_T9NNhHuusEZOuXTEpTWy4WCf'),
      newCardSubmit = document.getElementById('new-card-submit'),
      savedCardSubmit = document.getElementById('saved-card-submit'),
      elements = stripe.elements(),
      style = {
          base: {
            color: '#465564',
            lineHeight: '18px',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        },
      card = elements.create('card', {style}),
      spinners = document.getElementsByClassName('spinner'),
      cardBtns = document.getElementsByClassName('card-btn'),
      errorElement = document.getElementById('card-errors');

for(let btn of switches){
  btn.addEventListener('click', function(){
    let hide = document.getElementById(btn.dataset.hide),
        show = document.getElementById(btn.dataset.show);
    show.classList.remove('inactive');
    hide.classList.add('inactive');
  });
}
for(let btn of cardBtns){
  btn.addEventListener('click', function(){
    savedCardSubmit.setAttribute('data-card', btn.getAttribute('id'));
  });
}
card.mount('#card-element');
card.addEventListener('change', function(event) {
  var displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
    newCardSubmit.setAttribute('disabled', 'true');
  } else {
    displayError.textContent = '';
    newCardSubmit.removeAttribute('disabled');
  }
});
newCardSubmit.addEventListener('click', function() {
  for(let spinner of spinners){
    spinner.classList.remove('inactive');
    document.getElementById(spinner.dataset.hide).classList.add('inactive');
  }
  stripe.createToken(card,{name:document.getElementById('cc-name').value}).then(function(result) {
    if (result.error) {
      // Inform the user if there was an error.
      errorElement.textContent = result.error.message;
      for(let spinner of spinners){
        spinner.classList.add('inactive');
        document.getElementById(spinner.dataset.show).classList.remove('inactive');
      }
    } else {
      makeCharge(newCardSubmit, result.token.id);
    }
  });
});
if(savedCardSubmit){
  savedCardSubmit.addEventListener('click', function(){
  for(let spinner of spinners){
    spinner.classList.remove('inactive');
    document.getElementById(spinner.dataset.hide).classList.add('inactive');
  }
  makeCharge(savedCardSubmit, null);
});
}

function makeCharge(source, result){
  let url = `/payment/${source.dataset.url}`,
      init = {
        method:'PUT',
        credentials:'include',
        headers: {
          'content-type' : 'application/json'
        }
      },
      data = {},
      customer = document.getElementById('customer-account').value;
  if(customer != ''){
    if(source.dataset.card){
      data.source = source.dataset.card;
      data.newCard = false;
    } else {
      data.newCard = true;
      data.source = result;
    }
    data.customer = customer;
  } else {
    data.source = result;
  }
  data.account = document.getElementById('artist-account').value;
  data.type = source.dataset.type;
  data.save = document.getElementById('save-card').checked;
  data.id = source.dataset.trans;
  init.body = JSON.stringify(data);
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        for(let spinner of spinners){
          spinner.classList.add('inactive');
          document.getElementById(spinner.dataset.show).classList.remove('inactive');
          document.getElementById('payment-header').classList.add('inactive');
        }
        return response.json();
      } else {
       throw "We had a problem.";
      }
    })
    .then((info)=>{
      receiptMaker(info);
    })
    .catch((err)=>{
      errorElement.innerText = err;
      for(let spinner of spinners){
        spinner.classList.add('inactive');
        document.getElementById(spinner.dataset.show).classList.remove('inactive');
      }
    });
  } else {
    let formData = new FormData();
    for(let arr of Object.entries(data)){
      formData.append(arr[0], arr[1]);
    }
    xhr.open('PUT',url,true);
    xhr.withCredentials = true;
    xhr.responseType = 'json';
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4 && xhr.status == 200){
        for(let spinner of spinners){
          spinner.classList.add('inactive');
          document.getElementById(spinner.dataset.show).classList.remove('inactive');
          document.getElementById('payment-header').classList.add('inactive');
        }
        receiptMaker(xhr.response);
      } else if([400, 404, 503].includes(xhr.status)){
        for(let spinner of spinners){
          spinner.classList.add('inactive');
          document.getElementById(spinner.dataset.show).classList.remove('inactive');
        }
      }
    };
    xhr.send(formData);
  }
}
function receiptMaker(info){
  let time = document.getElementById('time'),
      date = new Date(info.created*1000),
      id = document.getElementById('charge-id'),
      card = document.getElementById('card-span'),
      cardIcon = document.getElementById('card-icon'),
      amount  = document.getElementById('charge-amount'),
      cardBody = document.getElementsByClassName('card-body');
  time.innerText = `${date.toDateString()} at ${date.toTimeString()}`;
  id.innerText = info.id.slice(3);
  amount.innerText = `$${((info.amount/100)).toFixed(2)}`;
  cardBody[0].classList.add('p-0');
  if(info.source.card){
    card.innerText = info.source.card.last4;
    if(['visa', 'mastercard','discover', 'jcb'].includes(info.source.card.brand.toLowerCase())){
      cardIcon.setAttribute('class', `fa-cc-${info.source.card.brand.toLowerCase()}`);
    } else if(info.source.card.brand == 'American Express'){
      cardIcon.setAttribute('class', 'fa-cc-amex');
    } else if(info.source.card.brand == 'Diners Club'){
      cardIcon.setAttribute('class', 'fa-cc-diners-club');
    }
  } else {
    card.innerText = info.source.last4;
    if(['visa', 'mastercard','discover', 'jcb'].includes(info.source.brand.toLowerCase())){
      cardIcon.setAttribute('class', `fa-cc-${info.source.brand.toLowerCase()}`);
    } else if(info.source.brand == 'American Express'){
      cardIcon.setAttribute('class', 'fa-cc-amex');
    } else if(info.source.brand == 'Diners Club'){
      cardIcon.setAttribute('class', 'fa-cc-diners-club');
    }
  }
}