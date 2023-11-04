/* global preventDefaults cropper croppedImg Cropper fetch successMessage errorMessage*/
const imgCropBox = document.getElementById('crop-upload'),
      imgCropInput = document.getElementById('crop-input'),
      imgCropSubmit = document.getElementById('crop-submit'),
      modalBtns = document.getElementsByClassName('crop-modal-btn'),
      modalTitle = document.getElementById('crop-modal-label'),
      backgroundBtns = document.getElementsByClassName('background-btn'),
      tagsInput = document.getElementById('tags-input'),
      tagsArea = document.getElementById('tags'),
      artistDetails = document.getElementsByClassName('details'),
      usernameInput = document.getElementById('username'),
      detailCancel = document.getElementsByClassName('detail-cancel'),
      detailSave = document.getElementsByClassName('detail-save'),
      submitBtns = document.getElementsByClassName('submit-button'),
      socialInputs = document.getElementsByClassName('social-input'),
      socialSubmit = document.getElementById('submit-social');

// Drag Input
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName =>{
  imgCropBox.addEventListener(eventName, preventDefaults);
});
['dragenter','dragover'].forEach(eventName => {
  imgCropBox.addEventListener(eventName, ()=>{
    imgCropBox.classList.add('dragging');
  });
});
['dragleave','drop'].forEach(eventName => {
  imgCropBox.addEventListener(eventName, ()=>{
    imgCropBox.classList.remove('dragging');
  });
});
imgCropBox.addEventListener('drop', (e)=>{
  let files = e.dataTransfer.files;
    imgCropBox.classList.add('active-imgs');
    handleCropFiles(imgCropBox, files, imgCropBox.dataset.ratio);
});
imgCropInput.addEventListener('input', ()=>{
  let parent = imgCropInput.parentNode;
  handleCropFiles(parent, imgCropInput.files, imgCropInput.dataset.ratio);
});

// Crop Images
imgCropSubmit.addEventListener('click', (e)=>{
  let url = `/fetch/${imgCropSubmit.dataset.name}`,
      formData = new FormData(),
      init = {
        method:'PUT',
        body: formData,
        credentials: 'include'
      },
      box = document.getElementById(`crop-upload`),
      spinner = document.getElementById(`crop-spinner`);
  spinnerSwitch(box, spinner);
  formData.append('image', croppedImg);
  e.preventDefault();
  fetch(url, init)
  .then((response)=>{
    if(response.ok == false){
      throw {message:'We\'ve had a problem'};
    } else {
      cropper.destroy();
      hideYourChildren(imgCropSubmit.parentNode);
      successMessage('Image Uploaded. Looks Good!');
      spinnerSwitch(box, spinner);
    }
  })
  .catch((err)=>{
    errorMessage(err.message);
  });
});
for(let btn of modalBtns){
  let name = btn.dataset.name,
      ratio = btn.dataset.ratio,
      title = `Upload ${btn.dataset.name.substring(0, 1).toUpperCase()}${btn.dataset.name.substring(1)} Picture`;
  btn.addEventListener('click', ()=>{
    imgCropSubmit.setAttribute('data-name', name);
    imgCropBox.setAttribute('data-ratio', ratio);
    modalTitle.innerText = title;
    $('#crop-modal').modal('show');
  });
}

// Background Change
for(let btn of backgroundBtns){
  btn.addEventListener('click', ()=>{
    let array = Array.from(backgroundBtns),
        index = array.indexOf(btn),
        url = '/fetch/dash_background',
        formData = new FormData(),
        init = {method:'PUT', body:formData, credentials:'include'};
    formData.append('index', index);
    fetch(url, init)
    .then((response)=>{
      return response.text();
    })
    .then((response)=>{
      let main = document.getElementsByTagName('main')[0],
          hgroup = document.getElementsByTagName('hgroup')[0],
          link = hgroup.childNodes[5].childNodes[1];
      if(response[0] == "#"){
        main.setAttribute('style', `background:${response}`);
      } else {
      main.setAttribute('style', `background-image:linear-gradient(to bottom, rgba(0,0,0,.75), rgba(67,67,67,.75)), url('${response}');`);
      }
      if(response == "#f0efea") {
        hgroup.setAttribute('style', 'color: #757575');
        link.setAttribute('style', 'color:#757575');
      } else {
        hgroup.setAttribute('style', 'color: #fff');
        link.setAttribute('style', 'color:#fff');
      }
    })
    .catch((err)=>{
      errorMessage(err);
    });
  });
}

// Artist Details
for(let input of artistDetails){
  let buttons = document.getElementById(`${input.getAttribute('id')}-btns`);
  input.addEventListener('focus', ()=>{
    buttons.classList.add('detail-open');
  });
  input.addEventListener('keypress', (e)=>{
    if(['Tab', 'Key'].includes(e.key)){
      e.preventDefault();
      updateDetails(input);
    }
  });
}
for(let btn of detailCancel){
  btn.addEventListener('click', ()=>{
    let input = document.getElementById(btn.dataset.type);
    input.value = btn.dataset.previous;
    btn.parentNode.classList.remove('detail-open');
  });
}
for(let btn of detailSave){
  btn.addEventListener('click', ()=>{
    let input = document.getElementById(btn.dataset.type);
    updateDetails(input);
    btn.parentNode.classList.remove('detail-open');
  });
}

