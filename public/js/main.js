/*global FB fetch cropper croppedImg Cropper $*/
const alertbox = document.getElementById('alert-box'),
      radio = document.getElementsByName('reportImage'),
      other = document.getElementById('other'),
      textarea  = document.getElementById('report-text'),
      menu_button = document.getElementById('mobile-menu-button'),
      facebook = document.getElementById('facebook-share'),
      feedback_button = document.getElementById('send-feedback'),
      upload_blocks = document.getElementsByClassName('upload'),
      img_inputs = document.getElementsByClassName('img-input'),
      xhr = new XMLHttpRequest();
      
var   filesToUpload = [],
      filesToRemove = [];

for(let rad of radio){
  rad.addEventListener('change', function(){
    if(other.checked == true){
      textarea.classList.remove('inactive');
    } else {
      textarea.classList.add('inactive');
    }
  });
}
if(menu_button){
  menu_button.addEventListener('click', function(){
    let menu = document.getElementById('mobile-menu');
    menu.classList.toggle('open');
    menu.classList.toggle('closed');
    menu.classList.toggle('shadowed');
  });
}
if(facebook){
  facebook.addEventListener('click', function(){
    FB.ui({
      // method:'share',
      // display: 'popup',
      // href: facebook.dataset.href
      method: 'share_open_graph',
      action_type: 'og.likes',
      action_properties: JSON.stringify({
      object:facebook.dataset.href,
    })
    }, function(response){});
  });
}
if(feedback_button){
  feedback_button.addEventListener('click', function (){
    let url = "/feedback",
        init = {
          method: 'POST',
          body: JSON.stringify({feedback:document.getElementById('feedback-input').value, type:document.getElementById('feedback-type').value}),
          credentials: 'include',
          headers: {
          'content-type' : 'application/json'
          }
        };
    if('fetch' in window){
      fetch(url, init)
      .then((response)=>{
        if(response.ok == true){
          $('#feedback-modal').modal('hide');
          return response.json();
        } else {
          console.log(response);
          let errorAlert = document.getElementById('alert-info'),
              feedbackAlert = document.getElementById('feedback-alert');
          errorAlert.innerText = response.statusText;
          feedbackAlert.classList.remove('fade');
          feedbackAlert.classList.add('show');
        }
      })
      .then((data)=>{
        console.log(data);
      })
      .catch((error)=>{
        
      });
    } else {
      let formData = new FormData();
      formData.append('feedback', document.getElementById('feedback-input').value);
      xhr.open('POST', url, true);
      xhr.withCredentials = true;
      xhr.responseType = 'json';
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
          $('#feedback-modal').modal('hide');
          console.log(xhr.response);
        }
      };
      xhr.send(formData);
    }
  });
}
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});
// File Upload
for(let upload_block of upload_blocks){
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName =>{
  upload_block.addEventListener(eventName, preventDefaults);
});
['dragenter','dragover'].forEach(eventName => {
  upload_block.addEventListener(eventName, ()=>{
    upload_block.classList.add('dragging');
  });
});
['dragleave','drop'].forEach(eventName => {
  upload_block.addEventListener(eventName, ()=>{
    upload_block.classList.remove('dragging');
  });
});
upload_block.addEventListener('drop', (e)=>{
  let files = e.dataTransfer.files;
    upload_block.classList.add('active-imgs');
    handleDropFiles(upload_block, files);
  });
}
for(let input of img_inputs){
  input.addEventListener('input', function(){
    let parent = input.parentNode;
    handleDropFiles(parent, input.files);
  });
}
function updateDisplay(display, input, label, submit, ratio, spinner){
  while (display.firstChild){
    display.removeChild(display.firstChild);
  }
  let curFiles = input.files;
  if(curFiles.length === 0) {
    let p = document.createElement('p');
    p.innerText = "Nothing was selected for upload.";
    display.appendChild(p);
  } else {
    for(var i = 0; i < curFiles.length; i++){
      if(curFiles[i].size > 10000000){
        let p = document.createElement('p');
        p.innerText = "Sorry, that's too large. Please keep your file under 10 megabytes.";
        display.appendChild(p);
      } else {
        let img = document.createElement('img');
        img.setAttribute("class", "img-fluid");
        img.src = window.URL.createObjectURL(curFiles[i]);
        display.appendChild(img);
        if(ratio != null){
          cropper = new Cropper(img, {
            aspectRatio: ratio,
            crop: function(event) {
              cropper.getCroppedCanvas().toBlob(function(blob){
                croppedImg = blob;
              });
            }
          });
        }
      } 
    }
    if(label != null){
    label.classList.add('inactive');
    }
    submit.classList.remove('inactive');
  }
}
function spinnerInactivate (display, spinner){
  display.classList.toggle('inactive');
  spinner.classList.toggle('inactive');
}
function preventDefaults(e){
  e.preventDefault();
  e.stopPropagation();
}
function handleDropFiles(block, files){
  if(block.dataset.multiple == "true"){
    for(let file of files){
      processFile(undefined,block,file);
    }
  } else {
    processFile(undefined, block, files[0]);  
  }
  // if(block.dataset.multiple == "true"){
  //   for(let file of files){
  //     if(file.size < 10000000 && file.type.substring(0,5) == 'image'){
  //       renderPreview(block, file);
  //     } else {
  //       errorMessage('Your file is too large or not an image.');
  //     }
  //   }
  // } else {
  //   let previews = block.childNodes[6];
  //   previews.innerHTML = '';
  //   filesToUpload = [];
  //   filesToRemove = [];
  // if(files[0].size < 10000000 && files[0].type.substring(0,5) == 'image'){
  //     renderPreview(block, files[0]);
  //   } else {
  //     errorMessage('Your file is too large or not an image.');
  //   }
  // }
}
function renderPreview(upload_block, file){
  let reader = new FileReader(),
      previews = upload_block.childNodes[6];
  reader.readAsDataURL(file);
  reader.addEventListener('loadend', () => {
    let img = document.createElement('img');
    upload_block.classList.add('active-imgs');
    filesToUpload.push(file);
    img.src = reader.result;
    img.classList.add('preview-image');
    img.setAttribute('data-index', filesToUpload.indexOf(file));
    img.addEventListener('click', ()=>{
      let index = img.dataset.index;
      filesToRemove.push(index);
      if(filesToRemove.length == filesToUpload.length){
        upload_block.classList.remove('active-imgs');
      }
      previews.removeChild(img);
    });
    previews.appendChild(img);
  });
}
function removeAlert(){
  setTimeout(function(){
    alertbox.classList.add('fade-out');
    setTimeout(function(){
      alertbox.classList.add('inactive');
      alertbox.classList.remove('fade-out');
    }, 400);
  }, 5000);
}
function successMessage(message){
  alertbox.classList.remove('error');
  alertbox.classList.add('success');
  alertbox.innerText = message;
  alertbox.classList.remove('inactive');
  removeAlert();
}
function errorMessage(err){
  alertbox.classList.remove('success');
  alertbox.classList.add('error');
  alertbox.innerText = err;
  alertbox.classList.remove('inactive');
  removeAlert();
}
function processFile(level, block, file){
  let type = file.type.split('/')[0],
      extension = file.name.split('.')[1],
      previews = block.childNodes[10],
      maxVid,
      maxSize,
      sizeError;
  if(['free', undefined].includes(level)){
    sizeError = `${file.name} is too large. Please keep videos under 500MB and all others under 10MB`;
    maxVid = 50000000;
    maxSize = 10000000;
  } else if(level == 'plus') {
    sizeError = `${file.name} is too large. Please keep videos under 1GB and all others under 50MB`;
    maxVid = 1000000000;
    maxSize = 50000000;
  } else {
    sizeError = `${file.name} is too large. Please keep videos under 5GB and all others under 50MB`;
    maxVid = 5000000000;
    maxSize = 50000000;
  }
  if((type == 'video' && file.size > maxVid)){
    errorMessage(sizeError);
  } else if(type != 'video' && file.size > maxSize){
    errorMessage(sizeError);
  } else {
    let meter = document.getElementsByClassName('meter')[0],
        deleteBtn = document.createElement('button'),
        playBtn = document.createElement('button'),
        playIcon = document.createElement('i'),
        reader = new FileReader(),
        elementBlock = document.createElement('span'),
        element,
        player = document.getElementsByClassName('preview-player')[0];
        
    block.classList.add('active-imgs');
    meter.classList.remove('inactive');
    reader.readAsDataURL(file);
    filesToUpload.push(file);
    reader.addEventListener('progress',(e)=>{
      if(e.lengthComputable && e.total != 0){
        let span = meter.firstElementChild,
            width = `${(e.loaded / e.total)*100}%`;
        span.setAttribute('style', `width:${width}`);
      }
    });
    reader.addEventListener('load', ()=>{
      if(type == 'image'){
        element = document.createElement('img');
        element.setAttribute('src', reader.result);
      } else if(['video','audio'].includes(type)) {
        playBtn.setAttribute('data-fullType', file.type);
        playBtn.setAttribute('data-type', type);
        playBtn.setAttribute('data-url', reader.result);
        playBtn.setAttribute('type', 'button');
        playIcon.setAttribute('class', 'fas fa-play fa-lg text-success');
        playBtn.appendChild(playIcon);
        element = document.createElement('i');
        element.setAttribute('class', `fal fa-file-${type} fa-5x text-info`);
        playBtn.addEventListener('click', ()=>{
          if(player.firstElementChild){
            let preview = player.firstElementChild;
            if(preview.getAttribute('src') == playBtn.dataset.url){
              if(preview.paused == true){
                preview.play();
              } else {
                preview.pause();
              }
            } else {
              player.removeChild(preview);
              buildPlayer(playBtn, player);
            }
          } else {
            buildPlayer(playBtn, player);
          }
        });
      } else if(['html','css','js'].includes(extension)){
        element = document.createElement('i');
        element.setAttribute('class', 'fal fa-file-code fa-5x text-primary');
      } else if(extension == 'docx') {
        element = document.createElement('i');
        element.setAttribute('class', 'fal fa-file-word fa-5x text-word');
      } else if(extension == 'pdf'){
        element = document.createElement('i');
        element.setAttribute('class', 'fal fa-file-pdf fa-5x text-danger');
      } else {
        element = document.createElement('i');
        element.setAttribute('class', 'fal fa-file fa-5x text-default');
      }
      element.classList.add('first');
      deleteBtn.innerHTML = '<i class="far fa-times fa-lg text-danger"></i>';
      deleteBtn.setAttribute('type', 'button');
      deleteBtn.setAttribute('data-index', filesToUpload.indexOf(file));
      deleteBtn.addEventListener('click', ()=>{
        let index = deleteBtn.dataset.index;
        
        filesToRemove.push(index);
        if(filesToRemove.length == filesToUpload.length){
          block.classList.remove('active-imgs');
        }
        previews.removeChild(deleteBtn.parentNode);
      });
      elementBlock.appendChild(element);
      elementBlock.appendChild(playBtn);
      elementBlock.appendChild(deleteBtn);
      elementBlock.classList.add('preview');
      previews.appendChild(elementBlock);
      meter.classList.add('inactive');
    });
  }
}
function buildPlayer(playBtn, player){
  let preview = document.createElement(playBtn.dataset.type);
  preview.setAttribute('type', playBtn.dataset.fullType);
  preview.setAttribute('src', playBtn.dataset.url);
  preview.setAttribute('controls', true);
  preview.setAttribute('width', 382);
  preview.load();
  player.appendChild(preview);
  preview.play();
}