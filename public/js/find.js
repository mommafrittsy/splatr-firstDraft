/* global algoliasearch */
const client = algoliasearch('LKDIWAGI3B','ec8e37b8cd9ce00d0460518bc0796607'),
      userIndex = client.initIndex('users'),
      commissionIndex = client.initIndex('commissions'),
      artIndex = client.initIndex('galleries'),
      searchBox = document.getElementById('art-search'),
      row = document.getElementById('results-row'),
      // artists
      newArtists = document.getElementById('new-artists'),
      upcomingArtists = document.getElementById('high-rated-artists'),
      famousArtists = document.getElementById('many-review-artists'),
      // prices
      priceLow = document.getElementById('price-low'),
      priceAvg = document.getElementById('price-average'),
      priceHigh = document.getElementById('price-high'),
      // type
      animation = document.getElementById('animation'),
      comic = document.getElementById('comic'),
      craft = document.getElementById('craft'),
      digital = document.getElementById('digital'),
      fiction = document.getElementById('fiction'),
      film  = document.getElementById('film'),
      nonFiction  = document.getElementById('non-fiction'),
      photo = document.getElementById('photo'),
      poetry  = document.getElementById('poetry'),
      traditional = document.getElementById('traditional'),
      price = [priceLow, priceAvg, priceHigh],
      artist = [newArtists,upcomingArtists,famousArtists],
      type = [animation,comic,craft,digital,fiction,film,nonFiction,photo,poetry,traditional],
      filterBtns = price.concat(artist,type),
      tagQuery = document.getElementById('query');
var   typeFilters = [],
      artistFilter,
      priceFilter,
      query = {};
      
if(tagQuery && tagQuery.value != ''){
  window.addEventListener('load', function(){
    searchBox.value = tagQuery.value;
    search(tagQuery.value);
  });
}
for(let btn of filterBtns){
  if(btn){
    btn.addEventListener('click', ()=>{
    if(price.includes(btn)){
      if(btn.classList.contains('active')){
        btn.classList.remove('active');
        priceFilter = undefined;
      } else {
        for(let priceBtn of price){
          priceBtn.classList.remove('active');
        }
        btn.classList.add('active');
        priceFilter = btn.dataset.filter;
      }
    } else if(artist.includes(btn)){
      if(btn.classList.contains('active')){
        artistFilter = undefined;
        btn.classList.remove('active');
      } else {
        for(let artBtn of artist){
          artBtn.classList.remove('active');
        }
        btn.classList.add('active');
        artistFilter = btn.dataset.filter;
      }
    } else if (type.includes(btn)) {
      if(btn.classList.contains('active')){
        let index = typeFilters.indexOf(btn.dataset.filter);
        typeFilters.splice(index, 1);    
        btn.classList.remove('active');
      } else {
        btn.classList.add('active');
        typeFilters.push(btn.dataset.filter);
      }
    }
  });
  }
}    
searchBox.addEventListener('input', function(){
  search(searchBox.value);
});

function search(queryText){
  if(typeFilters.length > 0){
    var typeFilter = typeFilters.join(' OR ');
  }
  query.query = queryText;
  if(artistFilter != undefined && priceFilter != undefined && typeFilters.length > 0 ){
    query.filters = `(${typeFilter}) AND ${artistFilter} AND ${priceFilter}`;
  } else if(artistFilter != undefined && priceFilter != undefined){
    query.filters = `${artistFilter} AND ${priceFilter}`;
  } else if(artistFilter == undefined && priceFilter == undefined && typeFilters.length > 0){
    query.filters = `${typeFilter}`;
  } else if(priceFilter == undefined && typeFilters.length > 0 && artistFilter != undefined){
    query.filters = `(${typeFilter}) AND ${artistFilter}`;
  } else if(artistFilter == undefined && typeFilters.length > 0 && priceFilter != undefined) {
    query.filters = `(${typeFilter}) AND ${priceFilter}`;
  } else if(priceFilter == undefined && typeFilters.length == 0 && artistFilter != undefined){
    query.filters = `${artistFilter}`;
  } else if(artistFilter == undefined && typeFilters.length == 0 && priceFilter != undefined){
    query.filters = `${priceFilter}`;
  } else {
    query.filters = '';
  }
  row.innerHTML = ''; 
  console.log(query);
  userIndex.search(query, function(err, content) {
    if(err){
      console.log(err);
    } else {
      for(let hit of content.hits){
        result(hit, 'user');
      }
    }
  });
  commissionIndex.search(query, function(err, content){
    if(err){
      console.log(err);
    } else {
      for(let hit of content.hits){
        if(hit.NSFW == 'yes' || hit.NSFW == true){
          if(searchBox.dataset.nsfw == 'true'){
            result(hit, 'commission');
          }
        } else {
          result(hit, 'commission');
        }
      }
    }
  });
  artIndex.search(query, function(err, content){
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
}
function result(hit, index){
  let row = document.getElementById('results-row'),
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