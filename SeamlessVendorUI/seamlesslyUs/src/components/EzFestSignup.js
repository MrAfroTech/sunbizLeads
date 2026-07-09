import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/WineWalkMap.css';
import ezfestLocations from '../data/ezfestLocations.json';

const EzFestSignup = () => {
    // Configuration from environment variables with proper fallbacks
    const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'false' ? false : true;
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";
    const ENABLE_CONTINUOUS_TRACKING = process.env.REACT_APP_ENABLE_CONTINUOUS_TRACKING === 'true';
    
    // Developer override system for quick testing (set to null to use env vars)
    const DEV_OVERRIDE = {
        DEMO_MODE: null, // Set to true/false to override, null to use env var
        GOOGLE_MAPS_API_KEY: null, // Set to your key to override, null to use env var
        ENABLE_CONTINUOUS_TRACKING: null // Set to true/false to override, null to use env var
    };
    
    // Final configuration
    const config = {
        DEMO_MODE: DEV_OVERRIDE.DEMO_MODE !== null ? DEV_OVERRIDE.DEMO_MODE : DEMO_MODE,
        GOOGLE_MAPS_API_KEY: DEV_OVERRIDE.GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY,
        ENABLE_CONTINUOUS_TRACKING: DEV_OVERRIDE.ENABLE_CONTINUOUS_TRACKING !== null ? DEV_OVERRIDE.ENABLE_CONTINUOUS_TRACKING : ENABLE_CONTINUOUS_TRACKING
    };

    const mapRef = useRef(null);
    const scriptRef = useRef(null);
    const loadingRef = useRef(false);
    const initializingRef = useRef(false);
    const mapInitializedRef = useRef(false);
    const [map, setMap] = useState(null);
    const [userMarker, setUserMarker] = useState(null);
    const [watchId, setWatchId] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [locations, setLocations] = useState([]);
    const [locationMarkers, setLocationMarkers] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [status, setStatus] = useState({ message: '', type: '', visible: false });
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [componentMounted, setComponentMounted] = useState(false);

    // Mark component as mounted
    useEffect(() => {
        setComponentMounted(true);
        return () => {
            setComponentMounted(false);
        };
    }, []);

    // Cleanup function
    useEffect(() => {
        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
            
            if (locationMarkers.length > 0) {
                locationMarkers.forEach(marker => {
                    try {
                        if (marker && marker.setMap) {
                            marker.setMap(null);
                        }
                    } catch (error) {
                        console.warn('Error removing location marker:', error);
                    }
                });
            }
            
            if (userMarker) {
                try {
                    if (userMarker.setMap) {
                        userMarker.setMap(null);
                    }
                } catch (error) {
                    console.warn('Error removing user marker:', error);
                }
            }

            loadingRef.current = false;
            initializingRef.current = false;
            mapInitializedRef.current = false;
        };
    }, [watchId, locationMarkers, userMarker]);

    const showStatus = useCallback((message, type) => {
        if (!componentMounted) return;
        setStatus({ message, type, visible: true });
        setTimeout(() => {
            if (componentMounted) {
                setStatus(prev => ({ ...prev, visible: false }));
            }
        }, 5000);
    }, [componentMounted]);

    const getLocationIcon = useCallback((type) => {
        const icons = {
            winery: '🍷',
            restaurant: '🍽️',
            shop: '🛍️',
            checkpoint: '📍',
            hotel: '🏨',
            bar: '🍸',
            brewery: '🍺'
        };
        return icons[type] || '🍽️';
    }, []);

    const createInfoWindowContent = useCallback((location) => {
        return `
            <div style="padding: 12px; max-width: 300px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">
                    ${getLocationIcon(location.type)} ${location.name}
                    ${location.featured ? ' ⭐' : ''}
                </h4>
                ${location.category ? `
                    <p style="margin: 4px 0; font-size: 12px; color: #d4af37; font-weight: bold;">
                        ${location.category}
                    </p>
                ` : ''}
                ${location.description ? `
                    <p style="margin: 8px 0; font-size: 12px; line-height: 1.4; color: #555;">
                        ${location.description}
                    </p>
                ` : ''}
                ${location.hours ? `
                    <p style="margin: 4px 0; font-size: 11px; color: #666;">
                        🕒 ${location.hours}
                    </p>
                ` : ''}
                ${location.phone ? `
                    <p style="margin: 4px 0; font-size: 11px; color: #666;">
                        📞 ${location.phone}
                    </p>
                ` : ''}
                <button 
                    onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}', '_blank')"
                    style="
                        background: linear-gradient(135deg, #d4af37, #f5d76e, #926f34);
                        color: #0a0a0a;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-top: 8px;
                    "
                >
                    Get Directions
                </button>
            </div>
        `;
    }, [getLocationIcon]);

    const getMarkerIcon = useCallback((type) => {
        const icons = {
            winery: '🍷',
            restaurant: '🍽️',
            shop: '🛍️',
            checkpoint: '📍',
            hotel: '🏨',
            bar: '🍸',
            brewery: '🍺'
        };
        const icon = icons[type] || '🍽️';
        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#d4af37" stroke-width="3"/>
                    <text x="20" y="28" text-anchor="middle" font-size="16" fill="#333">${icon}</text>
                </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
        };
    }, []);

    const addLocationMarkers = useCallback(async (mapInstance) => {
        if (!mapInstance || !window.google || !window.google.maps || !componentMounted) return;
        
        console.log('Adding location markers to map');
        
        // Clear existing markers safely
        locationMarkers.forEach(marker => {
            if (marker && marker.setMap) {
                try {
                    marker.setMap(null);
                } catch (error) {
                    console.warn('Error removing marker:', error);
                }
            }
        });
        
        const newMarkers = [];
        
        // Use legacy markers for stability
        for (let index = 0; index < locations.length; index++) {
            const location = locations[index];
            try {
                const position = {
                    lat: location.lat + (index * 0.0005),
                    lng: location.lng + (index * 0.0005)
                };
                
                const marker = new window.google.maps.Marker({
                    position: position,
                    map: mapInstance,
                    title: location.name,
                    icon: getMarkerIcon(location.type),
                    animation: window.google.maps.Animation.DROP
                });
                
                const infoWindow = new window.google.maps.InfoWindow({
                    content: createInfoWindowContent(location)
                });
                
                marker.addListener('click', () => {
                    newMarkers.forEach(m => {
                        if (m.infoWindow && m.infoWindow.close) {
                            try {
                                m.infoWindow.close();
                            } catch (error) {
                                console.warn('Error closing info window:', error);
                            }
                        }
                    });
                    infoWindow.open(mapInstance, marker);
                });
                
                marker.infoWindow = infoWindow;
                newMarkers.push(marker);
            } catch (error) {
                console.warn('Error creating marker for location:', location.name, error);
            }
        }
        
        if (componentMounted) {
            setLocationMarkers(newMarkers);
        }
        
        if (newMarkers.length > 0) {
            try {
                const bounds = new window.google.maps.LatLngBounds();
                newMarkers.forEach(marker => {
                    bounds.extend(marker.getPosition());
                });
                mapInstance.fitBounds(bounds);
                
                window.google.maps.event.addListenerOnce(mapInstance, 'bounds_changed', () => {
                    if (mapInstance.getZoom() > 18) {
                        mapInstance.setZoom(18);
                    }
                });
            } catch (error) {
                console.warn('Error setting map bounds:', error);
            }
        }
    }, [locations, locationMarkers, getMarkerIcon, createInfoWindowContent, componentMounted]);

    const initMap = useCallback(() => {
        console.log('initMap called');

        if (!window.google || 
            !window.google.maps || 
            !window.google.maps.Map ||
            !mapRef.current || 
            !componentMounted) {
            console.log('initMap: Prerequisites not met');
            return;
        }
        
        if (initializingRef.current || mapInitializedRef.current) {
            console.log('initMap: Already initializing or initialized');
            return;
        }
        
        if (map) {
            console.log('initMap: Map already exists');
            return;
        }
        
        initializingRef.current = true;
        console.log('initMap: Starting map initialization');
        
        try {
            const defaultCenter = { lat: 28.5493, lng: -81.7731 };
            
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                zoom: 16,
                center: defaultCenter,
                styles: [{ 
                    featureType: 'poi', 
                    elementType: 'labels', 
                    stylers: [{ visibility: 'off' }] 
                }],
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true,
                gestureHandling: 'auto',
                clickableIcons: false
            });
            
            // Wait for map to be ready
            window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
                console.log('Map is ready and idle');
                mapInitializedRef.current = true;
                if (componentMounted) {
                    setMap(mapInstance);
                    showStatus('Interactive Google Maps loaded successfully!', 'success');
                    
                    // Add markers after map is fully ready
                    if (locations.length > 0) {
                        setTimeout(() => {
                            addLocationMarkers(mapInstance);
                        }, 500);
                    }
                }
            });
            
        } catch (error) {
            console.error('Error initializing map:', error);
            if (componentMounted) {
                showStatus('Error loading Google Maps: ' + error.message, 'error');
            }
        } finally {
            initializingRef.current = false;
        }
    }, [componentMounted, map, locations, addLocationMarkers, showStatus]);

    const loadGoogleMaps = useCallback(() => {
        if (!componentMounted) return;
        
        console.log('loadGoogleMaps called', {
            demoMode: config.DEMO_MODE,
            hasApiKey: !!config.GOOGLE_MAPS_API_KEY,
            isLoading: loadingRef.current,
            hasGoogleMaps: !!(window.google && window.google.maps)
        });
        
        if (config.DEMO_MODE) {
            setMapsLoaded(true);
            showStatus('Demo mode: Map interface loaded (no API key required)', 'success');
            console.log('🔧 Running in DEMO MODE - set REACT_APP_DEMO_MODE=false for live Google Maps');
            return;
        }

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.Map) {
            console.log('Google Maps already loaded, using existing instance');
            setMapsLoaded(true);
            setTimeout(() => initMap(), 100);
            return;
        }
        
        // Prevent multiple loads
        if (loadingRef.current) {
            console.log('Google Maps already loading...');
            return;
        }

        // Check for existing script
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            console.log('Google Maps script already exists, waiting for load...');
            loadingRef.current = true;
            
            let attempts = 0;
            const maxAttempts = 30;
            
            const checkGoogleMaps = () => {
                attempts++;
                if (window.google && window.google.maps && window.google.maps.Map) {
                    loadingRef.current = false;
                    if (componentMounted) {
                        setMapsLoaded(true);
                        setTimeout(() => initMap(), 100);
                    }
                } else if (attempts < maxAttempts) {
                    setTimeout(checkGoogleMaps, 500);
                } else {
                    loadingRef.current = false;
                    console.error('Google Maps loading timeout');
                    if (componentMounted) {
                        showStatus('Google Maps loading timeout. Please refresh the page.', 'error');
                        setMapsLoaded(true);
                    }
                }
            };
            
            setTimeout(checkGoogleMaps, 500);
            return;
        }
        
        if (!config.GOOGLE_MAPS_API_KEY) {
            console.error('Google Maps API key not found in environment variables');
            showStatus('Google Maps API key missing. Add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file.', 'error');
            setMapsLoaded(true);
            return;
        }
        
        loadingRef.current = true;
        showStatus('Loading Google Maps...', 'success');
        
        const callbackName = 'initGoogleMaps_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const loadTimeout = setTimeout(() => {
            loadingRef.current = false;
            console.error('Google Maps loading timeout after 15 seconds');
            if (componentMounted) {
                showStatus('Google Maps loading timeout. Please refresh the page.', 'error');
                setMapsLoaded(true);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
        }, 15000);
        
        window[callbackName] = () => {
            clearTimeout(loadTimeout);
            loadingRef.current = false;
            console.log('Google Maps script loaded successfully');
            if (componentMounted) {
                setMapsLoaded(true);
                setTimeout(() => initMap(), 100);
                showStatus('Google Maps loaded successfully!', 'success');
            }
            delete window[callbackName];
        };
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.GOOGLE_MAPS_API_KEY}&callback=${callbackName}&v=3.56`;
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
            clearTimeout(loadTimeout);
            loadingRef.current = false;
            console.error('Failed to load Google Maps API - check your API key and billing settings');
            if (componentMounted) {
                showStatus('Failed to load Google Maps. Check your API key, billing, and internet connection.', 'error');
                setMapsLoaded(true);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
        
        scriptRef.current = script;
        document.head.appendChild(script);
    }, [initMap, showStatus, config, componentMounted]);

const loadLocationsFromJSON = useCallback(() => {
    if (!componentMounted) return;
    
    console.log('🔍 Raw ezfestLocations:', ezfestLocations);
    
    try {
        let locationsData = [];
        
        if (ezfestLocations && ezfestLocations.foodTrucks) {
            console.log('📍 Found food trucks in JSON:', ezfestLocations.foodTrucks.length);
            
            locationsData = ezfestLocations.foodTrucks.map((foodTruck, index) => {
                console.log(`Processing food truck ${index + 1}:`, foodTruck.name);
                
                const lat = foodTruck.lat || 28.5493;
                const lng = foodTruck.lng || -81.7731;
                
                console.log(`📍 Coordinates for ${foodTruck.name}:`, { lat, lng });
                
                return {
                    id: foodTruck.id || index + 1,
                    name: foodTruck.name,
                    address: foodTruck.address || 'Clermont, FL',
                    type: foodTruck.type,
                    lat: lat,
                    lng: lng,
                    description: foodTruck.description,
                    phone: foodTruck.phone,
                    website: foodTruck.website,
                    hours: foodTruck.hours,
                    featured: foodTruck.menu && foodTruck.menu.length > 2,
                    order: index + 1,
                    category: foodTruck.type,
                    specialties: foodTruck.menu,
                    rating: foodTruck.rating,
                    waitTime: foodTruck.waitTime,
                    icon: foodTruck.icon
                };
            });
            
            console.log('✅ Processed food trucks with coordinates:', locationsData);
            
        } else {
            console.error('❌ No food trucks found in JSON structure');
            console.log('JSON structure:', Object.keys(ezfestLocations || {}));
            throw new Error('No food trucks found in JSON file');
        }
        
        if (locationsData.length > 0) {
            const sortedLocations = locationsData.sort((a, b) => {
                return (a.order || a.id) - (b.order || b.id);
            });
            
            console.log(`🎯 Setting ${sortedLocations.length} food trucks on map`);
            setLocations(sortedLocations);
            showStatus(`Loaded ${sortedLocations.length} food trucks!`, 'success');
            
        } else {
            throw new Error('No valid locations found after processing');
        }
    } catch (error) {
        console.error('❌ Failed to load locations from JSON:', error);
        console.log('🔧 Falling back to default location');
        showStatus('Loading default locations (JSON file issue)', 'error');
            
            const defaultLocations = [
                {
                    id: 1,
                    name: "Taco Fiesta Express",
                    type: "restaurant",
                    lat: 28.5493,
                    lng: -81.7731,
                    description: "Authentic street tacos and burritos made fresh daily",
                    featured: true,
                    order: 1
                }
            ];
            setLocations(defaultLocations);
        }
    }, [showStatus, componentMounted]);

    useEffect(() => {
        if (!componentMounted) return;
        
        let mounted = true;
        
        const initialize = async () => {
            try {
                console.log('Initializing component...');
                loadLocationsFromJSON();
                
                setTimeout(() => {
                    if (mounted && componentMounted) {
                        loadGoogleMaps();
                    }
                }, 100);
            } catch (error) {
                console.error('Error initializing map component:', error);
                if (mounted && componentMounted) {
                    showStatus('Error initializing map', 'error');
                }
            }
        };
        
        initialize();
        
        return () => {
            mounted = false;
        };
    }, [componentMounted]);

    useEffect(() => {
        if (!config.DEMO_MODE && map && locations.length > 0 && mapsLoaded && componentMounted) {
            console.log('Adding markers to existing map');
            const timer = setTimeout(() => {
                addLocationMarkers(map);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [locations.length, map, mapsLoaded, componentMounted, config.DEMO_MODE]);

    const calculateDistance = useCallback((pos1, pos2) => {
        const R = 6371;
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
        const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }, []);

    const updateDistances = useCallback((userPos) => {
        locations.forEach((location) => {
            const distance = calculateDistance(userPos, location);
            console.log(`Distance to ${location.name}: ${distance.toFixed(1)} km`);
        });
    }, [locations, calculateDistance]);

    const updatePosition = useCallback((position) => {
        if (!componentMounted) return;
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const newUserLocation = { lat, lng };
        setUserLocation(newUserLocation);
        console.log('User position updated:', newUserLocation);
        showStatus(`Location updated! Accuracy: ${Math.round(accuracy)}m`, 'success');
        
        if (!config.DEMO_MODE && map && window.google) {
            try {
                if (userMarker) {
                    userMarker.setPosition(newUserLocation);
                } else {
                    const marker = new window.google.maps.Marker({
                        position: newUserLocation,
                        map: map,
                        title: 'Your Location',
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                                    <circle cx="15" cy="15" r="12" fill="#4285F4" stroke="#ffffff" stroke-width="3"/>
                                    <circle cx="15" cy="15" r="5" fill="#ffffff"/>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(30, 30),
                            anchor: new window.google.maps.Point(15, 15)
                        },
                        zIndex: 1000
                    });
                    
                    setUserMarker(marker);
                }
                map.setCenter(newUserLocation);
                map.setZoom(16);
            } catch (error) {
                console.warn('Error updating user marker:', error);
            }
        }
        updateDistances(newUserLocation);
    }, [map, userMarker, showStatus, updateDistances, config.DEMO_MODE, componentMounted]);

    const handleLocationError = useCallback((error) => {
        if (!componentMounted) return;
        
        let message;
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = "Location access denied. Please enable location services.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                message = "Location request timed out.";
                break;
            default:
                message = "An unknown error occurred.";
                break;
        }
        showStatus(message, 'error');
        setIsTracking(false);
    }, [showStatus, componentMounted]);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            showStatus('Geolocation is not supported by this browser.', 'error');
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        };

        if (config.ENABLE_CONTINUOUS_TRACKING) {
            const id = navigator.geolocation.watchPosition(
                updatePosition,
                handleLocationError,
                options
            );
            setWatchId(id);
            setIsTracking(true);
            showStatus('Continuous GPS tracking started!', 'success');
        } else {
            navigator.geolocation.getCurrentPosition(
                updatePosition,
                handleLocationError,
                options
            );
            setIsTracking(true);
        }
    }, [updatePosition, handleLocationError, showStatus, config.ENABLE_CONTINUOUS_TRACKING]);

    const stopTracking = useCallback(() => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setIsTracking(false);
        setUserLocation(null);
        if (userMarker) {
            try {
                userMarker.setMap(null);
                setUserMarker(null);
            } catch (error) {
                console.warn('Error removing user marker:', error);
            }
        }
        showStatus('GPS tracking stopped.', 'success');
    }, [watchId, userMarker, showStatus]);

    const findNearestLocation = useCallback(() => {
        if (!userLocation) {
            showStatus('Please start GPS tracking first.', 'error');
            return;
        }
        if (locations.length === 0) {
            showStatus('No locations available.', 'error');
            return;
        }
        
        let nearestLocation = null;
        let nearestDistance = Infinity;
        
        locations.forEach(location => {
            const distance = calculateDistance(userLocation, location);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestLocation = location;
            }
        });
        
        if (nearestLocation && !config.DEMO_MODE && map && window.google) {
            try {
                map.setCenter({ lat: nearestLocation.lat, lng: nearestLocation.lng });
                map.setZoom(18);
                
                const marker = locationMarkers.find(m => m.getTitle() === nearestLocation.name);
                
                if (marker) {
                    if (marker.setAnimation && window.google.maps.Animation) {
                        marker.setAnimation(window.google.maps.Animation.BOUNCE);
                        setTimeout(() => {
                            if (marker.setAnimation) {
                                marker.setAnimation(null);
                            }
                        }, 2000);
                    }
                    
                    if (marker.infoWindow) {
                        marker.infoWindow.open(map, marker);
                    }
                }
            } catch (error) {
                console.warn('Error highlighting nearest location:', error);
            }
        }
        
        if (nearestLocation) {
            showStatus(
                `Nearest: ${nearestLocation.name} (${nearestDistance.toFixed(1)} km away)`, 
                'success'
            );
        }
    }, [userLocation, locations, map, locationMarkers, calculateDistance, showStatus, config.DEMO_MODE]);

    const showAllLocations = useCallback(() => {
        if (locations.length === 0) {
            showStatus('No locations to display.', 'error');
            return;
        }
        
        if (!config.DEMO_MODE && map && window.google && locationMarkers.length > 0) {
            try {
                const bounds = new window.google.maps.LatLngBounds();
                locationMarkers.forEach(marker => {
                    bounds.extend(marker.getPosition());
                });
                
                if (userMarker) {
                    bounds.extend(userMarker.getPosition());
                }
                
                map.fitBounds(bounds);
                
                window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                    if (map.getZoom() > 18) {
                        map.setZoom(18);
                    }
                });
            } catch (error) {
                console.warn('Error showing all locations:', error);
            }
        }
        
        console.log('Showing all locations:', locations);
        showStatus(`Displaying all ${locations.length} establishments`, 'success');
    }, [locations, map, locationMarkers, userMarker, showStatus, config.DEMO_MODE]);

    const getDirections = useCallback((lat, lng, name) => {
        const destination = `${lat},${lng}`;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
        window.open(url, '_blank');
        showStatus(`Opening directions to ${name}`, 'success');
    }, [showStatus]);

    const getDistanceToLocation = useCallback((location) => {
        if (!userLocation) return null;
        const distance = calculateDistance(userLocation, location);
        return distance.toFixed(1);
    }, [userLocation, calculateDistance]);

    if (!componentMounted) {
        return null;
    }

    return (
        <div className="wine-walk-container">
            <div className="wine-walk-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
                {/* Map Section - Left Side */}
                <div style={{ height: '100%' }}>
                    <div className="wine-walk-header" style={{
                        background: 'rgba(212, 175, 55, 0.1)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        marginBottom: '20px'
                    }}>
                        <h1 style={{ color: '#d4af37', marginBottom: '10px' }}>🎪 EzFest</h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '10px' }}>Discover the best food trucks and vendors at the festival</p>
                        {ezfestLocations.foodTrucks && (
                            <div style={{fontSize: '14px', opacity: 0.8, color: 'rgba(255,255,255,0.7)'}}>
                                Explore {ezfestLocations.foodTrucks.length} food trucks within 1 mile of downtown Clermont
                            </div>
                        )}
                    </div>

                <div className="wine-walk-controls">
                    <div className="wine-walk-button-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                            className={`wine-walk-btn ${isTracking ? 'wine-walk-btn-secondary' : 'wine-walk-btn-primary'}`}
                            onClick={isTracking ? stopTracking : startTracking}
                            style={{ width: '100%' }}
                        >
                            {isTracking ? '⏹️ Stop Tracking' : '📍 Start GPS Tracking'}
                        </button>
                        <button 
                            className="wine-walk-btn wine-walk-btn-secondary" 
                            onClick={findNearestLocation}
                            disabled={!userLocation}
                            style={{ width: '100%' }}
                        >
                            🎯 Find Nearest Location
                        </button>
                        <button 
                            className="wine-walk-btn wine-walk-btn-secondary" 
                            onClick={showAllLocations}
                            style={{ width: '100%' }}
                        >
                            🗺️ Show All Locations
                        </button>
                    </div>
                    
                    {status.visible && (
                        <div className={`wine-walk-status ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    {userLocation && (
                        <div style={{
                            marginTop: '10px', 
                            padding: '8px', 
                            background: 'rgba(212, 175, 55, 0.1)', 
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#e0b841'
                        }}>
                            📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </div>
                    )}
                </div>

                <div className="wine-walk-map-container">
                    <div ref={mapRef} className="wine-walk-map">
                        {config.DEMO_MODE ? (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                color: 'white',
                                fontSize: '18px',
                                textAlign: 'center',
                                zIndex: 1
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
                                <div>Interactive Map (Demo Mode)</div>
                                <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                                    GPS tracking and directions still work!
                                </div>
                                <div style={{ fontSize: '12px', marginTop: '20px', opacity: 0.6, maxWidth: '400px' }}>
                                    Set REACT_APP_DEMO_MODE=false in your .env file for full map functionality
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    marginTop: '15px',
                                    padding: '8px 12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '20px',
                                    opacity: 0.7
                                }}>
                                    Current: DEMO_MODE = {config.DEMO_MODE.toString()}
                                </div>
                            </div>
                        ) : !mapsLoaded ? (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                color: 'white',
                                fontSize: '18px',
                                textAlign: 'center',
                                zIndex: 1
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
                                <div>Loading Google Maps...</div>
                                <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                                    Please wait while we load the interactive map
                                </div>
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    borderTop: '3px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    marginTop: '20px'
                                }}></div>
                            </div>
                        ) : null}
                        </div>
                    </div>
                </div>

                {/* Food Truck List - Right Side */}
                <div className="wine-walk-location-list">
                    <h3>Food Truck Vendors ({locations.length})</h3>
                    <div>
                        {locations.length === 0 ? (
                            <div style={{
                                textAlign: 'center', 
                                padding: '40px', 
                                color: '#666',
                                fontStyle: 'italic'
                            }}>
                                No food trucks loaded. Check your ezfestLocations.json file.
                            </div>
                        ) : (
                            locations.map((location, index) => (
                                <div key={location.id || index} className="wine-walk-location-item">
                                    <div className="wine-walk-location-info">
                                        <div className="wine-walk-location-name">
                                            {getLocationIcon(location.type)} {location.name}
                                            {location.featured && (
                                                <span style={{color: '#d4af37', marginLeft: '8px'}}>⭐</span>
                                            )}
                                            {userLocation && (
                                                <span style={{
                                                    color: '#666', 
                                                    fontSize: '12px', 
                                                    marginLeft: '8px'
                                                }}>
                                                    ({getDistanceToLocation(location)} km)
                                                </span>
                                            )}
                                            {location.distance_from_center && (
                                                <span style={{
                                                    color: '#888', 
                                                    fontSize: '11px', 
                                                    marginLeft: '8px'
                                                }}>
                                                    • {location.distance_from_center}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {location.category && (
                                            <div style={{
                                                fontSize: '12px', 
                                                color: '#d4af37', 
                                                marginTop: '2px',
                                                fontWeight: 'bold'
                                            }}>
                                                {location.category}
                                            </div>
                                        )}
                                        
                                        {location.description && (
                                            <div style={{
                                                fontSize: '14px', 
                                                color: '#888', 
                                                marginTop: '4px',
                                                lineHeight: '1.4'
                                            }}>
                                                {location.description}
                                            </div>
                                        )}

                                        {location.specialties && location.specialties.length > 0 && (
                                            <div style={{
                                                fontSize: '12px', 
                                                color: '#666', 
                                                marginTop: '6px',
                                                fontStyle: 'italic'
                                            }}>
                                                Specialties: {location.specialties.slice(0, 3).join(', ')}
                                                {location.specialties.length > 3 && '...'}
                                            </div>
                                        )}
                                        
                                        <div style={{
                                            display: 'flex', 
                                            flexWrap: 'wrap', 
                                            gap: '12px', 
                                            marginTop: '8px'
                                        }}>
                                            {location.hours && (
                                                <div style={{fontSize: '12px', color: '#666'}}>
                                                    🕒 {location.hours}
                                                </div>
                                            )}
                                            {location.phone && (
                                                <div style={{fontSize: '12px', color: '#666'}}>
                                                    📞 {location.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="wine-walk-location-actions">
                                        <button 
                                            className="wine-walk-btn wine-walk-btn-primary wine-walk-btn-small"
                                            onClick={() => getDirections(location.lat, location.lng, location.name)}
                                        >
                                            Directions
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EzFestSignup;