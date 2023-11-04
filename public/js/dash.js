/* global fetch xhr $ */
const   home            = document.getElementById("home"),
        account         = document.getElementById("account"),
        wallet          = document.getElementById("wallet"),
        comm            = document.getElementById("commissions"),
        social          = document.getElementById("social"),
        notifications   = document.getElementById('notifications'),
        analytics       = document.getElementById('analytics'),
        zones           = [home, account, wallet, comm, social, notifications, analytics],
        acctBtn         = document.getElementById("accountButton"),
        noteBtn         = document.getElementById('notificationButton'),
        hmBtn           = document.getElementById("homeButton"),
        wltBtn          = document.getElementById("walletButton"),
        commBtn         = document.getElementById("commButton"),
        socBtn          = document.getElementById("socialButton"),
        analyticBtn     = document.getElementById('analyticButton'),
        btns            = [hmBtn,wltBtn,commBtn,socBtn,noteBtn, analyticBtn],
        title           = document.getElementById("sectionTitle"),
        username        = document.getElementById("changeUsername"),
        desc            = document.getElementById("artistDescription"),
        tags            = document.getElementById("tags-input"),
        tagDisplay      = document.getElementById("tag-display"),
        fetchAlert      = document.getElementById("fetch-alert"),
        fetchSpan       = document.getElementById("fetch-alert-span"),
        fetchSubmit     = document.getElementsByClassName('fetch-submit'),
        noFetchSubmit   = document.getElementsByClassName('noFetch-submit'),
        commDisplay     = document.getElementById('comm-display'),
        commInput       = document.getElementById('comm-input'),
        profileDisp     = document.getElementById('profile-display'),
        profileInput    = document.getElementById('profile-input'),
        profileLabel    = document.getElementById('profile-label'),
        profileSubmit   = document.getElementById('profile-submit'),
        profileSpinner  = document.getElementById('profile-spinner'),
        bannerDisp      = document.getElementById("banner-display"),
        bannerInput     = document.getElementById("banner-input"),
        bannerLabel     = document.getElementById("banner-label"),
        bannerSpinner   = document.getElementById('banner-spinner'),
        bannerSubmit    = document.getElementById("banner-submit"),
        personalButton  = document.getElementById("personal-button"),
        personalForm    = document.getElementById('personal-form'),
        personalSpinner = document.getElementById('personal-spinner'),
        newCommSubmit   = document.getElementById('new-commission-submit'),
        addressSubmit = document.getElementById('address-submit'),
        motto           = document.getElementById('motto'),
        mottoSubmit     = document.getElementById('motto-submit'),
        socialNetworks  = ['deviantart','instagram','tumblr','twitter','facebook','patreon', 'soundcloud','twitch','youtube', 'behance', 'discord', 'dribbble', 'etsy', 'pinterest', 'vimeo'],
        background  = document.getElementsByName('background'),
        container = document.getElementById('container'),
        deleteBtns = document.getElementsByClassName('delete'),
        verify  = document.getElementsByClassName('verify'),
        vBack = document.getElementsByClassName('verify-back'),
        vInput  = document.getElementById('verify-input'),
        emailVerify = document.getElementById('verify-email'),
        removeAll = document.getElementById('remove-all'),
        NSFWFilter = document.getElementById('nsfw-filter-btn');
  
var styles  = [],
    croppedImg  = '',
    cropper = '';

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

