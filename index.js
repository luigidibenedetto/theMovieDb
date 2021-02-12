const banner = document.querySelector("modal");
const popularSection = document.querySelector("#popular");
const topRatedSection = document.querySelector("#topRated");
const topRatedTvSection = document.querySelector("#topRatedTv");
const overlay = document.querySelector(".overlay");
const closeOverlay = document.querySelector("#close_overlay");

// Movie Detail elements
const detailTitle = document.querySelector("#detailTitle");
const listGeners = document.querySelector("#listGeners");
const detailDescription = document.querySelector("#detailDescription");
const detailDuration = document.querySelector("#detailDuration");
const detailDate = document.querySelector("#detailDate");
const countriesList = document.querySelector("#countriesList");
const castList = document.querySelector("#castList");
const productionList = document.querySelector("#productionList");

/**
 * STATE
 * stato dell'applicazione dove poter salvare i dati
 * ottenuti dall'esterno e/o dati di configurazioe
 */
const state = {
  config: {
    api_key: "81abe82ed06ba133fa0b2c72305a7650",
    base_url: "https://api.themoviedb.org/3",
    language: navigator.language
  },
  movies: {
    popular: null,
    top_rated: null,
    moviesDetails: {},
    moviesCredits: {}
  },
  tv: {
    popular: null,
    top_rated: null
  }
};

/**
 * UTILITIES
 * funzioni che aiutano a rendere il codice più leggibile,
 * pulito e non ripetitivo
 */
function getUrl(pathName) {
  const { api_key, base_url } = state.config;
  return `${base_url}${pathName}?api_key=${api_key}&language=${state.config.language}`;
}

async function getData(url) {
  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
      throw result;
    }
    return result;
  } catch (errorMessage) {
    console.log(errorMessage);
  }
}

async function getGuestSession() {
  const guestSessionUrl = getUrl("/authentication/guest_session/new");
  const result = await getData(guestSessionUrl);

  return result;
}

function isSessionExpired(expireDate) {
  const expireDateMs = new Date(expireDate).getTime();
  const nowTimeMs = new Date().getTime();

  return expireDateMs < nowTimeMs;
}

/**
 * STORAGE
 * funzioni che modificano il localStorage
 */
async function handleSession() {
  const sessionData = localStorage.getItem("mdb_session");

  if (!sessionData) {
    const newSessionData = await getGuestSession();

    if (newSessionData) {
      const sessionDataString = JSON.stringify(newSessionData);

      localStorage.setItem("mdb_session", sessionDataString);
      showToastBanner();
      return true;
    }

    return false;
  } else {
    const parsedSessionData = JSON.parse(sessionData);

    if (isSessionExpired(parsedSessionData.expires_at)) {
      localStorage.removeItem("mdb_session");
      await handleSession();
      return true;
    }
  }
}

/**
 * ACTIONS
 * funzioni che modificanao lo stato dell'applicazione
 */
async function getPopularMovies() {
  const popularMoviesUrl = getUrl("/movie/popular");
  const result = await getData(`${popularMoviesUrl}`);

  state.movies.popular = result.results;

  return result;
}

async function getTopRatedMovies() {
  const topRatedMoviesUrl = getUrl("/movie/top_rated");
  const result = await getData(`${topRatedMoviesUrl}`);

  state.movies.top_rated = result.results;

  return result;
}

async function getTopRatedTv() {
  const topRatedTvUrl = getUrl("/tv/top_rated");
  const result = await getData(`${topRatedTvUrl}`);

  state.tv.top_rated = result.results;

  return result;
}

async function getMovieDetails(id) {
  const movieDetailsUrl = getUrl(`/movie/${id}`);
  const result = await getData(`${movieDetailsUrl}`);

  state.movies.moviesDetails[id] = result;

  return result;
}

async function getMovieCredits(id) {
  const movieCreditsUrl = getUrl(`/movie/${id}/credits`);
  const result = await getData(`${movieCreditsUrl}`);

  state.movies.moviesCredits[id] = result;

  return result;
}

async function getImagesConfig() {
  const configurationUrl = getUrl("/configuration");
  const result = await getData(configurationUrl);

  state.config.images = result.images;

  return result;
}

