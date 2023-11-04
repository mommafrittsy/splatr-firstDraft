/* global fetch */
const uploadShowBtns = document.getElementsByClassName('upload-show'),
      uploadBlocks = Array.from(document.getElementsByClassName('comm-upload')),
      previewBlocks = Array.from(document.getElementsByClassName('preview-box')),
      progressBars = Array.from(document.getElementsByClassName('meter')),
      fileIndexes = Array.from(document.getElementsByClassName('file-index')),
      fileTotals = Array.from(document.getElementsByClassName('file-total')),
      submits = Array.from(document.getElementsByClassName('submit-upload')),
      actionBtns = Array.from(document.getElementsByClassName('action-btn')),
      level = document.getElementById('level').value,
      inputs = document.getElementsByClassName('upload-files'),
      transID = document.getElementById('trans-id').value,
      imagePreviews = document.getElementsByClassName('grid-image'),
      commSubmit = document.getElementById('comment-submit'),
      reviewSubmit = document.getElementById('review-submit');

for(let btn of uploadShowBtns){
  btn.addEventListener('click', ()=>{
    btn.nextElementSibling.classList.toggle('open');
  });
}
for(let block of uploadBlocks){
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName =>{
    block.addEventListener(eventName, preventDefaults);
  });
  ['dragenter','dragover'].forEach(eventName => {
    block.addEventListener(eventName, ()=>{
      block.classList.add('dragging');
    });
  });
  ['dragleave','drop'].forEach(eventName => {
    block.addEventListener(eventName, ()=>{
      block.classList.remove('dragging');
    });
  });
  block.addEventListener('drop', (e)=>{
    let files = Array.from(e.dataTransfer.files);
    block.classList.add('active');
    dropFiles(files, block);
  });
}
for(let input of inputs){
  input.addEventListener('input', ()=>{
    let parent = input.parentNode;
    dropFiles(input.files, parent);
  });
}
for(let btn of submits){
  btn.addEventListener('click', ()=>{
    let xhr = new XMLHttpRequest(),
        url = `/fetch/transaction/${transID}/${btn.dataset.name}`,
        data = new FormData(),
        meter = document.getElementById('upload-meter');
    
    for(let index of filesToRemove){
      filesToUpload.splice(index, 1);
    }
    for(let file of filesToUpload){
      data.append('files', file);
    }
    data.append('level', level);
    meter.classList.remove('inactive');
    meter.firstElementChild.removeAttribute('style');
    xhr.upload.addEventListener('progress',(e)=>{
      if(e.lengthComputable && e.total != 0){
        let span = meter.firstElementChild,
            width = `${(e.loaded/e.total)*100}%`;
        span.setAttribute('style', `width:${width}`);
        if(width == '100%'){
          meter.classList.add('full');
          span.innerText = 'Processing Files';
        }
      }
    });
    xhr.responseType = "json";
    xhr.onreadystatechange = ()=>{
      if(xhr.status != 200 && xhr.response){
        errorMessage(xhr.response.message);
      } else {
        meter.firstElementChild.removeAttribute('style');
        meter.classList.add('inactive');
      }
    };
    xhr.open('PUT', url);
    xhr.send(data);
  });
}
for(let btn of imagePreviews){
  let children = document.getElementById('player-body').children,
      modal = document.getElementById('playerModal').children[0];
  btn.addEventListener('click', ()=>{
    let player = document.getElementById(`modal-${btn.dataset.type}`);
    for(let child of children){
      child.classList.add('inactive');
    }
    if(window.innerWidth > 900){
      modal.classList.add('modal-lg');
    } else if(window.innerWidth > 1200){
      modal.classList.add('modal-xl');
    }
    player.setAttribute('src', btn.dataset.url);
    if(btn.dataset.type != 'img'){
      player.load();
    }
    player.classList.remove('inactive');
  });
}
for(let btn of actionBtns){
  btn.addEventListener('click', ()=>{
    let url = `/fetch/transaction/${transID}/${btn.dataset.id}`,
        init = {method:'PUT', credentials:'include'};
    fetch(url, init)
    .then((response)=>{
      if(response.ok){
        return response.text();
      } else {
        throw response.text();
      }
    })
    .then((success)=>{
      successMessage(success);
    })
    .catch((err)=>{
      errorMessage(err);
    });
  });
}
if(commSubmit){
  commSubmit.addEventListener('click', ()=>{
    submitComment();
  });
  document.getElementById('comment-input').addEventListener('keydown', (e)=>{
    if(['Enter','Tab'].includes(e.key)){
      submitComment();
    }
  });
}
if(reviewSubmit){
  reviewSubmit.addEventListener('click', (e)=>{
    e.preventDefault();
    let inputs = reviewSubmit.parentElement.elements,
        body = new FormData(),
        url = `/fetch/transaction/${reviewSubmit.dataset.id}/review`,
        init = {method:'PUT', body, credentials:'same-origin'};
    
    for(let input of inputs){
      body.append(input.id, input.value);
    }
    fetch(url, init)
    .then((response)=>{
      if(response.ok){
        successMessage('Review Posted!');
      } else {
        throw response.json();
      }
    })
    .catch((err)=>{
      errorMessage(err.message);
    });
  });
}