acctBtn.addEventListener('click', function(){inactivate(account, null, 'Account')});
wltBtn.addEventListener('click', function(){inactivate(wallet, wltBtn, 'Wallet')});
hmBtn.addEventListener('click', function(){inactivate(home, hmBtn, 'Home')});
commBtn.addEventListener('click', function(){inactivate(comm, commBtn, 'Commissions')});
socBtn.addEventListener('click', function(){inactivate(social, socBtn, 'Social')});
noteBtn.addEventListener('click', function(){inactivate(notifications,noteBtn,'Notifications')});
analyticBtn.addEventListener('click', function(){inactivate(analytics,analyticBtn,'Analytics')});
bannerInput.addEventListener('input',()=>{
  updateDisplay(bannerDisp, bannerInput, bannerLabel, bannerSubmit, 16/4, bannerSpinner);
});
bannerSubmit.addEventListener('click', (e)=>{
  e.preventDefault();
  imgUpload('banner', bannerDisp, bannerSpinner, bannerLabel);
  bannerSubmit.classList.add('inactive');
});
profileInput.addEventListener('input', ()=>{
  updateDisplay(profileDisp, profileInput, profileLabel, profileSubmit, 1/1, profileSpinner);
});
profileSubmit.addEventListener('click', (e)=>{
  e.preventDefault();
  imgUpload('profile', profileDisp, profileSpinner, profileLabel);
  profileSubmit.classList.add('inactive');
});
commInput.addEventListener('input', ()=>{
  newCommExample(commDisplay, commInput);
});
for(let radio of background){
  radio.addEventListener('change', ()=>{
    backgroundChange(radio);
  });
}
for(let btn of deleteBtns){
  btn.addEventListener('click', function(){
    let id = btn.dataset.id,
        url = `/fetch/notification/${id}`,
        init  = {method:'DELETE', credentials:'include'},
        note = document.getElementById(`notification-${id}`),
        parent = note.parentNode;
        
    if('fetch' in window){
      fetch(url, init)
      .then((response)=>{
        if(response.ok != true){
          throw `Code:${response.status} We had a problem. Check the console.`;
        } else {
          parent.removeChild(note);
        }
      })
      .catch((err)=>{
        fetchSpan.innerText = 'Well...crap!';
        console.log(err);
        fetchAlert.classList.add('alert-danger');
        fetchAlert.classList.remove("inactive");
      });
    } else {
      xhr.open('DELETE',url,true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
          parent.removeChild(btn);
        }
      };
      xhr.send();
    }
  });
}
for(var i = 0; i < fetchSubmit.length; i++){
  fetchSubmit[i].classList.toggle('inactive');
  noFetchSubmit[i].classList.toggle('inactive');
}
username.onchange = ()=>{
let checkURL  = `/fetch/username`,
    takenBadge = document.getElementById("taken-badge"),
    freeBadge = document.getElementById("free-badge"),
    loginChangeBtn  = document.getElementById("login-change-btn"),
    init = {
      method: 'PUT',
      body: JSON.stringify({username:username.value}),
      credentials: 'include',
      headers: {
        'content-type' : 'application/json'
      }
    };
    
if(username.value != ""){
  fetch(checkURL, init)
  .then((response)=>{
    return response.text();
  })
  .then((res)=>{
    if(res === "Taken"){
      takenBadge.innerText = "That's taken.";
      freeBadge.innerText = "";
      loginChangeBtn.setAttribute("disabled", "");
    } else if(res === "Free") {
      freeBadge.innerText = "You're good.";
      takenBadge.innerText = "";
      loginChangeBtn.removeAttribute("disabled", "");
    }
  })
  .catch((err)=>{
    console.log(err);
  });
} else {
  freeBadge.innerText = "";
  takenBadge.innerText = "";
  loginChangeBtn.setAttribute("disabled", "");
}
};
desc.onkeypress = (e)=>{
  let url = '/fetch/description',
      data = {desc:desc.value};
  
  if(e.key === 'Enter'){
    fetch(url, {
      method: "PUT",
      body: JSON.stringify(data),
      credentials: 'include',
      headers: {
        'content-type' : 'application/json'
      }
    })
    .then((response)=>{
      if(response.status == 200){
        return response;
      } else if(response.status == 401) {
        throw "You must not be logged in.";
      } else {
        throw "We couldn't find you.";
      }
    })
    .then((data)=>{
      fetchSpan.innerText = "That's a cool looking description you've got there!";
      fetchAlert.classList.add('alert-success');
      fetchAlert.classList.remove("inactive");
    })
    .catch((err)=>{
      console.log(err);
    });
  }
};
tags.onkeypress = (e)=>{
  let tag   = document.createElement("span"),
      url = `/fetch/style`,
      putValue = tags.value;
        
  if(e.key == ','){
    if(putValue.includes(",")) {
      let noComma = putValue.slice(1);
      createTag(noComma);
    } else {
      createTag(putValue);
    }
  }
  function createTag(target){
    styles.push(target);
    let index = styles.indexOf(target);
    let data  = {style: target};
    tag.setAttribute("class", "badge badge-primary mr-3");
    tag.innerHTML = `${target}<span class="ml-3" data-index="${index}" onclick="removeTag(this)">X</span>`;
    tagDisplay.appendChild(tag);
    console.log(styles);
    fetch(url, {
      method: "PUT",
      body: JSON.stringify(data),
      credentials: 'include',
      headers: {
        'content-type' : 'application/json'
      }
    })
    .then((response)=>{
      tags.value = "";
    })
    .catch((err)=>{
      console.log(err);
    });
  }
};
personalButton.onclick = (e)=>{
  let given = document.getElementById('firstName').value,
      surname  = document.getElementById('lastName').value,
      preferred  = document.getElementById('prefName').value,
      birthday = new Date(document.getElementById('birthday').value),
      dob = {day:birthday.getDate(), month:(birthday.getMonth()+1), year:birthday.getFullYear()},
      data  = {given, surname, preferred, dob},
      url   = '/fetch/name';
    
    e.preventDefault();  
    personalForm.classList.add('inactive');
    personalSpinner.classList.remove('inactive');
    
    fetch(url, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify(data),
      headers: {
        'content-type' : 'application/json'
      }
    })
    .then((response)=>{
      if(response.ok == true){
        response.text();
      } else {
        throw 'We couldn\'t update your name!';
      } 
    })
    .then((data)=>{
      personalSpinner.classList.add('inactive');
      personalForm.classList.remove('inactive');
      fetchSpan.innerText = 'Success';
      fetchAlert.classList.remove('alert-danger');
      fetchAlert.classList.add('alert-success');
      fetchAlert.classList.remove('inactive');
    })
    .catch((err)=>{
      personalSpinner.classList.add('inactive');
      personalForm.classList.remove('inactive');
      fetchSpan.innerText = err;
      fetchAlert.classList.add('alert-danger');
      fetchAlert.classList.remove('alert-success');
      fetchAlert.classList.remove('inactive');
    });
  };
