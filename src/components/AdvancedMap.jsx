import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  useMap,
  useMapEvents
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Search, MapPin, Compass } from 'lucide-react';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color = 'blue', size = 'medium') => {
  const sizes = {
    small: [20, 32],
    medium: [25, 41],
    large: [30, 50]
  };
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: sizes[size],
    iconAnchor: [sizes[size][0] / 2, sizes[size][1]],
    popupAnchor: [1, -sizes[size][1] + 5],
    shadowSize: [sizes[size][1], sizes[size][1]]
  });
};

// Map event handler component
const MapEvents = ({ onMapClick, onLocationFound }) => {
  const map = useMapEvents({
    click: (e) => {
      onMapClick && onMapClick(e.latlng);
    },
    locationfound: (e) => {
      onLocationFound && onLocationFound(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return null;
};

// Component to handle map center or sizing updates reactively
const MapUpdateTrigger = ({ isFullscreen, center }) => {
  const map = useMap();

  useEffect(() => {
    // Small timeout to allow the browser to complete DOM layout rendering
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
      if (center) {
        map.setView(center, map.getZoom());
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [map, isFullscreen, center]);

  return null;
};

// Custom control component with dark theme & translations
const CustomControls = ({ onLocate, onToggleLayer, layers, t, toggleFullscreen, isFullscreen }) => {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: 'topright' });
    
    control.onAdd = () => {
      const div = L.DomUtil.create('div', 'custom-controls leaflet-bar');
      // Style with premium dark glassmorphism to blend with dark dashboard
      div.style.background = 'rgba(12, 13, 16, 0.85)';
      div.style.backdropFilter = 'blur(12px)';
      div.style.border = '1px solid rgba(255,255,255,0.08)';
      div.style.borderRadius = '16px';
      div.style.padding = '8px';
      div.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.gap = '6px';
      
      div.innerHTML = `
        <button id="locate-btn" style="
          background: rgba(255,255,255,0.04);
          color: #f1f5f9;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">📍 ${t.gpsTracking || 'Locate Me'}</button>
        
        <button id="satellite-btn" style="
          background: ${layers.satellite ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)'};
          color: ${layers.satellite ? '#c084fc' : '#f1f5f9'};
          border: 1px solid ${layers.satellite ? '#a855f750' : 'rgba(255,255,255,0.08)'};
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">🛰️ Satellite</button>

        <button id="fullscreen-btn" style="
          background: rgba(255,255,255,0.04);
          color: #f1f5f9;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">
          ${isFullscreen ? '🗗 ' + (t.backBtn || 'Exit Full') : '🗖 ' + (t.interactiveMap || 'Fullscreen')}
        </button>
      `;
      
      L.DomEvent.disableClickPropagation(div);
      
      const locateBtn = div.querySelector('#locate-btn');
      const satelliteBtn = div.querySelector('#satellite-btn');
      const fullscreenBtn = div.querySelector('#fullscreen-btn');
      
      locateBtn.onclick = () => onLocate();
      satelliteBtn.onclick = () => onToggleLayer('satellite');
      fullscreenBtn.onclick = () => toggleFullscreen();
      
      return div;
    };

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, onLocate, onToggleLayer, layers, t, toggleFullscreen, isFullscreen]);

  return null;
};

// Search component with dark styling & translations
const SearchControl = ({ onSearch, t }) => {
  const [query, setQuery] = useState('');
  const map = useMap();

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const results = await response.json();
      
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latLng = [parseFloat(lat), parseFloat(lon)];
        map.flyTo(latLng, 13);
        onSearch && onSearch({ latLng, name: display_name });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  useEffect(() => {
    const control = L.control({ position: 'topleft' });
    
    control.onAdd = () => {
      const div = L.DomUtil.create('div', 'search-control leaflet-bar');
      // Dark premium glassmorphism styling
      div.style.background = 'rgba(12, 13, 16, 0.85)';
      div.style.backdropFilter = 'blur(12px)';
      div.style.border = '1px solid rgba(255,255,255,0.08)';
      div.style.borderRadius = '16px';
      div.style.padding = '8px';
      div.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
      div.style.display = 'flex';
      div.style.gap = '6px';
      div.style.alignItems = 'center';
      
      div.innerHTML = `
        <div style="display: flex; gap: 6px; align-items: center;">
          <input 
            id="search-input" 
            type="text" 
            placeholder="${t.exploreSites || 'Search places...'}" 
            style="
              padding: 6px 12px; 
              border: 1px solid rgba(255,255,255,0.1); 
              border-radius: 8px; 
              width: 160px;
              background: rgba(255,255,255,0.04);
              color: #f1f5f9;
              font-size: 11px;
              outline: none;
            "
          />
          <button 
            id="search-btn" 
            style="
              padding: 6px 10px; 
              border: none; 
              border-radius: 8px; 
              cursor: pointer; 
              background: #a855f7; 
              color: white;
              font-size: 11px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            "
          >
            🔍
          </button>
        </div>
      `;
      
      L.DomEvent.disableClickPropagation(div);
      
      const input = div.querySelector('#search-input');
      const button = div.querySelector('#search-btn');
      
      input.value = query;
      input.addEventListener('input', (e) => setQuery(e.target.value));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
      button.addEventListener('click', handleSearch);
      
      return div;
    };

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, t]);

  return null;
};

// Main AdvancedMap component
export const AdvancedMap = ({
  center = [31.18, 35.8],
  zoom = 7.5,
  markers = [],
  polygons = [],
  circles = [],
  polylines = [],
  onMarkerClick,
  onMapClick,
  enableClustering = true,
  enableSearch = true,
  enableControls = true,
  mapLayers = {
    darkmap: true,
    satellite: false
  },
  className = '',
  style = { height: '100%', width: '100%' },
  t = {}, // Translations dictionary
  children // To inject custom items like MovingBus
}) => {
  const [currentLayers, setCurrentLayers] = useState(mapLayers);
  const [userLocation, setUserLocation] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle layer toggling
  const handleToggleLayer = useCallback((layerType) => {
    setCurrentLayers(prev => ({
      ...prev,
      [layerType]: !prev[layerType]
    }));
  }, []);

  // Handle geolocation
  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback((latlng) => {
    setClickedLocation(latlng);
    onMapClick && onMapClick(latlng);
  }, [onMapClick]);

  // Handle search results
  const handleSearch = useCallback((result) => {
    setSearchResult(result);
  }, []);

  // Toggle fullscreen state
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Styled overlay when map is fullscreen
  const fullscreenStyle = isFullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#07080a',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }
    : {};

  return (
    <div
      className={`advanced-map-wrapper ${className}`}
      style={{ ...style, ...fullscreenStyle, transition: 'all 0.3s ease-in-out' }}
    >
      {/* Fullscreen header panel */}
      {isFullscreen && (
        <div className="flex justify-between items-center bg-[#0c0d10] border border-white/10 rounded-2xl p-4 mb-4 shadow-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Compass className="animate-spin-slow" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{t.interactiveMap || 'Interactive Dashboard Map'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">FULLSCREEN</span>
              </h3>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest">IOT SMART GEOGRAPHIC VIEW PORTAL</p>
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white border border-white/10 hover:border-purple-500/40 bg-white/5 transition-all cursor-pointer"
          >
            <Minimize2 size={13} />
            <span>{t.backBtn || 'Close'}</span>
          </button>
        </div>
      )}

      {/* Main Map Container */}
      <div className="relative flex-1 w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%', background: '#07080a' }}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Reactive update on size transition */}
          <MapUpdateTrigger isFullscreen={isFullscreen} center={center} />

          {/* Base Dark tile layer */}
          {currentLayers.darkmap && (
            <TileLayer
              attribution="&copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          )}
          
          {/* Esri Satellite layer overlay */}
          {currentLayers.satellite && (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}

          {/* Map events */}
          <MapEvents
            onMapClick={handleMapClick}
            onLocationFound={setUserLocation}
          />

          {/* Search control */}
          {enableSearch && <SearchControl onSearch={handleSearch} t={t} />}

          {/* Custom controls */}
          {enableControls && (
            <CustomControls
              onLocate={handleLocate}
              onToggleLayer={handleToggleLayer}
              layers={currentLayers}
              t={t}
              toggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
            />
          )}

          {/* Markers with clustering */}
          {enableClustering ? (
            <MarkerClusterGroup>
              {markers.map((marker, index) => (
                <Marker
                  key={marker.id || index}
                  position={marker.position}
                  icon={marker.icon || createCustomIcon(marker.color, marker.size)}
                  eventHandlers={{
                    click: () => onMarkerClick && onMarkerClick(marker)
                  }}
                >
                  {marker.popup && (
                    <Popup>
                      <div className={`font-sans ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <h3 className="font-bold text-white text-xs">{marker.popup.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">{marker.popup.content}</p>
                        {marker.popup.image && (
                          <img 
                            src={marker.popup.image} 
                            alt={marker.popup.title}
                            className="max-w-[200px] h-auto rounded-lg mt-2 border border-white/10"
                          />
                        )}
                      </div>
                    </Popup>
                  )}
                </Marker>
              ))}
            </MarkerClusterGroup>
          ) : (
            markers.map((marker, index) => (
              <Marker
                key={marker.id || index}
                position={marker.position}
                icon={marker.icon || createCustomIcon(marker.color, marker.size)}
                eventHandlers={{
                  click: () => onMarkerClick && onMarkerClick(marker)
                }}
              >
                {marker.popup && (
                  <Popup>
                    <div className={`font-sans ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <h3 className="font-bold text-white text-xs">{marker.popup.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">{marker.popup.content}</p>
                    </div>
                  </Popup>
                )}
              </Marker>
            ))
          )}

          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={userLocation}
              icon={createCustomIcon('red', 'medium')}
            >
              <Popup>{t.clientAccount || 'Your current location'}</Popup>
            </Marker>
          )}

          {/* Search result marker */}
          {searchResult && (
            <Marker 
              position={searchResult.latLng}
              icon={createCustomIcon('green', 'large')}
            >
              <Popup>{searchResult.name}</Popup>
            </Marker>
          )}

          {/* Clicked location marker */}
          {clickedLocation && (
            <Marker 
              position={[clickedLocation.lat, clickedLocation.lng]}
              icon={createCustomIcon('orange', 'small')}
            >
              <Popup>
                <div className="font-mono text-[9px] text-slate-300">
                  Lat: {clickedLocation.lat.toFixed(6)}<br/>
                  Lng: {clickedLocation.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Polygons */}
          {polygons.map((polygon, index) => (
            <Polygon
              key={polygon.id || index}
              positions={polygon.positions}
              pathOptions={polygon.style || { color: '#a855f7', weight: 2, fillOpacity: 0.2 }}
            >
              {polygon.popup && <Popup>{polygon.popup}</Popup>}
            </Polygon>
          ))}

          {/* Circles */}
          {circles.map((circle, index) => (
            <Circle
              key={circle.id || index}
              center={circle.center}
              radius={circle.radius}
              pathOptions={circle.style || { color: '#eab308', weight: 2, fillOpacity: 0.15 }}
            >
              {circle.popup && <Popup>{circle.popup}</Popup>}
            </Circle>
          ))}

          {/* Polylines */}
          {polylines.map((polyline, index) => (
            <Polyline
              key={polyline.id || index}
              positions={polyline.positions}
              pathOptions={polyline.style || { color: '#a855f7', weight: 3 }}
            >
              {polyline.popup && <Popup>{polyline.popup}</Popup>}
            </Polyline>
          ))}

          {/* Custom children e.g., MovingBus tracker */}
          {children}
        </MapContainer>
      </div>
    </div>
  );
};
