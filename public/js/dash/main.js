const section_title = document.getElementById('section-title'),
      dash_links = document.getElementsByClassName('dash-link'),
      notification_sound = new Audio('https://ayizan.blob.core.windows.net/site-images/intuition.mp3'),
      dash_style = document.getElementsByClassName('night-shift'),
      nsfw_show = document.getElementById('nsfw-show'),
      becomeArtist = document.getElementById('become-artist'),
      today = document.getElementById('today-date');

today.innerText = datify(Date.now(), 'US');     
setInterval(getNewNotes, 20000);
for (let btn of dash_links){
  btn.addEventListener('click',function(){
    let newSection = document.getElementById(btn.dataset.section);
    for(let other of dash_links){
      let section = document.getElementById(other.dataset.section);
      if(section != undefined){
        section.classList.add('inactive');
      }
      other.classList.remove('active');
    }
    if(btn.dataset.section == 'notifications'){
        let url = 'fetch/notifications/viewAll',
            init = {method:'PUT', credentials:'include'};
        fetch(url, init)
        .catch((err)=>{
          console.log(err);
        });
      }
    section_title.innerText = `${btn.dataset.section.substring(0,1).toUpperCase()}${btn.dataset.section.substring(1)}`;
    btn.classList.add('active');
    newSection.classList.remove('inactive');
  });
}
for (let btn of dash_style){
  btn.addEventListener('click', ()=>{
    window.location = '/dash/preference';
  });
}
if(becomeArtist){
  becomeArtist.addEventListener('click', ()=>{
    window.location.href='/dash/user/become_artist';
  });
}
if(nsfw_show){
  nsfw_show.addEventListener('click', ()=>{
    let url = '/fetch/nsfw',
        init = {method: 'PUT', credentials: 'include'};
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        return response.text();
      } else {
        throw {message:'We had an error.'};
      }
    })
    .then((data)=>{
      nsfwFilterChanges(data);
    })
    .catch((err)=>{
     errorMessage(err.message);
    });
  });
}

function getNewNotes(){
  let url = `/fetch/notifications/get`,
      init = {method: 'GET', credentials: 'include'};
  fetch(url, init)
  .then((response)=>{
    return response.json();
  })
  .then((data)=>{
    popNote(data);
  })
  .catch((err)=>{
    errorMessage(err.message);
  });
}
function popNote(data){
  let zone = document.getElementById('new-notification-zone'),
      newNote = document.createElement('a'),
      icon = document.createElement('i'),
      text = document.createElement('p');
  for(let note of data.notes){
    newNote.classList.add('notification');
    newNote.setAttribute('href', note.url);
    text.innerText = note.text;
    icon.setAttribute('class', 'far fa-2x fa-fw');
    if(['accept','previewAccept','like','commentLike'].includes(note.type)){
      icon.classList.add('fa-thumbs-up');
      newNote.classList.add('like');
    } else if(['paid','deposit'].includes(note.type)){
      icon.classList.add('fa-credit-card-front');
      newNote.classList.add('money');
    } else if(['transComment','comment'].includes(note.type)){
      icon.classList.add('fa-comments');
      newNote.classList.add('comment');
    } else if(['new','request','references','preview','final'].includes(note.type)){
      icon.classList.add('fa-images');
      newNote.classList.add('art');
    } else if(note.type == 'review'){
      icon.classList.add('fa-pencil');
      newNote.classList.add('comment');
    } else if(['follow', 'open'].includes(note.type)){
      icon.classList.add('fa-user-friends');
      newNote.classList.add('art');
    } else {
      icon.classList.add('fa-times-circle');
      newNote.classList.add('like');
    }
    newNote.appendChild(icon);
    newNote.appendChild(text);
    zone.appendChild(newNote);
    notification_sound.play();
    setTimeout(function(){
      newNote.classList.add('fade-out');
      setTimeout(function(){
        zone.removeChild(newNote);
      }, 400);
    }, 5000);
  }
}
function nsfwFilterChanges(data){
  let icon = document.getElementById('nsfw-icon'),
      parent = icon.parentNode;
  if(data == 'false'){
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
    parent.setAttribute('data-original-title','Hide NSFW Content');
    successMessage('We\'ll show you this content automatically from now on.');
  } else if(data == 'true'){
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
    parent.setAttribute('data-original-title','Show NSFW Content');
    successMessage('We\'ll not show you this content automatically from now on.');
  }
}
function spinnerSwitch(item1, item2){
  item1.classList.toggle('inactive');
  item2.classList.toggle('inactive');
}
function datify(date, locale){
  let months =  ['January', 'February', 'March','April','May','June','July','August','September','October','November','December'],
      computed_date = new Date(date),
      year = computed_date.getFullYear(),
      month = months[computed_date.getMonth()],
      day = computed_date.getDate(),
      full_date;
      
  if(locale == 'US'){
    full_date = `${month} ${day}, ${year}`;
  } else {
    full_date = `${day} ${month} ${year}`;
  }
  return full_date;
}