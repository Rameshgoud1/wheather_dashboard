import React, { useState, useEffect } from 'react';
import { Search, MapPin, ToggleLeft, ToggleRight, Heart, Star, Sun, CloudRain, Loader2 } from 'lucide-react';

const API_KEY = 'a418523e84e9f2a445ef1ba2d26565df';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
    temp_max: number;
    temp_min: number;
  };
  weather: {
    icon: string;
    description: string;
  }[];
  wind: {
    speed: number;
  };
  coord: {
    lat: number;
    lon: number;
  };
}

interface ForecastData {
  dt: number;
  main: {
    temp_max: number;
    temp_min: number;
  };
  weather: {
    icon: string;
  }[];
}

function App() {
  const [cityInput, setCityInput] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const fetchWeather = async (city: string, lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const units = isFahrenheit ? 'imperial' : 'metric';
      const url = lat && lon
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${units}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.cod !== 200) {
        throw new Error(data.message);
      }
      
      setWeatherData(data);
      await fetchForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const units = isFahrenheit ? 'imperial' : 'metric';
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Filter to get daily forecasts (every 8th item represents roughly 24 hours)
      const dailyForecasts = data.list.filter((_: any, index: number) => index % 8 === 0);
      setForecastData(dailyForecasts.slice(0, 5));
    } catch (err) {
      console.error('Error fetching forecast:', err);
    }
  };

  const handleCitySearch = () => {
    if (!cityInput.trim()) {
      setError('Please enter a city name');
      return;
    }
    fetchWeather(cityInput.trim());
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather('', latitude, longitude);
        },
        () => {
          setError('Unable to retrieve your location');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const toggleUnits = () => {
    setIsFahrenheit(!isFahrenheit);
    if (weatherData) {
      fetchWeather(weatherData.name);
    }
  };

  const saveToFavorites = () => {
    if (weatherData && !favorites.includes(weatherData.name)) {
      setFavorites([...favorites, weatherData.name]);
    }
  };

  const removeFavorite = (city: string) => {
    setFavorites(favorites.filter(fav => fav !== city));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sun className="text-yellow-300" />
            Weather App
          </h1>
          <p className="text-blue-100">Get current weather and 5-day forecast</p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCitySearch()}
                  placeholder="Enter city name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCitySearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                Search
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button
                onClick={handleGeolocation}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                <MapPin size={20} />
                Use My Location
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-600">°C</span>
                <button
                  onClick={toggleUnits}
                  className="text-blue-500 hover:text-blue-600"
                >
                  {isFahrenheit ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                <span className="text-gray-600">°F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Weather Display */}
        {weatherData && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                    alt="Weather icon"
                    className="w-20 h-20"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{weatherData.name}</h2>
                    <p className="text-gray-600 capitalize">{weatherData.weather[0].description}</p>
                  </div>
                </div>
                
                <button
                  onClick={saveToFavorites}
                  disabled={favorites.includes(weatherData.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  <Heart size={20} />
                  {favorites.includes(weatherData.name) ? 'Saved' : 'Save to Favorites'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Temperature</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(weatherData.main.temp)}°{isFahrenheit ? 'F' : 'C'}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Humidity</p>
                  <p className="text-2xl font-bold text-green-600">{weatherData.main.humidity}%</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Wind Speed</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {weatherData.wind.speed} {isFahrenheit ? 'mph' : 'm/s'}
                  </p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Feels Like</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(weatherData.main.temp)}°{isFahrenheit ? 'F' : 'C'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecastData.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">5-Day Forecast</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {forecastData.map((day, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                      alt="Weather icon"
                      className="w-12 h-12 mx-auto mb-2"
                    />
                    <p className="text-sm font-bold text-gray-800">
                      {Math.round(day.main.temp_max)}°/{Math.round(day.main.temp_min)}°
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="text-yellow-500" />
                Favorite Cities
              </h3>
              <div className="space-y-2">
                {favorites.map((city, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => fetchWeather(city)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {city}
                    </button>
                    <button
                      onClick={() => removeFavorite(city)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;