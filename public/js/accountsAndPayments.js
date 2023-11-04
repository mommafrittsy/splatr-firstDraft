/*global Stripe fetch fetchSpan fetchAlert xhr $*/
const stripe = Stripe('pk_live_T9NNhHuusEZOuXTEpTWy4WCf'),
      newAccountBtns = document.getElementsByClassName('new-account-btn'),
      removeAcct = document.getElementsByClassName('remove-account'),
      pidSubmit = document.getElementById('pid-verify-submit'),
      payout_amount = document.getElementById('payout-amount'),
      payout_button = document.getElementById('payout-button'),
      id_submit = document.getElementById('id-verify-submit');
      
if(newAccountBtns){
  for(let btn of newAccountBtns){
    btn.addEventListener('click',function(){
    let form = document.forms[btn.dataset.form],
        spinner,
        url = '/payment/update/external_account',
        init = {
          method: 'PUT',
          credentials:'include',
          headers: {
            'content-type' : 'application/json'
          }
        };
    if(btn.dataset.spinner){
      spinner = document.getElementById(btn.dataset.spinner);
      form.classList.add('inactive');
      spinner.classList.remove('inactive');
    }
    if(['AT','BE','DK','FN','FR','DE','IE', 'IT','LU','NL','NO','PT','ES','SE','CH'].includes(form.dataset.country)){
      stripe.createToken('bank_account', {
        country: form.dataset.country,
        currency: 'EUR',
        account_number:form.elements[0].value,
        account_holder_name: form.elements[3].value,
        account_holder_type: 'individual'
      })
      .then((result)=>{
        let data = {
          accountID: form.elements[1].value,
          accountToken: result.token.id
        };
        if(form.elements[2].checked == true){
          data.default = true;
        } else {
          data.default = false;
        }
        init.body = JSON.stringify(data);
        newAccount(url, init, btn);
      })
      .catch(function(err){
        fetchAlert.classList.add('bg-danger');
        fetchSpan.innerText = err.message;
        fetchAlert.classList.remove('inactive');
      });
    } else {
      stripe.createToken('bank_account', {
        country: form.dataset.country,
        currency: form.dataset.currency,
        account_number:form.elements[0].value,
        account_holder_type:'individual',
        routing_number:form.elements[1].value
      })
      .then(function(result){
        if(result.token){
          let data = {
            accountID: form.elements[2].value,
            accountToken: result.token.id
          };
          if(form.elements[3].checked == true){
            data.default = true;
          } else {
            data.default = false;
          }
          init.body = JSON.stringify(data);
          newAccount(url, init, btn, form);
        } else {
          console.log(result);
          fetchAlert.classList.add('bg-danger');
          fetchSpan.innerText = result.error.message;
          fetchAlert.classList.remove('inactive');
          if(btn.dataset.modal){
            $(`#${btn.dataset.modal}`).modal('hide');
          }
          if(spinner){
            form.classList.remove('inactive');
            spinner.classList.add('inactive');
          }
        }
      })
      .catch(function(err){
        fetchAlert.classList.add('bg-danger');
        fetchSpan.innerText = err.message;
        fetchAlert.classList.remove('inactive');
      });
    }
  });
  }
}
for(let acct of removeAcct){
  acct.addEventListener('click', function(){
    let externalID = this.dataset.id,
        accountID  = this.dataset.user,
        url = `/payment/remove/${this.dataset.url}`,
        init = {
          method: 'DELETE',
          body: JSON.stringify({externalID, accountID}),
          credentials: 'include',
          headers: {
          'content-type' : 'application/json'
          }
        };
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        let line = document.getElementById(`${this.dataset.url}-${this.dataset.id}`),
            parent = line.parentNode;
        parent.removeChild(line);
      } else {
        fetchAlert.classList.add('bg-danger');
        fetchSpan.innerText = response.statusText;
        fetchAlert.classList.remove('inactive');
      }
    });
  } else {
    let formData = new FormData();
      formData.append('accountID', accountID);
      formData.append('externalID', externalID);
      xhr.open('DELETE', url, true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
          let line = document.getElementById(`account-${this.dataset.id}`),
            parent = line.parentNode;
          parent.removeChild(line);
        } else {
          fetchAlert.classList.remove('bg-success');
          fetchAlert.classList.add('bg-danger');
          fetchSpan.innerText = 'We have a problem.';
          fetchAlert.classList.remove('inactive');
        }
      };
      xhr.send(formData);
  }
  });
}
if(pidSubmit){
  pidSubmit.addEventListener('click', function(){
  let input = document.getElementById('pid-input');
  stripe.createToken('pii',{
    personal_id_number: input.value
  })
  .then(function(result){
    if(result.error){
      console.log(result.error);
    } else {
      let token = result.token.id,
          url = '/payment/update/user',
          init = {
            method: 'PUT',
            body: JSON.stringify({token}),
            credentials: 'include',
            headers: {
              'content-type' : 'application/json'
            }
          };
      if('fetch' in window){
        fetch(url, init)
        .then((response)=>{
          if(response.ok == true){
            fetchAlert.classList.remove('bg-danger');
            fetchAlert.classList.add('bg-success');
            fetchSpan.innerText = 'Thank you. You\'re getting closer to being able to process payments!';
            fetchAlert.classList.remove('inactive');
            $('#verify-modal').modal('hide');
          } else {
            throw response.text();
          }
        })
        .catch((err)=>{
          fetchAlert.classList.remove('bg-success');
          fetchAlert.classList.add('bg-danger');
          fetchSpan.innerText = err;
          fetchAlert.classList.remove('inactive');
          $('#verify-modal').modal('hide');
        });
      } else {
        let formData = new FormData();
        formData.append('token', token);
        xhr.open('PUT', url, true);
        xhr.withCredentials = true;
        xhr.onreadystatechange = function(){
          if(xhr.readyState == 4 && xhr.status == 200){
            fetchAlert.classList.add('bg-success');
            fetchSpan.innerText = 'Thank you. You\'re getting closer to being able to process payments!';
            fetchAlert.classList.remove('inactive');
            $('#verify-modal').modal('hide');
          } else {
            fetchAlert.classList.add('bg-danger');
            fetchSpan.innerText = 'Mysterious Problem';
            fetchAlert.classList.remove('inactive');
            $('#verify-modal').modal('hide');
          }
        };
        xhr.send(formData);
      }
    }
  });
});
}
if(payout_amount){
  let payout_alert = document.getElementById('payout-alert');
  payout_amount.addEventListener('input', function(){
    if(payout_amount.value > Number(payout_amount.getAttribute('max'))){
      payout_button.setAttribute('disabled', true);
      payout_alert.classList.remove('inactive');
      payout_amount.classList.add('invalid');
    } else {
      payout_button.removeAttribute('disabled');
      payout_alert.classList.add('inactive');
      payout_amount.classList.remove('invalid');
    }
  });
  payout_button.addEventListener('click', function(){
    let spinner = document.getElementById('payout-spinner'),
        before_payout = document.getElementById('before-payout');
    before_payout.classList.add('inactive');
    spinner.classList.remove('inactive');
    if(payout_amount.value > Number(payout_amount.getAttribute('max'))){
      before_payout.classList.remove('inactive');
      spinner.classList.add('inactive');
      payout_button.setAttribute('disabled', true);
      payout_alert.classList.remove('inactive');
      payout_amount.classList.add('invalid');
    } else {
      let stripe_account = payout_button.dataset.stripe_account,
          external_account = payout_button.dataset.external_account,
          amount = Number(payout_amount.value).toFixed(2) * 100,
          url = '/payment/payout',
          init = {
            method:'POST',
            credentials:'include',
            body: JSON.stringify({amount, external_account, stripe_account}),
            headers: {
              'content-type' : 'application/json'
            }
          };
      if('fetch' in window){
        fetch(url, init)
        .then((response)=>{
          if(response.ok == true){
            return response.json();
          } else {
            throw response.json();
          }
        })
        .then((data)=>{
          payoutReceipt(data, spinner);
        })
        .catch((err)=>{
          spinner.classList.add('inactive');
          before_payout.classList.remove('inactive');
          payout_alert.innerText = `Sorry, you do not have the funds for that. You are $${err.overage} over your available balance.`
          payout_alert.classList.remove('inactive');
        });
      } else {
        let formData = new FormData();
        formData.append('amount', amount);
        formData.append('external_account', external_account);
        formData.append('stripe_account', stripe_account);
        xhr.open('POST',url,true);
        xhr.withCredentials = true;
        xhr.responseType = 'json';
        xhr.onreadystatechange = function(){
          if(xhr.readyState == 4 && xhr.status == 200){
            payoutReceipt(xhr.response, spinner);
          }
        };
        xhr.send(formData);
      }
    }
  });
}
if(id_submit){
  let form = document.getElementById('id-verification'),
      span = document.getElementById('id-span'),
      id_alert = document.getElementById('id-alert'),
      spinner = document.getElementById('id-spinner');
  id_submit.addEventListener('click', function(){
    let files = form.elements[0].files;
    form.classList.add('inactive');
    spinner.classList.remove('inactive');
    id_alert.classList.add('inactive');
    if(files.length == 0){
      span.innerText = 'You didn\'t upload anything.';
      id_alert.classList.remove('inactive');
      form.classList.remove('inactive');
      spinner.classList.add('inactive');
    } else {
      let url = '/payment/update/id_document',
          init = {
            method: 'PUT',
            credentials: 'include',
          },
          formData = new FormData();
      for(let file of files){
        formData.append('image', file);
      }
      init.body = formData;
      if('fetch' in window){
        fetch(url, init)
        .then((response)=>{
          if(response.ok == true){
            return response.text();
          }
        })
        .then((data)=>{
          span.innerText = data;
          id_alert.classList.remove('inactive');
          form.classList.remove('inactive');
          spinner.classList.add('inactive');
          $('#verify-modal').modal('hide');
        })
        .catch((err)=>{
          console.log(err);
          span.innerText = err;
          id_alert.classList.remove('inactive');
          form.classList.remove('inactive');
          spinner.classList.add('inactive');
        });
      }
    }
  });
}
function addAccount(form){
  let formArea = document.getElementById('collapseNewAccount'),
      accts = document.getElementById('external-accounts'),
      p = document.createElement('p'),
      icon = document.createElement('i'),
      span = document.createElement('span'),
      remove = document.createElement('i'),
      accountNumber = document.createElement('span');
  formArea.classList.remove('show');    
  icon.setAttribute('class', 'fas fa-university fa-lg mr-2');
  accountNumber.innerText = `XXXXXXXX${form.elements[0].value.slice(8)}`;
  span.classList.add('remove-account');
  remove.setAttribute('class', 'far fa-times text-danger ml-2');
  span.appendChild(remove);
  p.appendChild(icon);
  p.appendChild(accountNumber);
  p.appendChild(span);
  accts.appendChild(p);
}
function payoutReceipt(data, spinner){
  let after = document.getElementById('after-payout'),
      available_balance = document.getElementById('available-balance'),
      payout_accepted = document.getElementById('payout-accepted'),
      paid_amount = document.getElementById('paid-amount'),
      payout_id = document.getElementById('payout-id'),
      new_available = Number(payout_amount.getAttribute('max')) - (data.amount/100),
      date = new Date(data.created);
  spinner.classList.add('inactive');
  after.classList.remove('inactive');
  available_balance.innerText = `$${new_available.toFixed(2)}`;
  payout_accepted.innerText = date.toString();
  paid_amount.innerText = `$${(data.amount/100).toFixed(2)}`;
  payout_id.innerText = data.id;
}
function newAccount(url, init, btn, form){
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        fetchAlert.classList.add('bg-success');
        fetchAlert.classList.remove('bg-danger');
        fetchSpan.innerText = 'We\'ve got it';
        fetchAlert.classList.remove('inactive');
        if(btn.dataset.modal){
          $(`#${btn.dataset.modal}`).modal('hide');
        }
        addAccount(form);
      } else {
        fetchAlert.classList.add('bg-danger');
        fetchSpan.innerText = response.err;
        fetchAlert.classList.remove('inactive');
        if(btn.dataset.modal){
          $(`#${btn.dataset.modal}`).modal('hide');
        }
      }
    });
  } else { 
    let formData = new FormData();
    formData.append('accountID', form.elements[2].value);
    formData.append('accountToken', result.token.id);
    xhr.open('PUT', url, true);
    xhr.withCredentials = true;
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4 && xhr.status == 200){
        fetchAlert.classList.remove('bg-danger');
        fetchAlert.classList.add('bg-success');
        fetchSpan.innerText = 'We\'ve got it';
        fetchAlert.classList.remove('inactive');
        addAccount(form);
        if(btn.dataset.modal){
          $(`#${btn.dataset.modal}`).modal('hide');
        }
      } else {
        fetchAlert.classList.remove('bg-success');
        fetchAlert.classList.add('bg-danger');
        fetchSpan.innerText = 'We have a problem.';
        fetchAlert.classList.remove('inactive');
        if(btn.dataset.modal){
          $(`#${btn.dataset.modal}`).modal('hide');
        }
      }
    };
    xhr.send(formData);
  }
}