// Tags
tagsInput.addEventListener('keypress', (e)=>{
  if(['Tab','Enter'].includes(e.key)){
    e.preventDefault();
    createTag(tagsInput.value);
  } else if(e.key == "#" && tagsInput.value.length > 1){
    createTag(tagsInput.value);
    tagsInput.value = "#";
  }
  
});

// Username
usernameInput.addEventListener('input', (e)=>{
  let taken = document.getElementById('taken-badge'),
      free = document.getElementById('free-badge'),
      url = '/fetch/username',
      formData = new FormData(),
      init = {method:'PUT', body:formData, credentials:'include'};
    formData.append('username', usernameInput.value);
    fetch(url, init)
    .then((response)=>{
      taken.innerText = '';
      free.innerText = '';
      if(response.ok == true){
        free.innerText = 'You\'re good.';
      } else {
        taken.innerText = 'That\'s taken';
      }
    })
    .catch((err)=>{
      errorMessage(err);
    });
  });

// Settings Updates
for(let btn of submitBtns){
  btn.addEventListener('click',()=>{
    let form = btn.parentNode,
        url = `/fetch/${btn.dataset.name}`,
        formData = new FormData(),
        init = {method:'PUT', body: formData, credentials: 'include'};
    for (let field of form.elements){
      if(field.getAttribute('type') == 'checkbox'){
        formData.append(field.getAttribute('id'), field.checked);
      } else {
        formData.append(field.getAttribute('id'), field.value);
      }
    }
    fetch(url, init)
    .then((response)=>{
      if(response.ok == false){
        throw response.text();
      } else {
        successMessage(`We've updated your ${btn.dataset.name}.`);
      }
    })
    .catch((err)=>{
      errorMessage(err);
    });
  });
}

// Social Inputs
for(let input of socialInputs){
  input.addEventListener('keypress', (e)=>{
    if(e.key == 'Tab' || e.key == 'Enter'){
      updateSocial(input);
    }
  });
}
socialSubmit.addEventListener('click', ()=>{
  let url = '/fetch/social_all',
      form = document.getElementById('social-form'),
      formData = new FormData(),
      init = {method:'PUT', body:formData, credentials:'include'};
  
  for(let input of form.elements){
    formData.append(input.dataset.name, input.value);
  }
  fetch(url, init)
  .then((response)=>{
    if(response.ok == true){
      successMessage('Go forth and be social!');
    } else {
      throw response.text();
    }
  })
  .catch((err)=>{
    errorMessage(err);
  });
});

function createTag(value){
  let url = '/fetch/style',
      formData = new FormData(),
      init = {method:'PUT', body:formData, credentials:'include'},
      tag = document.createElement('span');
  tag.setAttribute('class', 'badge badge-success my-2 ml-2');
  tag.innerHTML = `${value}<span class="ml-3" onclick="removeTag(this)">X</span>`;
  tagsArea.appendChild(tag);
  formData.append('style', value);
  fetch(url, init)
  .then((response)=>{
    tagsInput.value = '';
  })
  .catch((err)=>{
    errorMessage(err);
  })
}
function handleCropFiles(box, files, ratio){
  let previews = box.childNodes[6],
      img = previews.childNodes[1],
      ratioNum;
  if(ratio == '1/1'){
    ratio = 1/1;
  } else if(ratio == '16/9'){
    ratio = 16/9;
  }
  img.src = window.URL.createObjectURL(files[0]);
  hideYourChildren(box);
  console.log(ratio);
  cropper = new Cropper(img, {
    aspectRatio: ratio,
    crop: function(event) {
      cropper.getCroppedCanvas().toBlob(function(blob){
        croppedImg = blob;
      });
    },
    preview:document.getElementById('crop-preview'),
    viewMode: 2
  });
}
function hideYourChildren(parent){
  for(let child of parent.childNodes){
    if(child.classList && child.classList.contains('to-hide')){
      child.classList.toggle('inactive');
    }
  }
}
function removeTag(value){
  let tag = value.parentNode,
      url = '/fetch/style',
      formData = new FormData(),
      init = {method:'DELETE', body: formData, credentials:'include'};
  tagsArea.removeChild(tag);
  formData.append('tag', tag.innerText);
  fetch(url, init)
  .catch((err)=>{
    errorMessage(err);
  });
}
function updateDetails(input){
  let url = `/fetch/${input.getAttribute('id')}`,
      formData = new FormData(),
      init = {method: 'PUT', body: formData, credentials: 'include'};
  formData.append(`${input.getAttribute('id')}`, input.value);
  fetch(url, init)
  .then((response)=>{
    if(response.ok == false){
      throw 'There was a problem.';
    } else {
      successMessage(`Your ${input.getAttribute('id')} was updated!`);
    }
  })
  .catch((err)=>{
    errorMessage(err);
  });
}
function updateSocial(input){
  let url = `/fetch/social`,
      formData = new FormData(),
      init = {method:'PUT', body:formData, credentials:'include'};
  
  formData.append('value', input.value);    
  formData.append('network', input.dataset.name);
  
  fetch(url, init)
  .then((response)=>{
    if(response.ok == true){
      successMessage('Go forth and be social!');
    } else {
      throw response.text();
    }
  })
  .catch((err)=>{
    errorMessage(err);
  });
}