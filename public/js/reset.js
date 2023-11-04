const btn = document.getElementById('reset-submit');

btn.addEventListener('click', ()=>{
  let url = '/reset-password',
      ID = document.getElementById('user-id').value,
      password  = document.getElementById('password').value,
      data = {ID, password},
      init  = {method:'PUT', body:JSON.stringify(data), headers: {
      'content-type' : 'application/json'
    }};
    
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      let reset = document.getElementById('reset'),
          success = document.getElementById('success');
      reset.classList.add('inactive');
      success.classList.remove('inactive');
    })
    .catch((err)=>{
      console.log(err);
    });
  }
});