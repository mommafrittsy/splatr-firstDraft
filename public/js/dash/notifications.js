const delete_note_btns = document.getElementsByClassName('delete-note-btn'),
      remove_all = document.getElementById('notification-remove');

for(let btn of delete_note_btns){
  btn.addEventListener('click', ()=>{
    let url = `/fetch/notifications/delete/${btn.dataset.id}`,
        init = {method: 'DELETE', credentials:'include'};
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        return response.json();
      } else {
        throw response.text();
      }
    })
    .then((data)=>{
      let parentNote = btn.parentNode,
          zone = parentNote.parentNode,
          noteAmount = document.getElementById('new-notes');
      
      noteAmount.innerText = data.notes;
      parentNote.classList.add('fade-out');
      setTimeout(()=>{
        zone.removeChild(parentNote);
      }, 400);
      successMessage('Removed.');
      
    })
    .catch((err)=>{
      errorMessage(err.message);
    })
  });  
}
remove_all.addEventListener('click', ()=>{
  let url = '/dash/notifications/delete_all',
      init = {method:'DELETE', credentials:'include'};
  
  fetch(url, init)
  .then((response)=>{
    if(response.ok == true){
      let holder = document.getElementById('notification-holder');
      holder.innerHTML = '';
    } else {
      throw response.text();
    }
  })
  .catch((err)=>{
    errorMessage(err);
  });
});