addressSubmit.addEventListener('click',(e)=>{
  let line1  = document.getElementById('line1').value,
      line2   = document.getElementById('line2').value,
      city    = document.getElementById('city').value,
      country = document.getElementById('country').value,
      post    = document.getElementById('post').value,
      url     = '/fetch/address',
      data    = {line1, line2, city, country, post};
      
  e.preventDefault();
  fetch(url,{
    method: 'PUT',
    body: JSON.stringify(data),
    credentials: 'include',
    headers: {
      'content-type' : 'application/json'
    }
  })
  .then((response)=>{
    if(response.ok == false){
      throw "There was a problem!";
    } else {
      fetchAlert.classList.add('bg-success');
      fetchSpan.innerText = 'We\'ve got it';
      fetchAlert.classList.remove('inactive');
    }
  })
  .catch((err)=>{
    fetchAlert.classList.add('bg-danger');
    fetchSpan.innerText = err;
    fetchAlert.classList.remove('inactive');
    console.log(err);
  });
});
socialNetworks.forEach((network)=>{
  let name  = document.getElementById(network);
  name.addEventListener('keypress',(e)=>{
    if(e.key == 'Enter' || e.key == 'Tab'){
      if(e.key == 'Enter'){
        e.preventDefault();
      }
      updateSocial(network, name);
    }
  });
});
newCommSubmit.addEventListener('click', (e)=>{
  e.preventDefault();
  newComm();
});
motto.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){
    e.preventDefault();
    newMotto();
  }
});
mottoSubmit.addEventListener('click', (e)=>{
    e.preventDefault();
    newMotto();
  });
