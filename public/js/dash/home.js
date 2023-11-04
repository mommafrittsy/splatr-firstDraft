const email = document.getElementById('email-verify'),
      id_submit = document.getElementById('id-submit');

if(email){
  email.addEventListener('click', ()=>{
  let url = `/fetch/reverify`,
      init = {method:'POST', credentials:'include'};
  fetch(url, init)
  .then((response)=>{
    if(response.ok == true) {
      successMessage('We\'ve sent a new verification to your email');
    } else {
      throw response.json();
    }
  })
  .catch((err)=>{
    errorMessage(err.message);
  });
});
}
if(id_submit){
  id_submit.addEventListener('click', ()=>{
    let url ="/payment/update/id_document",
        formData = new FormData(),
        init = {method:'PUT', body:formData, credentials:'include'},
        form = document.getElementById('id-form'),
        spinner = document.getElementById('id-spinner');
        
    spinnerSwitch(form, spinner);
    for(let index of filesToRemove){
      filesToUpload.splice(index,1);
    }
    for(let file of filesToUpload){
      formData.append('image', file);
    }
    fetch(url, init)
    .then((response)=>{
      if(response.ok == true){
        successMessage('Your documents have been sent for verification.');
        spinnerSwitch(form, spinner);
        $('id-modal').modal('hide');
      } else {
        throw response.json();
      }
    })
    .catch((err)=>{
      errorMessage(err.message);
      spinnerSwitch(form, spinner);
      $('id-modal').modal('hide');
    });
  });
}