function dropFiles(files, block){
  let index = uploadBlocks.indexOf(block),
      fileIndex = fileIndexes[index],
      fileTotal = fileTotals[index],
      meter = progressBars[index + 1],
      previews = previewBlocks[index],
      submit = submits[index];
  
  fileTotal.innerText = files.length;
  fileTotal.parentNode.classList.remove('inactive');
  for(let file of files){
    let type = file.type.split('/')[0],
        extension = file.name.split('.').pop(),
        element,
        elementBlock = document.createElement('span'),
        maxVid = 50000000,
        maxSize = 10000000,
        sizeError = `${file.name} is too large. Please keep videos under 50MB and all others under 10MB`;
    
    if(level == 'plus'){
      sizeError = `${file.name} is too large. Please keep videos under 1GB and all others under 50MB`;
      maxVid = 1000000000;
      maxSize = 50000000;
    } else if(level == 'ultra'){
      sizeError = `${file.name} is too large. Please keep videos under 5GB and all others under 50MB`;
      maxVid = 5000000000;
      maxSize = 50000000;
    }
    
    if((type == 'video' && file.size > maxVid) || (type != 'video' && file.size > maxSize)){
      errorMessage(sizeError);
      if(files.indexOf(file) == files.length - 1){
        meter.classList.add('inactive');
      }
    } else {
      let deleteBtn = document.createElement('button'),
          reader = new FileReader();
      if(files.indexOf(file) == 0){
        meter.classList.remove('inactive');
        fileTotal.parentNode.classList.add('inactive');
      }
      fileIndex.innerText = files.indexOf(file) + 1;
      reader.readAsDataURL(file);
      filesToUpload.push(file);
      reader.addEventListener('progress', (e)=>{
        if(e.lengthComputable && e.total != 0){
          let span = meter.firstElementChild,
              width = `${(e.loaded/e.total)*100}%`;
          if(width == '100%'){
            span.removeAttribute('style');
            meter.classList.add('full');
          } else {
            span.setAttribute('style', `width:${width}`);
          }
        }
      });
      reader.addEventListener('load', ()=>{
        if(type == 'image'){
          element = document.createElement('img');
          element.setAttribute('src', reader.result);
          if(document.getElementById('img-alter') && document.getElementById('img-alter').parentNode == block){
            document.getElementById('img-alter').classList.remove('inactive');
          }
        } else if (['video','audio'].includes(type)){
          let source = document.createElement('source');
          element = document.createElement(type);
          element.setAttribute('controls', true);
          source.setAttribute('src', reader.result);
          element.appendChild(source);
        } else {
          element = document.createElement('i');
          element.setAttribute('class', 'fab fa-3x');
          if(extension == 'html'){
            element.classList.add('fa-html5');
          } else if(extension == 'css'){
            element.classList.add('fa-css3-alt');
          } else if(extension == 'js'){
            element.classList.add('fa-js');
          } else {
            element.classList.remove('fab');
            element.classList.add('far');
            if(['py','scss','xml','ejs','php'].includes(extension)){
              element.classList.add('fa-code');
            } else if(extension == 'pdf'){
              element.classList.add('fa-file-pdf');
            } else {
              element.classList.add('fa-file-alt');
            }
          }
        }
        element.setAttribute('title', file.name);
        deleteBtn.innerHTML = '<i class="far fa-times fa-lg text-danger"></i>';
        deleteBtn.setAttribute('type', 'button');
        deleteBtn.setAttribute('data-index', filesToUpload.indexOf(file));
        deleteBtn.addEventListener('click', ()=>{
          let index = deleteBtn.dataset.index;
          
          filesToRemove.push(index);
          if(filesToRemove.length == filesToUpload.length){
            block.classList.remove('active');
            submit.classList.add('inactive');
          }
          previews.removeChild(deleteBtn.parentNode);
        });
        elementBlock.appendChild(element);
        elementBlock.appendChild(deleteBtn);
        elementBlock.classList.add('comm-preview');
        previews.appendChild(elementBlock);
        if(files.indexOf(file) == files.length - 1){
          meter.classList.add('inactive');
          fileTotal.parentNode.classList.add('inactive');
          submit.classList.remove('inactive');
        }
      });
    }
  }
}
function preventDefaults(e){
  e.preventDefault();
  e.stopPropagation();
}
function submitComment(){
  let text = document.getElementById('comment-textarea').value,
        url = `/fetch/transaction/${commSubmit.dataset.id}/comment`,
        body = new FormData(),
        init = {method:'POST', body, credentials:'same-origin'};
        
  body.append('content', text);
  fetch(url, init)
  .then((response)=>{
    if(response.ok){
      let comments = document.getElementById('comments'),
          block = document.createElement('div'),
          img = document.createElement('img'),
          commentText = document.createElement('p'),
          date = document.createElement('p');
      
      commentText.classList.add('comment-text');
      commentText.innerText = text;
      date.setAttribute('class','comment-username comment-date');
      date.innerText = 'Just Now.';
      img.classList.add('profile-img');
      img.src = commSubmit.dataset.img;
      block.setAttribute('class','comment right');
      for(let el of [img, date, commentText]){
        el.classList.add('comment-child');
        block.appendChild(el);
      }
      comments.appendChild(block);
      document.getElementById('comment-textarea').value = '';
    } else {
      throw response.json();
    } 
  })
  .catch((err)=>{
    errorMessage(err.message);
  });
}