if(verify.length > 0){
  for(let btn of verify){
  let row = document.getElementById('verify-buttons');
  btn.addEventListener('click', function(){
    row.classList.add('inactive');
    document.getElementById(btn.dataset.id).classList.remove('inactive');
  });
}
if(vBack.length > 0){
  for(let btn of vBack){
    let hide = document.getElementById(btn.dataset.area),
        show = document.getElementById('verify-buttons');
    btn.addEventListener('click', function(){
      hide.classList.add('inactive');
      show.classList.remove('inactive');
    });
  }
}
}
if(vInput){
  vInput.addEventListener('input', function(){
  let display = document.getElementById('id-preview'),
      submit = document.getElementById('id-verify-submit');
  
  updateDisplay(display, vInput, null, submit);

});
}
if(emailVerify){
  emailVerify.addEventListener('click', function(){
  let init = {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type' : 'application/json'
          }
        },
        url = '/fetch/reverify';
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      document.getElementById(verify[0].dataset.id).classList.remove('inactive');
    });
  } else {
    xhr.open('POST',url,true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
          document.getElementById(verify[0].dataset.id).classList.remove('inactive');
        }
      };
      xhr.send();
  }
});
}
if(removeAll){
  let url = '/dash/notifications/delete_all',
      init = {
        method: 'DELETE',
        credentials: 'include',
      };
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        let noteZone = document.getElementById('notification-zone');
        noteZone.innerHTML = '';
      }
    })
    .catch((err)=>{
      console.log(err);
    });
  }
}
if(NSFWFilter){
  NSFWFilter.addEventListener('click', function(){
  let url = '/fetch/nsfw',
      init = {method: 'PUT', credentials: 'include'};
  
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        return response.text();
      } else {
        throw 'We had an error.';
      }
    })
    .then((data)=>{
      nsfwFilterChanges(data);
    })
    .catch((err)=>{
      fetchAlert.innerText = err;
      fetchAlert.classList.remove('bg-success');
      fetchAlert.classList.add('bg-danger');
      fetchAlert.classList.remove('inactive');
    });
  }
});
}
function removeTag(target){
  let index = target.dataset.index,
      parentSpan  = target.parentNode,
      data  = {tag:target.parentNode.innerText},
      url = `/fetch/style`;
      
  tagDisplay.removeChild(parentSpan);
  styles.splice(index, 1);
  fetch(url, {
    method: "DELETE",
    body: JSON.stringify(data),
    credentials: 'include',
    headers: {
      'content-type' : 'application/json'
    }
  })
  .then((response)=>{
    return response.json();
  })
  .then((data)=>{
    console.log(data.style);
  })
  .catch((err)=>{
    console.log(err);
  });
}
function imgUpload(name, display, spinner, label){
    let url = `/fetch/${name}`,
        formData = new FormData(),
        img = document.createElement('img');
    img.setAttribute("class", "img-fluid");
    img.src = window.URL.createObjectURL(croppedImg);
    formData.append('image', croppedImg);
    spinnerInactivate(display, spinner);
    
    if('fetch' in window){
      fetch(url, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      })
      .then((response)=>{
        if(response.status != 200){
          throw 'We\'ve had a problem';
        }  else {
          cropper.destroy();
          display.removeChild(display.firstChild);
          display.appendChild(img);
          label.classList.remove('inactive');
          spinnerInactivate(display, spinner);
        }
      })
      .catch((err)=>{
        console.log(err);
      });
    } else {
      xhr.open('PUT',url,true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
          let img = document.createElement('img');
          img.classList.add('img-fluid');
          img.src = window.URL.createObjectURL(croppedImg);
          display.appendChild(img);
          spinnerInactivate(display, spinner);
        }
      };
      xhr.send(formData);
    }
  }
