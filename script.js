const apiKey = 'a418523e84e9f2a445ef1ba2d26565df';
let isFahrenheit = false;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentWeatherData = null;

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const unitToggle = document.getElementById('unit-toggle');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherDisplay = document.getElementById('weather-display');
const forecastSection = document.getElementById('forecast-section');
const favoritesSection = document.getElementById('favorites-section');
const searchLoader = document.getElementById('search-loader');

// Event Listeners
searchBtn.addEventListener('click', fetchWeatherByCity);
locationBtn.addEventListener('click', fetchWeatherByGeolocation);
unitToggle.addEventListener('click', toggleUnits);
document.getElementById('save-favorite-btn').addEventListener('click', saveToFavorites);

// Allow Enter key to search
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeatherByCity();
    }
});

function showLoading(show = true) {
    const searchIcon = searchBtn.querySelector('[data-lucide="search"]');
    const searchText = searchBtn.querySelector('span');
    
    if (show) {
        searchBtn.disabled = true;
        locationBtn.disabled = true;
        searchIcon.style.display = 'none';
        searchLoader.classList.remove('hidden');
        searchText.textContent = 'Loading...';
    } else {
        searchBtn.disabled = false;
        locationBtn.disabled = false;
        searchIcon.style.display = 'block';
        searchLoader.classList.add('hidden');
        searchText.textContent = 'Search';
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function fetchWeatherByCity() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    fetchWeather(city);
}

function fetchWeather(city, lat = null, lon = null) {
    showLoading(true);
    hideError();
    
    const units = isFahrenheit ? 'imperial' : 'metric';
    const url = lat && lon
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod !== 200) {
                throw new Error(data.message);
            }
            currentWeatherData = data;
            displayWeather(data);
            fetchForecast(data.coord.lat, data.coord.lon);
        })
        .catch(err => {
            showError(err.message);
        })
        .finally(() => {
            showLoading(false);
        });
}

function fetchWeatherByGeolocation() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeather(null, latitude, longitude);
            },
            () => {
                showError('Unable to retrieve your location');
                showLoading(false);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

function displayWeather(data) {
    weatherDisplay.classList.remove('hidden');
    
    document.getElementById('city-name').textContent = data.name;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('weather-condition').textContent = data.weather[0].description;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°${isFahrenheit ? 'F' : 'C'}`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${data.wind.speed} ${isFahrenheit ? 'mph' : 'm/s'}`;
    document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°${isFahrenheit ? 'F' : 'C'}`;
    
    // Update save button state
    const saveBtn = document.getElementById('save-favorite-btn');
    const saveBtnText = saveBtn.querySelector('span');
    if (favorites.includes(data.name)) {
        saveBtn.disabled = true;
        saveBtnText.textContent = 'Saved';
        saveBtn.classList.add('opacity-50');
    } else {
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Save to Favorites';
        saveBtn.classList.remove('opacity-50');
    }
}

function fetchForecast(lat, lon) {
    const units = isFahrenheit ? 'imperial' : 'metric';
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const forecastEl = document.getElementById('forecast');
            forecastEl.innerHTML = '';
            
            // Filter to get daily forecasts (every 8th item represents roughly 24 hours)
            const dailyForecasts = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);
            
            dailyForecasts.forEach(day => {
                const forecastCard = document.createElement('div');
                forecastCard.className = 'bg-gray-50 p-4 rounded-lg text-center';
                
                const date = new Date(day.dt * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                forecastCard.innerHTML = `
                    <p class="text-sm text-gray-600 mb-2">${dayName}</p>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Weather icon" class="w-12 h-12 mx-auto mb-2">
                    <p class="text-sm font-bold text-gray-800">
                        ${Math.round(day.main.temp_max)}°/${Math.round(day.main.temp_min)}°
                    </p>
                `;
                
                forecastEl.appendChild(forecastCard);
            });
            
            forecastSection.classList.remove('hidden');
        })
        .catch(err => {
            console.error('Error fetching forecast:', err);
        });
}

function toggleUnits() {
    isFahrenheit = !isFahrenheit;
    
    // Update toggle icon
    const toggleIcon = unitToggle.querySelector('[data-lucide]');
    toggleIcon.setAttribute('data-lucide', isFahrenheit ? 'toggle-right' : 'toggle-left');
    lucide.createIcons();
    
    // Refresh weather data if available
    if (currentWeatherData) {
        fetchWeather(currentWeatherData.name);
    }
}

function saveToFavorites() {
    if (!currentWeatherData) return;
    
    const city = currentWeatherData.name;
    if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesList();
        
        // Update save button
        const saveBtn = document.getElementById('save-favorite-btn');
        const saveBtnText = saveBtn.querySelector('span');
        saveBtn.disabled = true;
        saveBtnText.textContent = 'Saved';
        saveBtn.classList.add('opacity-50');
    }
}

function removeFavorite(city) {
    favorites = favorites.filter(fav => fav !== city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList();
    
    // Update save button if current city was removed
    if (currentWeatherData && currentWeatherData.name === city) {
        const saveBtn = document.getElementById('save-favorite-btn');
        const saveBtnText = saveBtn.querySelector('span');
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Save to Favorites';
        saveBtn.classList.remove('opacity-50');
    }
}

function updateFavoritesList() {
    const list = document.getElementById('favorites-list');
    list.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesSection.classList.add('hidden');
        return;
    }
    
    favorites.forEach(city => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
        
        favoriteItem.innerHTML = `
            <button class="text-blue-600 hover:text-blue-800 font-medium flex-1 text-left" onclick="fetchWeather('${city}')">
                ${city}
            </button>
            <button class="text-red-500 hover:text-red-700 p-1 ml-2" onclick="removeFavorite('${city}')">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        `;
        
        list.appendChild(favoriteItem);
    });
    
    // Reinitialize Lucide icons for new elements
    lucide.createIcons();
    favoritesSection.classList.remove('hidden');
}

// Initialize favorites on page load
updateFavoritesList();