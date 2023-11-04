/* global fetch xhr */
const likeBtn = document.getElementById('like-btn'),
      commentLikeBtns = document.getElementsByClassName('comment-like'),
      fetchAlert = document.getElementById('fetch-alert'),
      fetchText = document.getElementById('fetch-alert-text'),
      go_back = document.getElementById('go-back'),
      go_forward = document.getElementById('go-forward'),
      show_btn = document.getElementById('no-nsfw-btn'),
      edit_form = document.getElementById('edit-form'),
      priors = document.getElementsByClassName('prior-image'),
      priors_to_remove = [],
      delete_btn = document.getElementById('delete-btn');
var currentIndex = 0;

if(likeBtn){
  likeBtn.addEventListener('click', function(){
  let url = likeBtn.dataset.url,
      init = {
        method: 'PUT',
        credentials:'include'
      },
      likes = likeBtn.dataset.likes,
      icon = document.getElementById('like-icon'),
      span = document.getElementById('like-number');
      
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        return response.text();
      } else {
        throw 'We were unable to do that.';
      }
    })
    .then((data)=>{
      if(data == 'liked'){
        likeBtn.dataset.likes ++;
        icon.classList.remove('far');
        icon.classList.add('fas');
        span.innerText = likeBtn.dataset.likes;
      } else if (data == 'unliked'){
        likeBtn.dataset.likes --;
        icon.classList.remove('fas');
        icon.classList.add('far');
        span.innerText = likeBtn.dataset.likes;
      }
    })
    .catch((err)=>{
      likeErr();
    });
  } else {
    xhr.open('PUT', url, true);
    xhr.withCredentials = true;
    xhr.responseType = 'text';
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4 && xhr.status == 200){
        if(xhr.response() == 'liked'){
          likeBtn.dataset.likes ++;
          icon.classList.remove('far');
          icon.classList.add('fas');
          span.innerText = likeBtn.dataset.likes;
        } else if (xhr.response() == 'unliked'){
          likeBtn.dataset.likes --;
          icon.classList.remove('fas');
          icon.classList.add('far');
          span.innerText = likeBtn.dataset.likes;
        }
      } else if(xhr.status == 400) {
        likeErr();
      }
    };
    xhr.send();
  }
});
}
if(commentLikeBtns.length > 0){
  for(let btn of commentLikeBtns){
    btn.addEventListener('click', function(e){
      let url = btn.dataset.url,
          id = btn.dataset.id,
          init = {
            method: 'PUT',
            credentials: 'include'
          },
          likes = btn.dataset.likes,
          icon = document.getElementById(`${id}-like-icon`),
          span = document.getElementById(`${id}-like-span`);
      e.preventDefault();
      console.log(likes);
      if('fetch' in window){
        fetch(url, init)
        .then((response)=>{
          if(response.ok == true){
            return response.text();
          } else {
            console.log('Here.');
            throw 'There was a problem.';
          }
        })
        .then((data)=>{
          if(data == 'liked'){
            btn.dataset.likes ++;
            icon.classList.remove('far');
            icon.classList.add('fas');
            span.innerText = btn.dataset.likes;
          } else if (data == 'unliked'){
            btn.dataset.likes --;
            icon.classList.remove('fas');
            icon.classList.add('far');
            span.innerText = btn.dataset.likes;
          }
          console.log(btn.dataset.likes);
        })
        .catch(()=>{
          likeErr();
        });
      } else {
        xhr.open('PUT', url, true);
        xhr.withCredentials = true;
        xhr.responseType = 'text';
        xhr.onreadystatechange = function(){
          if(xhr.readyState == 4 && xhr.status == 200){
            if(xhr.response() == 'liked'){
              likes ++;
              icon.classList.remove('far');
              icon.classList.add('fas');
              span.innerText = likes;
            } else if (xhr.response() == 'unliked'){
              likes --;
              icon.classList.remove('fas');
              icon.classList.add('far');
              span.innerText = likes;
            }
          } else if(xhr.status == 400) {
            likeErr();
          }
        };
        xhr.send();
      }
    });
  }
}

if(go_back){
  go_back.addEventListener('click', function(){
    let show = document.getElementById(`file-${currentIndex - 1}`),
        hide = document.getElementById(`file-${currentIndex}`);
        
    show.classList.remove('inactive');
    hide.classList.add('inactive');
    currentIndex --;
    go_forward.classList.remove('inactive');
    if(currentIndex == 0){
      go_back.classList.add('inactive');
    }
  });
  go_forward.addEventListener('click', function(){
    let show = document.getElementById(`file-${currentIndex + 1}`),
        hide = document.getElementById(`file-${currentIndex}`);
        
    show.classList.remove('inactive');
    hide.classList.add('inactive');
    currentIndex ++;
    go_back.classList.remove('inactive');
    if(currentIndex == go_forward.dataset.max){
      go_forward.classList.add('inactive');
    }
  });
}

if(show_btn){
  show_btn.addEventListener('click', function(){
    let show = document.getElementById('nsfw-content'),
        hide = document.getElementById('no-nsfw');
    show.classList.remove('inactive');
    hide.classList.add('inactive');
  });
}

for(let btn of priors){ 
 btn.addEventListener('click', ()=>{
   let parent = btn.parentNode;
   priors_to_remove.push(btn.dataset.index);
   parent.removeChild(btn);
 }); 
}  
if(edit_form){
  let elements = edit_form.elements,
      spinner = document.getElementById('edit-spinner'),
      submit = document.getElementById('edit-submit'),
      formData = new FormData(),
      url = `/fetch/gallery/edit`,
      init = {method:'PUT', body:formData, credentials:'include'};
  submit.addEventListener('click', ()=>{
    formData.append('prior_images', priors_to_remove);
    for(let remove of filesToRemove){
      filesToUpload.splice(remove,1);
    }
    for(let file of filesToUpload){
      formData.append('images', file);
    }
    for(let element of elements){
      if(['nsfw-yes', 'nsfw-no'].includes(element.id)){
        let NSFW = true;
        if(element.id == 'nsfw-no' && element.checked == true){
          NSFW = false;
        }
        formData.append('NSFW', NSFW);
      } else if (['downscale', 'watermark'].includes(element.id)){
        formData.append(element.id, element.checked);
      } else {
        formData.append(element.id, element.value);
      }
    }
    fetch(url, init)
    .then((response)=>{
      $('#edit-modal').modal('hide');
      if(response.ok == false){
        throw new Error('There was a problem with your change.');
      } else {
        successMessage('Updated!');
      }
    })
    .catch((err)=>{
      $('#edit-modal').modal('hide');
      errorMessage(err);
    });
  });
}
if(delete_btn){
  let url = `/fetch/gallery/delete/${delete_btn.dataset.id}`,
      init = {method:'DELETE', credentials:'include'};
  delete_btn.addEventListener('click', ()=>{
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        window.location = `https://splatr.art/${delete_btn.dataset.artist}`;
      } else {
        throw new Error(response.json());
      }
    })
    .catch((err)=>{
      errorMessage(err);
    });
  });
}

function likeErr(){
  fetchText.innerText = 'We had a problem.';
  fetchAlert.classList.remove('inactive');
}