/**
 * VIEW
 * funzioni che modificano gli elementi presenti in pagina
 */

function toggleOverlay() {
  overlay.classList.toggle("overlay__is-visible");
}

function showToastBanner() {
  banner.classList.toggle("banner__is-hidden");

  setTimeout(() => {
    banner.classList.toggle("banner__is-hidden");
  }, 4000);
}

function renderList(stringList, section) {
  section.textContent = "";

  stringList.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    section.append(li);
  });
}

/**
 * crea un elemento MovieCard formato da
 * un'immagine e il titolo in sovrapposizione a tutto
 * un elemento <a> al quaale viene assegnato l'id del film
 * per gestie il click dell'utente
 *
 * @param {string} coverUrl
 * @param {string} text
 * @param {string} id
 */
const MovieCard = (coverUrl, text, id) => {
  const cardWrap = document.createElement("article");
  const coverImg = document.createElement("img");
  const link = document.createElement("a");

  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");

  title.textContent = text;
  coverImg.src = coverUrl;
  link.id = id;

  cardWrap.classList.add("card");
  titleWrap.classList.add("card__title_wrap");

  /**
   * questa classe fa in modo che l'element <a> diventi layer
   * sopra tutti gli altri elementi in modo da poter gestire
   * il click ovunque sulla card
   */
  link.classList.add("card__link");

  titleWrap.appendChild(title);
  cardWrap.append(coverImg, titleWrap, link);

  return cardWrap;
};

function renderCarousel(list, sectionNode) {
  list.forEach((item) => {
    const { base_url, backdrop_sizes } = state.config.images;
    const coverUrl = `${base_url}${backdrop_sizes[0]}${item.backdrop_path}`;

    const movieCard = MovieCard(coverUrl, item.title || item.name, item.id);

    sectionNode.appendChild(movieCard);
  });
}

function renderCredits(credits) {
  const cast = credits.cast.slice(0, 5).map((actor) => actor.name);

  const crew = credits.crew
    .filter((person) => person.job === "Director")
    .map((person) => person.name);

  renderList(cast, castList);
  renderList(crew, productionList);
}

function renderDetails(details) {
  detailTitle.textContent = details.title;
  detailDescription.textContent = details.overview;
  detailDuration.textContent = `${details.runtime} minuti`;

  const date = new Date(details.release_date);

  detailDate.textContent = new Intl.DateTimeFormat(state.config.language, {
    dateStyle: "long"
  }).format(date);

  const genres = details.genres.map((genre) => genre.name);
  const countries = details.production_countries.map((country) => country.name);

  renderList(genres, listGeners);
  renderList(countries, countriesList);
}

async function handleMovieDetails(event) {
  const movieId = event.target.id;

  if (!state.movies.moviesDetails[movieId]) {
    await Promise.all([getMovieDetails(movieId), getMovieCredits(movieId)]);
  }

  renderDetails(state.movies.moviesDetails[movieId]);
  renderCredits(state.movies.moviesCredits[movieId]);

  toggleOverlay();
}

async function handleMounted() {
  await Promise.all([
    handleSession(),
    getImagesConfig(),
    getPopularMovies(),
    getTopRatedMovies(),
    getTopRatedTv()
  ]);

  renderCarousel(state.movies.popular, popularSection);
  renderCarousel(state.movies.top_rated, topRatedSection);
  renderCarousel(state.tv.top_rated, topRatedTvSection);
}

/**
 * EVENTS
 * funzioni e listener legati agli eventi
 */
function handleUnload() {
  closeOverlay.removeEventListener("click", toggleOverlay);
  popularSection.removeEventListener("click", handleMovieDetails);
  topRatedSection.removeEventListener("click", handleMovieDetails);
}

/**
 * USER EVENTS
 */
closeOverlay.addEventListener("click", toggleOverlay);
popularSection.addEventListener("click", handleMovieDetails);
topRatedSection.addEventListener("click", handleMovieDetails);

/**
 * LIFECYCLE EVENTS
 */
document.addEventListener("DOMContentLoaded", handleMounted, { once: true });
document.addEventListener("beforeunload", handleUnload, { once: true });
