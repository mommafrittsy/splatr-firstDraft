const start = document.getElementById('start-btn'),
      slideBtns = document.getElementsByClassName('slide-change'),
      countryName = document.getElementById('country-name'),
      countryFinal = document.getElementById('country'),
      firstName = document.getElementById('firstName'),
      lastName = document.getElementById('lastName'),
      nameSpace = document.getElementById('name'),
      streetInput = document.getElementById('street'),
      suiteInput = document.getElementById('suite'),
      streetName = document.getElementById('street-name'),
      suiteName = document.getElementById('suite-name'),
      cityName = document.getElementById('city-name'),
      toFinalSlide = document.getElementById('to-final-slide'),
      countryInput = document.getElementById('user-country');
var   currentSlide = 1,
      nationName,
      stateName,
      cityInput,
      postInput;

start.addEventListener('click', function(){
  slideChange(2);
  currentSlide = 2;
});
for(let btn of slideBtns){
  btn.addEventListener('click', function(){
    slideChange(btn.dataset.slide);
    currentSlide = btn.dataset.slide;
  });
}
toFinalSlide.addEventListener('click', function(){
  let vars = [firstName.value,lastName.value,streetInput.value, cityInput.value, postInput.value],
      okay = true,
      missing = document.getElementById('missing-info'),
      clear = document.getElementById('all-info');
  for(let variable of vars){
    console.log(`Variable: ${variable} is Okay:${okay}`);
    if(variable  == ''){
      okay = false;
    }
  }
  if(okay == false){
    clear.classList.add('inactive');
    missing.classList.remove('inactive');
  } else {
    clear.classList.remove('inactive');
    missing.classList.add('inactive');
    if(countryInput.value.toLowerCase() == 'au'){
      stateName = document.getElementById('australia-states').value;
    } else if(countryInput.value.toLowerCase() == 'ca'){
      stateName = document.getElementById('canada-states').value;
    } else if(countryInput.value.toLowerCase() == 'us'){
      stateName = document.getElementById('us-states').value;
    }
    if(['au','ca','us'].includes(countryInput.value.toLowerCase())){
      cityName.innerText = `${cityInput.value}, ${stateName}, ${countryInput.value} ${postInput.value}`;
    } else {
      cityName.innerText = `${cityInput.value}, ${countryInput.value} ${postInput.value} `;
    }
    nameSpace.innerText = `${firstName.value} ${lastName.value}`;
    streetName.innerText = streetInput.value;
    suiteName.innerText = suiteInput.value;
  }
});
countryInput.addEventListener('change', function(){
  let val = countryInput.value.toLowerCase(),
      flag = document.getElementById('flag-icon'),
      accept = document.getElementById('artist-accept'),
      artistCountries = ['us','uk','ch','se','es','sg','pt','no','nz','nl','lu','jp','it','ie','hk','de','fr','fi','dk','ca','be','at','au'],
      artistBtn = document.getElementById('artist-button'),
      noArtistBtn = document.getElementById('non-artist-button'),
      artistCountry = document.getElementById('artist-country'),
      nonArtistCountry = document.getElementById('non-artist-country');
  
  if(['au','us','ca'].includes(val.toLowerCase())){
    cityInput = document.getElementById('city-state');
    postInput = document.getElementById('post-state');
  } else {
    cityInput = document.getElementById('city');
    postInput = document.getElementById('post');
  }
  flag.setAttribute('class', `flag-icon flag-icon-${val}`);
  if(artistCountries.includes(val)){
    let au = document.getElementById('australia-states'),
        ca = document.getElementById('canada-states'),
        us = document.getElementById('us-states'),
        noState = document.getElementById('no-state-group'),
        state = document.getElementById('state-group');
        
    [au, ca, us].forEach(function(state){
      state.classList.add('inactive');
    });
    accept.classList.remove('inactive');
    artistBtn.classList.remove('inactive');
    noArtistBtn.classList.add('inactive');
    if(['au','ca','us'].includes(val)){
      noState.classList.add('inactive');
      state.classList.remove('inactive');
      if(val == 'au'){
        au.classList.remove('inactive');
      } else if(val == 'ca'){
        ca.classList.remove('inactive');
      } else if(val == 'us'){
        us.classList.remove('inactive');
      }
    }
  } else {
    accept.classList.add('inactive');
    artistBtn.classList.add('inactive');
    noArtistBtn.classList.remove('inactive');
  }
  artistCountry.value = val;
  nonArtistCountry.value = val;
});
function slideChange(to){
  let first = document.getElementById(`slide-${currentSlide}`),
      second  = document.getElementById(`slide-${to}`);
  
  first.classList.add('fade-out');
  window.setTimeout(function(){
    second.classList.remove('inactive');
    second.classList.add('fade-in');
    first.classList.add('inactive');
    first.classList.remove('fade-out');
    second.classList.remove('fade-in');
  }, 400);
  currentSlide = to;
}