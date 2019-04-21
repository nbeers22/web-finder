class Utility {

  static scrollToResults() {
    const header = document.getElementsByClassName('banner')[0];
    const height = header.offsetHeight;
    window.scrollTo({ top: height, left: 0, behavior: "smooth" });
  }
}

class Search {
  constructor(searchStr,type = '',url = ''){
    this.searchStr     = searchStr;
    this.type          = type;
    this.url           = url;
    this.dictionaryURL = `https://googledictionaryapi.eu-gb.mybluemix.net/?define=${this.searchStr}&lang=en`;
  }
  
  decideType(){
    let results;
    switch (this.type) {
      case 'page':
      case '':
        this.url = `https://www.googleapis.com/customsearch/v1?cx=008446815321438153834:5okybrne5hw&q=${this.searchStr}&key=${config.GOOGLE_SEARCH_KEY}`;
        break;

      case 'image':
        this.url = `https://api.unsplash.com/search/photos?page=1&query=${this.searchStr}&per_page=20&client_id=${config.UNSPLASH_KEY}`
        break;

      case 'video':
        this.url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${this.searchStr}&key=${config.YOUTUBE_KEY}`;
        break;
    }
    this.getResults(this.url);
  }

  getResults(url) {
    fetch(url)
      .then( response => response.json() )
      .then( data => {
        switch (this.type) {
          case 'page':
          case '':
            const page = new Page(data,this.dictionaryURL,this.searchStr);
            page.getDictionaryResults();
            break;

          case 'image':
            const image = new Image(data);
            image.showResults();
            break;

          case 'video':
            const video = new Video(data);
            video.showResults();
            break;
        }
      });
  }

  hideDictionary(){
    document.getElementById('dictionary-result').classList.remove('show');
  }
}

class Page extends Search{
  static soundURL;

  constructor(results,dictionaryURL,searchStr){
    super();
    this.results       = results;
    this.dictionaryURL = dictionaryURL;
    this.searchStr     = searchStr;
  }

  getDictionaryResults() {
    fetch(this.dictionaryURL)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return false;
      })
      .then( data => this.showResults(data) );
  }

  showResults(dictionaryResults){
    let searchHTML = '';
    document.getElementById('dictionary-result').classList.remove('show');
    const dictionary = document.getElementById('dictionary-result');
    const search     = document.getElementById('search-results');
    const numResults = document.getElementById('num-results');
    
    // clear results
    dictionary.innerHTML = "";
    search.innerHTML     = "";
    numResults.innerHTML = "";

    if (dictionaryResults.length > 0) {
      document.getElementById('dictionary-result').classList.add('show');
      let allMeanings = '';
      let soundImage  = '';
      let phonetic    = ''
      let meanings    = dictionaryResults[0].meaning;

      if (dictionaryResults[0].pronunciation){
        Page.soundURL = dictionaryResults[0].pronunciation;
        soundImage = '<a href=""><img class="play-sound" src="images/sound-button.png" alt="Play Sound"></a>';
      }
      
      if (dictionaryResults[0].phonetic){
        phonetic = `<p class="phonetic"><small>${dictionaryResults[0].phonetic}</small></p>`;
      }

      // Get all meanings of word and store in allMeanings
      Object.keys(meanings).forEach( ele => {
        let meaning = '';
        
        meanings[ele].forEach( result => {
          meaning += `<li>${result.definition}</li>`;
        });

        allMeanings += `
        <div class="meaning">
          <p><strong>${ele}</strong></p>
          <ol>
            ${meaning}
          </ol>
        </div>
        `

      });

      dictionary.insertAdjacentHTML('beforeend',
        `
      <div class="dict-flex">
        ${soundImage}
        <h2>${this.searchStr}</h2>
      </div>
      ${phonetic}
      <div class="meanings">${allMeanings}</div>
      <p></p>
      `
      )
    }

    // Hide loading gif right before results are populated
    document.getElementsByClassName('loading')[0].classList.toggle('hide');

    // Show total results returned
    numResults.innerHTML = `Total results: ${this.results.searchInformation.formattedTotalResults}`;
    console.log(this.results.items)
    // Display each search result
    this.results.items.forEach( (element,i) => {
      let img = '';
      if(element.pagemap.cse_thumbnail){
        img = `<div class="img-result" style="background-image: url(${element.pagemap.cse_thumbnail[0].src})"></div>`;
      }
      searchHTML += `
        <div class="search-item">
          <a href="${element.link}"><h3 class="search-title">${element.htmlTitle}</h3></a>
          <article class="search-meta">
            ${img}
            <div class="text-result">
              <p class="search-snippet">${element.snippet}</p>
              <p class="search-url">${element.displayLink}</p>
            </div>
          </div>
        </div>
      `
    });

    search.insertAdjacentHTML('beforeend',searchHTML)

    document.getElementById('results').classList.add('show');
    Utility.scrollToResults();
  }

  static playSound() {
    var audio = new Audio(this.soundURL);
    audio.play();
  }
  
}

class Image extends Search {
  constructor(results) {
    super();
    this.results = results;
  }

  showResults(){
    this.hideDictionary();
    let imagesHTML   = '';
    const search     = document.getElementById('search-results');
    const numResults = document.getElementById('num-results');
    const dictionary = document.getElementById('dictionary-result');

    search.innerHTML     = '';
    numResults.innerHTML = '';
    dictionary.innerHTML = '';

    numResults.innerHTML = `Total results: ${this.results.total}`;
    
    this.results.results.forEach((element, i) => {
      imagesHTML += `
        <figure class="image-block">
          <div class="image-item" style="background-image: url(${element.urls.regular})"></div>
          <p class="image-title">${element.description}</p>
        </figure>
      `
    });

    search.insertAdjacentHTML('beforeend', imagesHTML)
  }
}

class Video extends Search {
  constructor(results) {
    super();
    this.results = results;
  }

  showResults(){
    this.hideDictionary();
    let videosHTML   = '';
    const search     = document.getElementById('search-results');
    const numResults = document.getElementById('num-results');
    const dictionary = document.getElementById('dictionary-result');

    search.innerHTML     = '';
    numResults.innerHTML = '';
    dictionary.innerHTML = '';

    numResults.innerHTML = `Total results: ${this.results.pageInfo.totalResults}`;
    
    this.results.items.forEach((element, i) => {
      videosHTML += `
        <figure class="image-block video-block">
          <div class="image-item video-item" data-modal="video-modal" data-embed="https://www.youtube.com/embed/${element.id.videoId}" data-title="${element.snippet.title}" style="background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),url(${element.snippet.thumbnails.high.url});">
            <svg data-modal="video-modal" data-embed="https://www.youtube.com/embed/${element.id.videoId}" data-title="${element.snippet.title}" class="video-overlay-play-button" viewBox="0 0 200 200" alt="Play video" id="play-video">
              <circle cx="100" cy="100" r="90" fill="none" stroke-width="15" stroke="#FFF"/>
              <polygon points="70, 55 70, 145 145, 100" fill="#FFF"/>
            </svg>
          </div>
          <p class="image-title">${element.snippet.title}</p>
        </figure>
      `
    });

    search.insertAdjacentHTML('beforeend', videosHTML)
  }
}

const searchHandler = () => {
  const btn = document.getElementById('submit');

  btn.addEventListener('click', event => {
    let searchStr = document.getElementById('search').value;
    // let type      = document.getElementById('type').value;
    document.getElementsByClassName('loading')[0].classList.toggle('hide');
    event.preventDefault();
    
    if(!searchStr) return false;

    const search = new Search(searchStr);
    search.decideType();
  });
}

const openModal = (title,embedURL) => {
  document.querySelector('body').classList.add('modal-open');
  document.getElementById('modal-title').innerText = title;
  document.getElementById('video-iframe').src = embedURL;
  document.getElementById('video-modal').style.height = "auto";
}

const closeModal = () => {
  document.querySelector('body').classList.remove('modal-open');
  document.getElementById('video-iframe').src = "";
  document.getElementById('video-modal').style.height = 0;
}

const navHandler = (type) => {
  let searchStr = document.getElementById('search').value;
  const search = new Search(searchStr,type);
  search.decideType();
}

const eventListeners = () => {
  document.addEventListener('click', function (event) {
    event.preventDefault();

    // switch active nav item
    if (event.target.matches('.menu-item')) {
      document.querySelector('nav').querySelectorAll('li').forEach(element => {
        element.classList.remove('active');
      });
      event.target.parentElement.classList.add('active');
      navHandler(event.target.dataset.type);
    // Open video modal
    } else if (event.target.matches('.video-item') || event.target.matches('.video-overlay-play-button')){
      openModal(event.target.dataset.title, event.target.dataset.embed);
    } else if(event.target.matches('.play-sound')){
      Page.playSound();
    }

  }, false);
}

const init = () => {
  searchHandler();
  eventListeners();
 
  var options = {
    strings: ["Web Pages", "Images", "Videos", "Weather", "Definitions", "Recipes", "Jobs", "And More!"],
    typeSpeed: 40,
    loop: true
  }

  var typed = new Typed("#typed", options);
}

init();
