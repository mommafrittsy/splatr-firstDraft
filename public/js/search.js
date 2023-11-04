/* global algoliasearch */
const client = algoliasearch('LKDIWAGI3B','ec8e37b8cd9ce00d0460518bc0796607'),
      userIndex = client.initIndex('users'),
      commissionIndex = client.initIndex('commissions'),
      artIndex = client.initIndex('galleries'),
      refQuery = document.getElementById('query').value,
      NSFW = document.getElementById('NSFW').value,
      input = document.getElementById('search'),
      box = document.getElementById('search-box'),
      results = document.getElementById('result-box'),
      filterBtns = document.getElementsByClassName('filter-button'),
      typeFilters = [],
      ratingFilters = [],
      priceFilters = [];
      
input.addEventListener('focus', ()=>{
  box.classList.add('focusing');
});
input.addEventListener('blur', ()=>{
  box.classList.remove('focusing');
});
input.addEventListener('input', ()=>{
  let query = {
    query:input.value
  },
      filtersArr = [];
  if(typeFilters.length > 0){
    filtersArr.push(typeFilters.join(' OR '));
  }
  if(ratingFilters.length > 0){
    filtersArr.push(ratingFilters.join(' OR '));
  }
  if(priceFilters.length > 0){
    filtersArr.push(priceFilters.join(' OR '));
  }
  query.filters = filtersArr.join(' AND ');
  results.innerHTML = '';
  userIndex.search(query, (err, content)=>{
    if(err){
      errorMessage(err.message);
    } else {
      for(let hit of content.hits){
        result(hit, 'user');
      }
    }
  });
  commissionIndex.search(query, (err, content)=>{
    if(err){
      errorMessage(err.message);
    } else {
      for(let hit of content.hits){
        if(hit.NSFW == 'yes' || hit.NSFW == true){
          if(NSFW == 'true'){
            result(hit, 'commission');
          }
        } else {
          result(hit, 'commission');
        }
      }
    }
  });
  artIndex.search(query, (err, content)=>{
    if(err){
      console.log(err);
    } else {
      for(let hit of content.hits){
        if(hit.NSFW == 'yes' || hit.NSFW == true){
          if(searchBox.dataset.nsfw == 'true'){
            result(hit, 'art');
          }
        } else {
          result(hit, 'art');
        }
      }
    }
  });
});
for(let btn of filterBtns){
  btn.addEventListener('click', ()=>{
    btn.classList.toggle('active');
    if(btn.dataset.type == 'rating'){
      addFilter(ratingFilters, btn.dataset.filter);
    } else if(btn.dataset.type == 'price'){
      addFilter(priceFilters, btn.dataset.filter);
    } else if(btn.dataset.type == 'type'){
      addFilter(typeFilters, btn.dataset.filter);
    }
  });
}
function addFilter(array, filter){
  if(array.includes(filter)){
    let index = array.indexOf(filter);
    array.splice(index, 1);
  } else {
    array.push(filter);
  }
}
function result(hit, index){
  let row = document.getElementById('result-box'),
      box = document.createElement('a'),
      img = document.createElement('div'),
      textBox = document.createElement('div'),
      title = document.createElement('h1'),
      i = document.createElement('i'),
      artist = document.createElement('h3'),
      price = document.createElement('h2'),
      type = document.createElement('h4'),
      url;
  if((index == 'user' && hit.username == undefined) ||(index == 'user' && !hit.profile) ){
    
  } else {
    box.classList.add('result');
    box.classList.add('shadowed');
    img.classList.add('result-img');
    textBox.classList.add('result-text');
    if(index == 'user'){
      if(hit.username != undefined && hit.profile){
        if(hit.profile){
          url = hit.profile;
          img.setAttribute('style', `background-image:url("${url}")`);
        } else {
          img.setAttribute('style', `background-image:url('https://ayizan.blob.core.windows.net/site-images/Splatr Icon.png')`);
        }
        title.innerText = hit.username;
        title.classList.add('username');
        textBox.appendChild(title);
        box.setAttribute('href', `/${hit.username}`);
      }
    } else if(index == 'commission'){
      url = hit.example;
      img.setAttribute('style', `background-image:url("${url}")`);
      box.setAttribute('href', `/${hit.artist}#commissions`);
      title.innerText = hit.name;
      type.innerText = `${hit.type} - $${hit.price}`;
      type.classList.add('comm-type');
      // price.innerText = `$${hit.price}`;
      // price.classList.add('comm-price');
      artist.innerText = `by ${hit.artist}`;
      artist.classList.add('artist-name');
      textBox.appendChild(type);
      // textBox.appendChild(price);
      textBox.appendChild(title);
      textBox.appendChild(artist);
    } else if(index == 'art'){
      url = hit.image;
      if(hit.title){
        title.innerText = hit.title;
      }
      artist.innerText = `by ${hit.artist}`;
      artist.classList.add('artist-name');
      img.setAttribute('style', `background-image:url("${url}")`);
      box.setAttribute('href', `/gallery/${hit.artist}/${hit.objectID}`);
      textBox.appendChild(title);
      textBox.appendChild(artist);
    }
    box.appendChild(img);
    box.appendChild(textBox);
    row.appendChild(box);
  }
}