function updateSocial(network, input){
  let url = `/fetch/social/${network}`,
      val = input.value,
      data = {network:val};
  
  fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    credentials: 'include',
    headers: {
      'content-type' : 'application/json'
    }
  })
  .then((response)=>{
    if(response.ok != true){
      throw "We couldn\'t update that.";
    }
    fetchAlert.classList.add('bg-success');
    fetchSpan.innerText = 'Go forth and be social';
    fetchAlert.classList.remove('inactive');
  })
  .catch((err)=>{
    fetchAlert.classList.add('bg-danger');
    fetchSpan.innerText = err;
    fetchAlert.classList.remove('inactive');
    console.log(err);
  });
}
function newCommExample(display, input){
  while (display.firstChild){
    display.removeChild(display.firstChild);
  }
  let curFiles = input.files;
  if(curFiles.length === 0) {
    let p = document.createElement('p');
    p.innerText = "Nothing was selected for upload.";
    display.appendChild(p);
    newCommSubmit.setAttribute('disabled');
  } else {
    for(var i = 0; i < curFiles.length; i++){
      if(curFiles[i].size > 5000000){
        let p = document.createElement('p');
        p.innerText = "Sorry, that's too large. Please keep your file under 5 megabytes.";
        display.appendChild(p);
        newCommSubmit.setAttribute('disabled', true);
      } else {
        let img = document.createElement('img');
        img.setAttribute("class", "img-fluid");
        img.src = window.URL.createObjectURL(curFiles[i]);
        display.appendChild(img);
        newCommSubmit.removeAttribute('disabled');
      }
    }
  }
}
function editCommExample(target){
  let display = document.getElementById(target.dataset.display),
      input = document.getElementById(target.dataset.input);
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
      if(curFiles[i].size > 5000000){
        let p = document.createElement('p');
        p.innerText = "Sorry, that's too large. Please keep your file under 5 megabytes.";
        display.appendChild(p);
      } else {
        let img = document.createElement('img');
        img.setAttribute("class", "img-fluid");
        img.src = window.URL.createObjectURL(curFiles[i]);
        display.appendChild(img);
        
      }
    }
  }
}
function newComm(){
  let image = commInput.files[0],
      name  = document.getElementById('comm-name').value,
      price = document.getElementById('comm-price'),
      priceVal = Number(price.value)*100,
      available = document.getElementById('comm-available'),
      availableVal  = Number(available.value),
      description = document.getElementById('comm-description').value,
      type  = document.getElementById('comm-type').value,
      NSFW  = '',
      tags  = document.getElementById('comm-tags').value,
      form  = document.getElementById('new-comm-form'),
      spinner = document.getElementById('new-comm-spinner'),
      url = '/fetch/commission/new';
  if(document.getElementById('NSFW') == null || document.getElementById('nsfw-no').checked){
    NSFW = false;
  } else if(document.getElementById('nsfw-yes').checked){
    NSFW = true;
  }
  let formData  = new FormData();
  formData.append('image', image);
  formData.append('name', name);
  formData.append('price', priceVal);
  formData.append('available', availableVal);
  formData.append('description',description);
  formData.append('type', type);
  formData.append('NSFW', NSFW);
  formData.append('tags', tags);
  
  let init  = {method:'PUT', body:formData, credentials:'include'};
  form.classList.add('inactive');
  spinner.classList.remove('inactive');
  fetch(url, init)
  .then((response)=>{
    if(response.ok != true){
      throw 'PROBLEM!!!!';
    }
    fetchAlert.classList.add('bg-success');
    fetchSpan.innerText = 'Fancy!';
    fetchAlert.classList.remove('inactive');
    form.classList.remove('inactive');
    spinner.classList.add('inactive');
    $('#new-comm-modal').modal('hide');
    return response.json();
  })
  .then((data)=>{
    let row = document.getElementById('commission-row'),
        col = document.createElement('div'),
        card = document.createElement('div'),
        img = document.createElement('div'),
        h1 = document.createElement('h1'),
        name = document.createElement('span'),
        price = document.createElement('span'),
        NSFW_badge = document.createElement('span'),
        avail = document.createElement('h2'),
        desc = document.createElement('p'),
        tagsArea = document.createElement('p'),
        delete_btn = document.createElement('button'),
        col2 = [avail, desc, tagsArea];
    
    col.setAttribute('class', 'col-10 col-xl-6');
    col.setAttribute('id', data._id);
    card.setAttribute('class', 'card comm-card');
    img.setAttribute('class', 'background comm-img');
    img.setAttribute('style', `background-image:url(${data.example.url})`);
    for(let item of col2){
      item.classList.add('column-2');
    }
    name.innerText = data.name;
    price.innerText = `$${data.price/100}`;
    price.classList.add('mx-3');
    h1.setAttribute('class', 'h5 comm-name mb-0 column-2');
    if(data.NSFW == true){
      NSFW_badge.setAttribute('class', 'badge badge-pill badge-primary');
      NSFW_badge.innerText = 'NSFW';
    }
    if(data.available != null){
      avail.setAttribute('class','h5 comm-available column-2');
      avail.innerText = `Number Available: ${data.available}`;
    }
    desc.setAttribute('class', 'littleText comm-description column-2');
    desc.innerText = data.description;
    for(let tag of data.tags){
      let tagSpan = document.createElement('span');
      tagSpan.setAttribute('class', 'badge badge-primary mx-1');
      tagSpan.innerText = tag;
      tagsArea.appendChild(tagSpan);
    }
    delete_btn.setAttribute('class', 'btn btn-danger comm-delete');
    delete_btn.setAttribute('data-id', data._id);
    delete_btn.setAttribute('type', 'button');
    delete_btn.setAttribute('onclick', 'deleteComm(this)');
    delete_btn.innerText = 'Delete';
    h1.appendChild(name);
    h1.appendChild(price);
    h1.appendChild(NSFW_badge);
    card.appendChild(img);
    card.appendChild(h1);
    card.appendChild(avail);
    card.appendChild(desc);
    card.appendChild(tagsArea);
    card.appendChild(delete_btn);
    col.appendChild(card);
    row.appendChild(col);
  })
  .catch((err)=>{
    fetchAlert.classList.add('bg-danger');
    fetchSpan.innerText = err;
    fetchAlert.classList.remove('inactive');
    form.classList.remove('inactive');
    spinner.classList.add('inactive');
    $('#new-comm-modal').modal('hide');
    console.log(err);
  });
}
function editComm(target){
  let image = document.getElementById(`${target.dataset.id}-img`),
      name  = document.getElementById(`${target.dataset.id}-name`),
      price = document.getElementById(`${target.dataset.id}-price`),
      available = document.getElementById(`${target.dataset.id}-available`),
      description = document.getElementById(`${target.dataset.id}-description`),
      tag = document.getElementById(`${target.dataset.id}-tags`),
      editImage = document.getElementById(`${target.dataset.id}-edit-input`).files[0],
      editName  = document.getElementById(`${target.dataset.id}-edit-name`).value,
      editPrice = document.getElementById(`${target.dataset.id}-edit-price`).value,
      priceVal = Number(editPrice)*100,
      editAvailable = document.getElementById(`${target.dataset.id}-edit-available`),
      availableVal  = Number(editAvailable.value),
      editDescription = document.getElementById(`${target.dataset.id}-edit-description`).value,
      editType  = document.getElementById(`${target.dataset.id}-edit-type`).value,
      editTags  = document.getElementById(`${target.dataset.id}-edit-tags`).value,
      NSFW = '',
      form  = document.getElementById(`${target.dataset.id}-edit-form`),
      spinner = document.getElementById(`${target.dataset.id}-edit-spinner`),
      url = `/fetch/commission/edit/${target.dataset.id}`;
 
  if(document.getElementById(`${target.dataset.id}-edit-nsfw-no`) == null || document.getElementById(`${target.dataset.id}-edit-nsfw-no`).checked){
    NSFW = false;
  } else if(document.getElementById(`${target.dataset.id}-edit-nsfw-yes`).checked){
    NSFW = true;
  }
  let formData  = new FormData();
  if('fetch' in window){
    if(editImage){
      formData.append('image', editImage);
    }
    formData.append('name', editName);
    formData.append('price', priceVal);
    formData.append('description', editDescription);
    formData.append('type', editType);
    formData.append('NSFW', NSFW);
    formData.append('tags', editTags);
    formData.append('available', availableVal);
    
    let init  = {method:'PUT', body:formData, credentials:'include'};
    form.classList.add('inactive');
    spinner.classList.remove('inactive');
    fetch(url, init)
    .then((response)=>{
      if(response.ok != true){
        throw 'PROBLEM!!!!';
      }
      fetchAlert.classList.add('bg-success');
      fetchSpan.innerText = 'Updated!';
      fetchAlert.classList.remove('inactive');
      form.classList.remove('inactive');
      spinner.classList.add('inactive');
      if(editImage){
        image.setAttribute('style', `background-image:url('${window.URL.createObjectURL(editImage)}')`);
      }
      if(NSFW == true){
        name.innerHTML = `${editName}<span class="badge badge-pill badge-primary ml-5" id="<%=comm._id%>-NSFW">NSFW</span>`;
      } else {
        name.innerText = editName;
      }
      price.innerText = editPrice;
      if(available && editAvailable.value != 0){
        available.innerText = editAvailable.value;
      } 
      description.innerText = editDescription;
      tag.innerHTML = '';
      let tagsArray = editTags.split(' #');
      tagsArray.forEach((badge)=>{
        let span = document.createElement('span');
        span.setAttribute('class', 'badge badge-primary mr-2');
        span.innerText = badge;
        tag.appendChild(span);
      });
      $(`#${target.dataset.id}-modal`).modal('hide');
    })
    .catch((err)=>{
      fetchAlert.classList.add('bg-danger');
      fetchSpan.innerText = err;
      fetchAlert.classList.remove('inactive');
      form.classList.remove('inactive');
      spinner.classList.add('inactive');
      console.log(err);
    });
  }
}
function deleteComm(target){
  let card = document.getElementById(target.dataset.id),
      id = target.dataset.id,
      url = `/fetch/commission/delete/${id}`;
      
  fetch(url, {method:'DELETE', credentials: 'include'})
  .then((response)=>{
    if(response.ok == true){
      card.remove();
      fetchAlert.classList.add('bg-success');
      fetchSpan.innerText = 'Gone!';
      fetchAlert.classList.remove('inactive');
    } else {
      throw 'There was an error.';
    }
  })
  .catch((err)=>{
    fetchAlert.classList.add('bg-danger');
    fetchSpan.innerText = err;
    fetchAlert.classList.remove('inactive');
  });    
}
function toggleClass (target, className){
    target.classList.toggle(className);
}
function inactivate (target, targetBtn, titleText) {
    zones.forEach(function(zone){
      zone.classList.add("inactive");
    });
      btns.forEach(function(btn){
        btn.classList.remove('btnActive');
      });
    if(targetBtn != null){
      targetBtn.classList.add('btnActive');
    }
    target.classList.remove("inactive");
    title.innerText = titleText;
}
function newMotto(){
  let url = '/fetch/motto',
      data = {motto:motto.value};
    
  fetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
    credentials: 'include',
    headers: {
      'content-type' : 'application/json'
    }
  })
  .then((response)=>{
    if(response.status == 200){
      fetchSpan.innerText = 'Nice job!';
      fetchAlert.classList.add('alert-success');
      fetchAlert.classList.remove("inactive");
    } else if(response.status == 401) {
      throw "You must not be logged in.";
    } else {
      throw "We couldn't find you.";
    }
  })
  .catch((err)=>{
    console.log(err);
    fetchSpan.innerText = 'Well...crap!';
    fetchAlert.classList.add('alert-danger');
    fetchAlert.classList.remove("inactive");
  });
}
function backgroundChange(target){
  let val = target.value,
      url = '/fetch/background',
      init  = {method: 'PUT', credentials:'include', body:JSON.stringify({val}), headers: {'content-type' : 'application/json'}};
  if(val == 1){
        container.setAttribute('style', 'background-image:linear-gradient(to right, rgba(35, 37, 38, .5), rgba(65, 67, 69, .5)), url("https://ayizan.blob.core.windows.net/site-images/Shibuya.jpeg");');
      } else if(val == 2){
        container.setAttribute('style', 'background-image:linear-gradient(to right, rgba(35, 37, 38, .5), rgba(65, 67, 69, .5)), url("https://ayizan.blob.core.windows.net/site-images/Seattle.jpeg");');
      } else if(val == 3){
        container.setAttribute('style', 'background-image:linear-gradient(to right, rgba(35, 37, 38, .5), rgba(65, 67, 69, .5)), url("https://ayizan.blob.core.windows.net/site-images/Paint Pallette.jpeg");');
      } else if(val == 4){
        container.setAttribute('style', 'background-image:linear-gradient(to right, rgba(35, 37, 38, .5), rgba(65, 67, 69, .5)), url("https://ayizan.blob.core.windows.net/site-images/Melbourne.jpeg");');
      } else if(val == 5){
        container.setAttribute('style', 'background-image:linear-gradient(to right, rgba(35, 37, 38, .5), rgba(65, 67, 69, .5)), url("https://ayizan.blob.core.windows.net/site-images/Designer at Desk.jpeg");');
      } else if(val == 6){
        container.setAttribute('style', 'background-image:linear-gradient(to right, rgba(35, 37, 38, .5), rgba(65, 67, 69, .5)), url("https://ayizan.blob.core.windows.net/site-images/BFs at Sunset.jpeg");');
      } else if(val == 7){
        container.setAttribute('style', 'background-image:linear-gradient(to right, rgba(35, 37, 38, .5), rgba(65, 67, 69, .5)), url("https://ayizan.blob.core.windows.net/site-images/Backpacker w- camera.jpeg");');
      }
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      if(response.status == 401) {
        throw "You must not be logged in.";
      } else if(response.status != 200) {
        throw "We couldn't find you.";
      }
    })
    .catch((err)=>{
      console.log(err);
      fetchSpan.innerText = 'Well...crap!';
      fetchAlert.classList.add('alert-danger');
      fetchAlert.classList.remove("inactive");
    })
  }
}
function nsfwFilterChanges(data){
  let text = document.getElementById('nsfw-text'),
      icon = document.getElementById('nsfw-icon');
  if(data == 'false'){
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
    text.innerText = 'Hide NSFW Content';
    fetchSpan.innerText = 'Got it. We\'ll show you this content automatically from now on.';
    fetchAlert.classList.add('bg-success');
    fetchAlert.classList.remove('bg-danger');
    fetchAlert.classList.remove('inactive');
  } else if(data == 'true'){
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
    text.innerText = 'Show NSFW Content';
    fetchSpan.innerText = 'Got it. We\'ll not show you this content automatically from now on.';
    fetchAlert.classList.add('bg-success');
    fetchAlert.classList.remove('bg-danger');
    fetchAlert.classList.remove('inactive');
  }
}