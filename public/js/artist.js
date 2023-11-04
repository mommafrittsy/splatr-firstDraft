/* global fetch xhr $*/
const alert_box = document.getElementById('fetch-alert'),
      showcases = document.getElementsByClassName('showcase'),
      menu_buttons = document.getElementsByClassName('menu-button'),
      follow_button = document.getElementsByClassName('follow-button'),
      report_form = document.getElementById('report-commission'),
      report_buttons = document.getElementsByClassName('report-btn'),
      report_submit = document.getElementById('report-submit'),
      example_buttons = document.getElementsByClassName('commission-img'),
      request_buttons = document.getElementsByClassName('request-btn'),
      upload_block = document.getElementById('request-upload-block'),
      request_submit = document.getElementById('request-submit'),
      request_input = document.getElementById('request-input'),
      gallery_submit = document.getElementById('gallery-submit');

if(showcases.length > 0){
  showcases[0].classList.remove('inactive');
}
if(menu_buttons.length > 0){
  menu_buttons[0].classList.add('active');
  for(let btn of menu_buttons){
    btn.addEventListener('click', function(){
      let section = document.getElementById(btn.dataset.section);
      for(let other of showcases){
        other.classList.add('inactive');
      }
      for(let other of menu_buttons){
        other.classList.remove('active');
      }
      btn.classList.add('active');
      section.classList.remove('inactive');
    });
  }
}
if(follow_button.length > 0) {
  for(let btn of follow_button){
  btn.addEventListener('click', ()=>{
    let url = `/fetch/${btn.dataset.artist}/follow`,
        init = {
          method: 'PUT',
          credentials: 'include'
        },
        icon = document.getElementById('follow-icon');
    if('fetch' in window){
      fetch(url, init)
      .then((response)=>{
        return response.text();
      })
      .then((data)=>{
        if(data == 'Following'){
          followMe(btn, icon, 'follow', 'unfollow', 'fa-plus', 'fa-minus');
        } else if(data == 'Unfollowed'){
          followMe(btn, icon, 'unfollow', 'follow', 'fa-minus', 'fa-plus');
        } else {
          console.log(data);
          alert_box.innerText = data;
          alert_box.classList.remove('success');
          alert_box.classList.add('error');
          alert_box.classList.remove('inactive');
        }
      });
    }
  });
}
}
if(report_buttons.length > 0){
  for(let btn of report_buttons){
    let title = document.getElementById('report-label'),
        url = `/${btn.dataset.artist}/commission/${btn.dataset.id}/report`;
    btn.addEventListener('click', ()=>{
      title.innerText = `Report ${btn.dataset.name}`;
      report_submit.setAttribute('data-url', `/fetch${url}`);
      report_form.setAttribute('action', url);
      $('#report-modal').modal('show');
    });
  }
  for(let btn of request_buttons){
    let price = document.getElementById('request-price'),
        submit = document.getElementById('request-submit'),
        title = document.getElementById('request-label'),
        url = `/fetch/request/new/${btn.dataset.artist_id}/${btn.dataset.id}`;
    btn.addEventListener('click', ()=>{
      title.innerText = `Request ${btn.dataset.name}`;
      price.innerHTML = `Price: $${(btn.dataset.price/100).toFixed(2)} <small>(Deposit: $${Math.floor((btn.dataset.price/100)/2).toFixed(2)})</small>`;
      submit.setAttribute('data-url', url);
      $('#request-modal').modal('show');
    });
  }
}
if(example_buttons.length > 0){
  for(let btn of example_buttons){
    let title = document.getElementById('example-label'),
        image = document.getElementById('example-image'),
        src = btn.dataset.src,
        name = btn.dataset.name;
    btn.addEventListener('click', ()=>{
      title.innerText = `${name} Example`;
      image.setAttribute('src', src);
      image.setAttribute('alt', `${name} Example Image`);
      $('#example-modal').modal('show');
    });
  }
}
if(request_input){
  request_input.addEventListener('input', (e)=>{
    handleDropFiles(upload_block, request_input.files);
  });
}
if(gallery_submit){
  gallery_submit.addEventListener('click', ()=>{
    let form = document.getElementById('new-gallery-form'),
        elements = form.elements,
        spinner = document.getElementById('new-gallery-spinner'),
        formData = new FormData(),
        nsfwTrue = document.getElementById('nsfw-yes'),
        NSFW = false,
        url = '/fetch/gallery/new',
        init = {method:'POST', credentials:'include', body:formData},
        honey = document.getElementById('honey');
    if(honey.value == ''){
      spinnerInactivate(form, spinner);
      for(let index of filesToRemove){
        filesToUpload.splice(index, 1);
      }
      for(let file of filesToUpload){
        formData.append('images', file);
      }
      if(nsfwTrue && nsfwTrue.checked == true){
        NSFW = true;
      }
      formData.append('NSFW',NSFW);
      for(let element of elements){
        if(['downscale','watermark'].includes(element.id)){
          formData.append(element.id, element.checked);
        } else {
          formData.append(element.id, element.value);
        }
      }
      formData.append('date', Date.now());
      fetch(url, init)
      .then((response)=>{
        spinnerInactivate(form, spinner);
        $('#new-gallery-modal').modal('hide');
        if(response.ok == true){
          successMessage('Completed.');
        } else {
          throw response.text();
        }
      })
      .catch((err)=>{
        errorMessage(err);
      })
    }
  });
}
// Submit Request 
if(request_submit){
  request_submit.addEventListener('click', ()=>{
    let spinner = document.getElementById('request-spinner'),
        form = document.getElementById('request-form'),
        formData = new FormData(),
        url = request_submit.dataset.url,
        init = {method:'POST',credentials:'include',body:formData};
    
    spinnerInactivate(form, spinner);
    form.classList.add('inactive');
    formData.append('downscale', true);
    formData.append('request', form.elements[0].value);
    for(let index of filesToRemove){
      filesToUpload.splice(index, 1);
    }
    for(let file of filesToUpload){
      if(filesToUpload.indexOf(file) < 4){
        formData.append('references', file);
      }
    }
    fetch(url, init)
    .then((response)=>{
      if(response.ok == false){
        return response.json();
      } else {
        spinnerInactivate(form, spinner);
        successMessage('Request Sent!');
        filesToRemove = [];
        filesToUpload = [];
        form.elements[0].value = '';
        upload_block.childNodes[10].innerHTML = '';
        upload_block.childNodes[8].innerHTML = '';
        $('#request-modal').modal('hide');
      }
    })
    .then((response)=>{
      if(response){
        errorMessage(response.message);
        spinnerInactivate(form, spinner);
      }
    });
  });
}
if(report_submit){
  report_submit.addEventListener('click', (e)=>{
  let url = report_submit.dataset.url,
      init = {
        method:'POST',
        credentials:'include',
        headers: {
            'content-type' : 'application/json'
          }
      };
  e.preventDefault();
  if(report_form.elements[4].checked == true){
    init.body = JSON.stringify({reason:report_form.elements[5].value});
  } else {
    for(let box of report_form.elements){
      if(box.checked == true){
        init.body = JSON.stringify({reason:box.value});
      }
    }
  }
  fetch(url, init)
  .then((response)=>{
    if(response.ok == true && response.status == 200){
      return response.text();
    } else {
      return response.json();
    }
  })
  .then((message)=>{
    if(message == 'Received'){
      alert_box.classList.add('success');
      alert_box.classList.remove('error');
      alert_box.classList.remove('inactive');
      alert_box.innerText = 'We\'re going to look into this right away.';
      $('#report-modal').modal('hide');
    } else {
      alert_box.classList.add('error');
      alert_box.classList.remove('success');
      alert_box.classList.remove('inactive');
      alert_box.innerText = message.message;
      $('#report-modal').modal('hide');
    }
  })
  .catch((error)=>{
    console.log(error);
    alert_box.classList.add('error');
    alert_box.classList.remove('success');
    alert_box.classList.remove('inactive');
    alert_box.innerText = error;
    $('#report-modal').modal('hide');
  });
});
}
function followMe(btn, icon, follow1, follow2, icon1, icon2){
  btn.setAttribute('data-original-title',`${follow2.slice(0,1)}${follow2.substring(1)} ${btn.dataset.artist}`);
  btn.classList.remove(follow1);
  btn.classList.add(follow2);
  icon.classList.remove(icon1);
  icon.classList.add(icon2);
}