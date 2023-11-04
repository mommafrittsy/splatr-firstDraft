const login = document.getElementById('login'),
      forgot  = document.getElementById('forgot'),
      success = document.getElementById('success'),
      forgotButton = document.getElementsByClassName('forgot'),
      submit  = document.getElementById('reset-submit'),
      finish = document.getElementById('reset-finish');
      
for(let btn of forgotButton){
  btn.addEventListener('click', ()=>{
    login.classList.toggle('inactive');
    forgot.classList.toggle('inactive');
  });
}

submit.addEventListener('click', ()=>{
  let url = '/password-reset',
      data = {username: document.getElementById('reset-username').value},
      init = {method:'POST', body:JSON.stringify(data),headers: {
      'content-type' : 'application/json'
    }};
  if('fetch' in window){
    fetch(url, init)
    .then((response)=>{
      forgot.classList.add('inactive');
      success.classList.remove('inactive');
    })
    .catch((err)=>{
      console.log(err);
    });
  } else {
    xhr.open('POST', url, true);
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4 && xhr.status == 200){
        forgot.classList.add('inactive');
        success.classList.remove('inactive');
      }
    };
    xhr.send();
  }
});

finish.addEventListener('click', ()=>{
  login.classList.remove('inactive');
  success.classList.add('inactive');
});