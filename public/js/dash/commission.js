/* global filesToUpload fetch notification_sound*/
const delete_btns = document.getElementsByClassName('delete-button'),
      new_comm_btns = document.getElementsByClassName('new-comm'),
      comm_example_input = document.getElementById('comm-example-input'),
      comm_example_upload = document.getElementById('comm-example-upload'),
      comm_submit = document.getElementById('new-comm-button'),
      comm_edit_btns = document.getElementsByClassName('edit-button'),
      edit_comm_button = document.getElementById('edit-comm-button'),
      comm_status_btns = document.getElementsByClassName('comm-status');

for (let btn of delete_btns){
  let names = document.getElementsByClassName('delete-comm-name'),
      delete_btn = document.getElementById('delete-comm-button'),
      url = `/fetch/commission/delete/${btn.dataset.id}`,
      init = {method:'DELETE', credentials:'include'};
  btn.addEventListener('click', ()=>{
    for(let name of names){
      name.innerText = btn.dataset.name;
    }
    $('#delete-comm-modal').modal('show');
    delete_btn.addEventListener('click', function(){
      fetch(url, init)
      .then((response)=>{
        if(response.ok == true){
          let parent = btn.parentNode,
              commissions = document.getElementById('commissions');
          commissions.removeChild(parent);
          successMessage('Removed.');
          $('#delete-comm-modal').modal('hide');
        } else {
          errorMessage('We couldn\'t remove that.');
          $('#delete-comm-modal').modal('hide');
        }
      })
      .catch((err)=>{
        console.log(err);
        errorMessage(err.message);
      });
    });
  });
}
for(let btn of new_comm_btns){
  btn.addEventListener('click', function(){
    let form = document.getElementById('comm-form');
    form.reset();
    $('#comm-modal').modal('toggle');
  });
}
for(let btn of comm_edit_btns){
  btn.addEventListener('click', function(){
    let preview = document.getElementById('edit-preview-images'),
        image = document.createElement('img'),
        name = document.getElementById('edit-comm-name'),
        price = document.getElementById('edit-comm-price'),
        available = document.getElementById('edit-comm-available'),
        description = document.getElementById('edit-comm-description'),
        tags = document.getElementById('edit-comm-tags'),
        type = document.getElementById('edit-comm-type'),
        nsfwYes = document.getElementById('edit-nsfw-yes'),
        nsfwNo = document.getElementById('edit-nsfw-no');
    preview.innerHTML = '';
    image.classList.add('preview-image');
    image.setAttribute('src', btn.dataset.image);
    preview.appendChild(image);
    name.value = btn.dataset.name;
    price.value = btn.dataset.price;
    if(btn.dataset.available != ''){
      available.value = btn.dataset.available;
    }
    description.value = btn.dataset.description;
    tags.value = btn.dataset.tags;
    if(btn.dataset.nsfw == "true" && nsfwYes){
      nsfwNo.setAttribute('checked', false);
      nsfwYes.setAttribute('checked', true);
    } else {
      nsfwYes.setAttribute('checked', false);
      nsfwNo.setAttribute('checked', true);
    }
    type.childNodes[1].setAttribute('value', btn.dataset.type);
    type.childNodes[1].setAttribute('selected', true);
    type.childNodes[1].setAttribute('disabled', false);
    type.childNodes[1].innerText = `${btn.dataset.type.substring(0,1).toUpperCase()}${btn.dataset.type.substring(1)}`;
    edit_comm_button.setAttribute('data-id', btn.dataset.id);
    $('#edit-comm-modal').modal('show');
  });
}
for(let btn of comm_status_btns){
  btn.addEventListener('click', ()=>{
    window.location.href = '/dash/commission/status';
  });
}
comm_example_input.addEventListener('input', function(){
  handleDropFiles(document.getElementById('comm-example-upload'), comm_example_input.files);
  comm_submit.removeAttribute('disabled');
});
comm_example_upload.addEventListener('drop', ()=>{
  console.log('triggered');
  comm_submit.removeAttribute('disabled');
});
comm_submit.addEventListener('click', function(){
  newComm();
});
edit_comm_button.addEventListener('click', function(){
  editComm(edit_comm_button.dataset.id);
});
function newComm(){
  let form = document.getElementById('comm-form'),
      spinner = document.getElementById('comm-spinner'),
      image = filesToUpload[0],
      name  = document.getElementById('comm-name').value,
      price = document.getElementById('comm-price').value,
      priceVal = Number(price)*100,
      available = document.getElementById('comm-available').value,
      availableVal  = Number(available),
      description = document.getElementById('comm-description').value,
      type  = document.getElementById('comm-type').value,
      NSFW  = '',
      tags  = document.getElementById('comm-tags').value,
      url = '/fetch/commission/new',
      formData = new FormData();
  if(document.getElementById('NSFW') == null || document.getElementById('nsfw-no').checked){
    NSFW = false;
  } else if(document.getElementById('nsfw-yes').checked){
    NSFW = true;
  }
  formData.append('image', image);
  formData.append('name', name);
  formData.append('price', priceVal);
  formData.append('available', availableVal);
  formData.append('description',description);
  formData.append('type', type);
  formData.append('NSFW', NSFW);
  formData.append('tags', tags);
  
  let init  = {method:'PUT', body:formData, credentials:'include'};
  fetch(url, init)
  .then((response)=>{
    if(response.ok != true){
      throw {message:'PROBLEM!!!!'};
    }
    return response.json();
  })
  .then((data)=>{
    let commissions = document.getElementById('commissions'),
        article = document.createElement('article'),
        image = document.createElement('div'),
        name = document.createElement('h1'),
        price = document.createElement('h2'),
        available = document.createElement('p'),
        description = document.createElement('p'),
        tagArea = document.createElement('div');
    article.setAttribute('class', `block commission nsfw-${data.NSFW}`);
    image.classList.add('commission-image');
    image.setAttribute('style', `background-image:url(${data.example.url})`);
    article.appendChild(image);
    name.classList.add('name');
    name.innerText = data.name;
    article.appendChild(name);
    price.innerText = `$${(data.price/100).toFixed(0)}`;
    article.appendChild(price);
    if(data.available){
      available.innerText = `Number Available: ${data.available}`;
      article.appendChild(available);
    }
    description.classList.add('description');
    description.innerText = data.description;
    article.appendChild(description);
    if(data.tags.length > 1){
      for(let tag of data.tags){
        if(tag.length > 1){
          let span = document.createElement('span');
          span.setAttribute('class', 'badge tag');
          span.innerText = `#${tag}`;
          tagArea.appendChild(span);
        }
      }
      article.appendChild(tagArea);
    }
    commissions.appendChild(article);
    successMessage('Fancy!');
    form.classList.remove('inactive');
    spinner.classList.add('inactive');
    $('#comm-modal').modal('hide');
  })
  .catch((err)=>{
    errorMessage(err.message);
    form.classList.remove('inactive');
    spinner.classList.add('inactive');
    $('#new-comm-modal').modal('hide');
    console.log(err);
  });
}
function editComm(id){
  let name = document.getElementById('edit-comm-name').value,
      price = (Number(document.getElementById('edit-comm-price').value))*100,
      available = Number(document.getElementById('edit-comm-available').value),
      description = document.getElementById('edit-comm-description').value,
      type = document.getElementById('edit-comm-type').value,
      tags = document.getElementById('edit-comm-tags').value,
      NSFW = false,
      form = document.getElementById('edit-comm-form'),
      spinner = document.getElementById('edit-comm-spinner'),
      formData = new FormData(),
      url = `/fetch/commission/edit/${id}`,
      init = {method:'PUT', body: formData, credentials:'include'},
      zone = document.getElementById('new-notification-zone'),
      newNote = document.createElement('article'),
      icon = document.createElement('i'),
      text = document.createElement('p');
      
  if(document.getElementById(`edit-nsfw-yes`) && document.getElementById('edit-nsfw-yes').checked == true){
    NSFW = true;
  }
  if(filesToUpload.length > 0){
    formData.append('image', filesToUpload[0]);
  }
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('type', type);
  formData.append('NSFW', NSFW);
  formData.append('tags', tags);
  formData.append('available', available);
  form.classList.add('inactive');
  spinner.classList.remove('inactive');
  fetch(url, init)
  .then((response)=>{
    newNote.classList.add('new-notification');
    if(response.ok == false){
      throw {message: 'PROBLEM!!!!'};
    } else {
      return response.json();
    }
  })
  .then((data)=>{
    text.innerText = `${data.name} was successfully updated`;
    icon.setAttribute('class', 'fas, fa-2x fa-fw fa-check-circle');
    newNote.classList.add('money');
    dashEventNote(newNote, icon, text, zone);
    $('#edit-comm-modal').modal('hide');
  })
  .catch((err)=>{
    text.innerText = err.message;
    icon.setAttribute('class', 'fas, fa-2x fa-fw fa-times-circle');
    newNote.classList.add('like');
    dashEventNote(newNote, icon, text, zone);
    $('#edit-comm-modal').modal('hide');
  })
}

function dashEventNote(note, icon, text, zone){
  note.appendChild(icon);
  note.appendChild(text);
  notification_sound.play();
  setTimeout(function(){
    note.classList.add('fade-out');
    setTimeout(function(){
      zone.removeChild(note);
    }, 400);
  }, 5000);
}