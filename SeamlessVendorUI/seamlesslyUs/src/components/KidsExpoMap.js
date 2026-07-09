import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/KidsExpoMap.css';
import kidsExpoData from '../data/kidsExpoLocations.json';

const KidsExpoMap = () => {
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
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [favoriteVendors, setFavoriteVendors] = useState(new Set());

    // Mark component as mounted
    useEffect(() => {
        setComponentMounted(true);
        return () => {
            setComponentMounted(false);
        };
    }, []);

    // Log configuration on component mount
    useEffect(() => {
        if (!componentMounted) return;
        
        console.log('🎪 Kids Expo Map Configuration:', {
            'Raw Environment Variables': {
                REACT_APP_DEMO_MODE: process.env.REACT_APP_DEMO_MODE,
                REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
                REACT_APP_ENABLE_CONTINUOUS_TRACKING: process.env.REACT_APP_ENABLE_CONTINUOUS_TRACKING,
                NODE_ENV: process.env.NODE_ENV
            },
            'Final Configuration': {
                DEMO_MODE: config.DEMO_MODE,
                HAS_API_KEY: !!config.GOOGLE_MAPS_API_KEY,
                CONTINUOUS_TRACKING: config.ENABLE_CONTINUOUS_TRACKING
            }
        });
    }, [config, componentMounted]);

    // Cleanup function
    useEffect(() => {
        return () => {
            // Clean up geolocation
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
            
            // Clean up markers safely
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

            // Reset refs
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
            healthcare: '🏥',
            education: '📚',
            orthodontics: '😁',
            pediatrics: '👶',
            activities: '🎨',
            recreation: '🏊',
            tutoring: '📖',
            daycare: '🧸',
            sponsor: '⭐',
            featured: '🌟'
        };
        return icons[type] || '🏢';
    }, []);

    const createInfoWindowContent = useCallback((location) => {
        return `
            <div style="padding: 12px; max-width: 300px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">
                    ${getLocationIcon(location.type)} ${location.name}
                    ${location.featured ? ' 🌟' : ''}
                    ${location.sponsor ? ' ⭐' : ''}
                </h4>
                <p style="margin: 4px 0; font-size: 13px; color: #666;">
                    Booth: ${location.booth || 'TBD'}
                </p>
                ${location.category ? `
                    <p style="margin: 4px 0; font-size: 12px; color: #4a90e2; font-weight: bold;">
                        ${location.category}
                    </p>
                ` : ''}
                ${location.description ? `
                    <p style="margin: 8px 0; font-size: 12px; line-height: 1.4; color: #555;">
                        ${location.description}
                    </p>
                ` : ''}
                ${location.services && location.services.length > 0 ? `
                    <p style="margin: 4px 0; font-size: 11px; color: #666;">
                        Services: ${location.services.slice(0, 3).join(', ')}
                    </p>
                ` : ''}
                ${location.phone ? `
                    <p style="margin: 4px 0; font-size: 11px; color: #666;">
                        📞 ${location.phone}
                    </p>
                ` : ''}
                ${location.website ? `
                    <button 
                        onclick="window.open('${location.website}', '_blank')"
                        style="
                            background: linear-gradient(135deg, #4a90e2, #357abd);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 15px;
                            font-size: 11px;
                            font-weight: bold;
                            cursor: pointer;
                            margin-top: 8px;
                            margin-right: 8px;
                        "
                    >
                        Visit Website
                    </button>
                ` : ''}
                <button 
                    onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}', '_blank')"
                    style="
                        background: linear-gradient(135deg, #ffc107, #ffb300);
                        color: #333;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 15px;
                        font-size: 11px;
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

    const getMarkerIcon = useCallback((type, isSpecial = false) => {
        const icons = {
            healthcare: '🏥',
            education: '📚',
            orthodontics: '😁',
            pediatrics: '👶',
            activities: '🎨',
            recreation: '🏊',
            tutoring: '📖',
            daycare: '🧸',
            sponsor: '⭐',
            featured: '🌟'
        };
        const icon = icons[type] || '🏢';
        const backgroundColor = isSpecial ? '#ffc107' : '#4a90e2';
        const borderColor = isSpecial ? '#ffb300' : '#357abd';
        
        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="3"/>
                    <text x="20" y="28" text-anchor="middle" font-size="16" fill="#fff">${icon}</text>
                </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
        };
    }, []);

    const addLocationMarkers = useCallback(async (mapInstance) => {
        if (!mapInstance || !window.google || !window.google.maps || !componentMounted) return;
        
        console.log('Adding location markers to expo map');
        
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
        const filteredLocations = selectedCategory === 'all' 
            ? locations 
            : locations.filter(loc => loc.category === selectedCategory || loc.type === selectedCategory);
        
        // Use legacy markers for stability
        for (let index = 0; index < filteredLocations.length; index++) {
            const location = filteredLocations[index];
            try {
                // For gymnasium layout, we'll use a grid-based positioning system
                const baseX = 28.5493; // Gymnasium center lat
                const baseY = -81.7731; // Gymnasium center lng
                const gridSize = 0.0002; // Smaller grid for gymnasium
                
                const position = {
                    lat: baseX + (Math.floor(index / 5) * gridSize),
                    lng: baseY + ((index % 5) * gridSize)
                };
                
                const isSpecial = location.featured || location.sponsor;
                const marker = new window.google.maps.Marker({
                    position: position,
                    map: mapInstance,
                    title: location.name,
                    icon: getMarkerIcon(location.type, isSpecial),
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
                    if (mapInstance.getZoom() > 19) {
                        mapInstance.setZoom(19);
                    }
                });
            } catch (error) {
                console.warn('Error setting map bounds:', error);
            }
        }
    }, [locations, locationMarkers, selectedCategory, getMarkerIcon, createInfoWindowContent, componentMounted]);

    // Initialize map function (same as wine walk but with kids expo styling)
    const initMap = useCallback(() => {
        console.log('initMap called for Kids Expo');

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
        console.log('initMap: Starting expo map initialization');
        
        try {
            // Default to a gymnasium location (you can customize this)
            const defaultCenter = { lat: 28.5493, lng: -81.7731 };
            
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                zoom: 18,
                center: defaultCenter,
                styles: [
                    { 
                        featureType: 'poi', 
                        elementType: 'labels', 
                        stylers: [{ visibility: 'off' }] 
                    },
                    {
                        featureType: 'landscape',
                        elementType: 'geometry',
                        stylers: [{ color: '#e8f4f8' }]
                    }
                ],
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true,
                gestureHandling: 'auto',
                clickableIcons: false
            });
            
            // Wait for map to be ready
            window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
                console.log('Expo map is ready and idle');
                mapInitializedRef.current = true;
                if (componentMounted) {
                    setMap(mapInstance);
                    showStatus('Interactive expo map loaded successfully!', 'success');
                    
                    // Add markers after map is fully ready
                    if (locations.length > 0) {
                        setTimeout(() => {
                            addLocationMarkers(mapInstance);
                        }, 500);
                    }
                }
            });
            
        } catch (error) {
            console.error('Error initializing expo map:', error);
            if (componentMounted) {
                showStatus('Error loading expo map: ' + error.message, 'error');
            }
        } finally {
            initializingRef.current = false;
        }
    }, [componentMounted, map, locations, addLocationMarkers, showStatus]);

    // Load Google Maps (same as wine walk)
    const loadGoogleMaps = useCallback(() => {
        if (!componentMounted) return;
        
        console.log('loadGoogleMaps called for Kids Expo');
        
        if (config.DEMO_MODE) {
            setMapsLoaded(true);
            showStatus('Demo mode: Expo map interface loaded (no API key required)', 'success');
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
        
        // Rest of loadGoogleMaps implementation (same as wine walk)
        // ... (copy the full implementation from the wine walk component)
        
    }, [initMap, showStatus, config, componentMounted]);

    const getCategoryType = useCallback((category) => {
        const categoryMap = {
            'Primrose School of Horizon West': 'education',
            'Ur Learning Solution': 'tutoring',
            'Sakowitz Smiles Orthodontics': 'orthodontics',
            'The Learning Experience Windermere': 'education',
            'AdventHealth': 'healthcare',
            'Pediatric Dentistry Of Horizon West': 'pediatrics',
            'Nemours Children\'s Health': 'pediatrics',
            'Exquisite Pool & Spa': 'recreation'
        };
        return categoryMap[category] || 'activities';
    }, []);

    const loadDefaultLocations = useCallback(() => {
        const defaultLocations = [
            {
                id: 1,
                name: "Primrose School of Horizon West",
                booth: "A1",
                type: "education",
                category: "Education",
                lat: 28.5493,
                lng: -81.7731,
                description: "Presenting Sponsor - Quality early childhood education",
                phone: "(407) 555-0123",
                featured: true,
                sponsor: true,
                order: 1
            },
            {
                id: 2,
                name: "Ur Learning Solution",
                booth: "B2",
                type: "tutoring",
                category: "Education",
                lat: 28.5495,
                lng: -81.7729,
                description: "Personalized tutoring services for all ages",
                phone: "(407) 555-0124",
                order: 2
            },
            {
                id: 3,
                name: "Sakowitz Smiles Orthodontics",
                booth: "C3",
                type: "orthodontics",
                category: "Healthcare",
                lat: 28.5497,
                lng: -81.7727,
                description: "Pediatric orthodontic care and braces",
                phone: "(407) 555-0125",
                order: 3
            }
        ];
        
        if (componentMounted) {
            setLocations(defaultLocations);
            console.log('Loaded default expo locations:', defaultLocations);
        }
    }, [componentMounted]);

    const loadLocationsFromJSON = useCallback(() => {
        if (!componentMounted) return;
        
        console.log('🔍 Raw kidsExpoData:', kidsExpoData);
        
        try {
            let locationsData = [];
            
            if (kidsExpoData && kidsExpoData.vendors) {
                console.log('📍 Found vendors in JSON:', kidsExpoData.vendors.length);
                
                locationsData = kidsExpoData.vendors.map((vendor, index) => {
                    console.log(`Processing vendor ${index + 1}:`, vendor.name);
                    
                    // For gymnasium layout, assign coordinates in a grid pattern
                    const baseX = 28.5493;
                    const baseY = -81.7731;
                    const gridSize = 0.0002;
                    
                    const lat = baseX + (Math.floor(index / 5) * gridSize);
                    const lng = baseY + ((index % 5) * gridSize);
                    
                    return {
                        id: index + 1,
                        name: vendor.name,
                        booth: vendor.booth || `Booth ${index + 1}`,
                        type: getCategoryType(vendor.name),
                        category: vendor.category || 'General',
                        lat: lat,
                        lng: lng,
                        description: vendor.description,
                        phone: vendor.phone,
                        website: vendor.website,
                        services: vendor.services || [],
                        featured: vendor.sponsor === 'Presenting Sponsor',
                        sponsor: !!vendor.sponsor,
                        order: index + 1
                    };
                });
                
                console.log('✅ Processed expo vendors:', locationsData);
                
            } else {
                console.error('❌ No vendors found in JSON structure');
                throw new Error('No vendors found in JSON file');
            }
            
            if (locationsData.length > 0) {
                const sortedLocations = locationsData.sort((a, b) => {
                    return (a.order || a.id) - (b.order || b.id);
                });
                
                console.log(`🎯 Setting ${sortedLocations.length} expo vendors`);
                setLocations(sortedLocations);
                showStatus(`Loaded ${sortedLocations.length} expo vendors!`, 'success');
                
            } else {
                throw new Error('No valid vendors found after processing');
            }
        } catch (error) {
            console.error('❌ Failed to load vendors from JSON:', error);
            console.log('🔧 Falling back to default vendors');
            showStatus('Loading default vendors (JSON file issue)', 'error');
            loadDefaultLocations();
        }
    }, [getCategoryType, showStatus, loadDefaultLocations, componentMounted]);

    // Initialize component
    useEffect(() => {
        if (!componentMounted) return;
        
        let mounted = true;
        
        const initialize = async () => {
            try {
                console.log('Initializing Kids Expo component...');
                loadLocationsFromJSON();
                
                setTimeout(() => {
                    if (mounted && componentMounted) {
                        loadGoogleMaps();
                    }
                }, 100);
            } catch (error) {
                console.error('Error initializing expo map component:', error);
                if (mounted && componentMounted) {
                    showStatus('Error initializing expo map', 'error');
                }
            }
        };
        
        initialize();
        
        return () => {
            mounted = false;
        };
    }, [componentMounted]);

    // Add markers when ready
    useEffect(() => {
        if (!config.DEMO_MODE && map && locations.length > 0 && mapsLoaded && componentMounted) {
            console.log('Adding markers to existing expo map');
            const timer = setTimeout(() => {
                addLocationMarkers(map);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [locations.length, map, mapsLoaded, componentMounted, config.DEMO_MODE, selectedCategory]);

    // Category filter handler
    const handleCategoryChange = useCallback((category) => {
        setSelectedCategory(category);
        if (map && !config.DEMO_MODE) {
            // Re-add markers with new filter
            setTimeout(() => {
                addLocationMarkers(map);
            }, 100);
        }
        showStatus(
            category === 'all' 
                ? 'Showing all vendors' 
                : `Showing ${category} vendors`, 
            'success'
        );
    }, [map, config.DEMO_MODE, addLocationMarkers, showStatus]);

    // Favorite vendor toggle
    const toggleFavorite = useCallback((vendorId) => {
        setFavoriteVendors(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(vendorId)) {
                newFavorites.delete(vendorId);
                showStatus('Removed from favorites', 'success');
            } else {
                newFavorites.add(vendorId);
                showStatus('Added to favorites', 'success');
            }
            return newFavorites;
        });
    }, [showStatus]);

    // Get unique categories for filter
    const getCategories = useCallback(() => {
        const categories = new Set(['all']);
        locations.forEach(location => {
            if (location.category) {
                categories.add(location.category);
            }
        });
        return Array.from(categories);
    }, [locations]);

    // Filter locations by category
    const filteredLocations = selectedCategory === 'all' 
        ? locations 
        : locations.filter(loc => loc.category === selectedCategory);

    // Don't render anything until component is mounted
    if (!componentMounted) {
        return null;
    }

    return (
        <div className="kids-expo-container">
            <div className="kids-expo-inner">
                <div className="kids-expo-header">
                    <h1>🎪 Horizon West Kids Expo</h1>
                    <p>Navigate the gymnasium and discover amazing businesses for your family</p>
                    <div className="expo-date-info">
                        📅 July 23rd • Gymnasium Layout
                    </div>
                    
                    {/* Configuration Status */}
                    <div style={{ 
                        fontSize: '12px', 
                        opacity: 0.6, 
                        marginTop: '10px',
                        padding: '5px 10px',
                        background: config.DEMO_MODE ? 'rgba(255, 193, 7, 0.1)' : 'rgba(74, 144, 226, 0.1)',
                        borderRadius: '15px',
                        display: 'inline-block',
                        border: config.DEMO_MODE ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(74, 144, 226, 0.3)'
                    }}>
                        {config.DEMO_MODE ? '🔧 Demo Mode' : '🌐 Live Mode'} | Expo Map
                        {process.env.NODE_ENV === 'development' && (
                            <span style={{ marginLeft: '5px', opacity: 0.8 }}>| Dev</span>
                        )}
                    </div>
                </div>

                {/* Category Filter */}
                <div className="category-filter">
                    <h4>Filter by Category:</h4>
                    <div className="category-buttons">
                        {getCategories().map(category => (
                            <button
                                key={category}
                                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(category)}
                            >
                                {category === 'all' ? '🏢 All Vendors' : 
                                 category === 'Education' ? '📚 Education' :
                                 category === 'Healthcare' ? '🏥 Healthcare' :
                                 category === 'Recreation' ? '🏊 Recreation' :
                                 `🎯 ${category}`}
                            </button>
                        ))}
                    </div>
                </div>

                {status.visible && (
                    <div className={`kids-expo-status ${status.type}`}>
                        {status.message}
                    </div>
                )}

                <div className="kids-expo-map-container">
                    <div className="gymnasium-layout">
                        {/* Gymnasium Header */}
                        <div className="gymnasium-header">
                            <h3>🏟️ Gymnasium Floor Plan</h3>
                            <p>Click on any booth to see vendor details</p>
                        </div>
                        
                        {/* Gymnasium Grid */}
                        <div className="gymnasium-grid">
                            {/* Entry/Exit */}
                            <div className="gymnasium-entrance">
                                <span>🚪 Main Entrance</span>
                            </div>
                            
                            {/* Vendor Booths */}
                            <div className="booths-container">
                                {filteredLocations.map((vendor, index) => {
                                    const isFavorite = favoriteVendors.has(vendor.id);
                                    const isSpecial = vendor.featured || vendor.sponsor;
                                    
                                    return (
                                        <div
                                            key={vendor.id}
                                            className={`booth ${isSpecial ? 'booth-special' : ''} ${isFavorite ? 'booth-favorite' : ''}`}
                                            onClick={() => {
                                                // Show vendor details
                                                showStatus(`${vendor.name} - Booth ${vendor.booth}`, 'success');
                                            }}
                                            style={{
                                                '--booth-delay': `${index * 0.1}s`
                                            }}
                                        >
                                            <div className="booth-number">{vendor.booth}</div>
                                            <div className="booth-icon">{getLocationIcon(vendor.type)}</div>
                                            <div className="booth-name">{vendor.name}</div>
                                            {isSpecial && (
                                                <div className="booth-badge">
                                                    {vendor.featured ? '🌟' : '⭐'}
                                                </div>
                                            )}
                                            {isFavorite && (
                                                <div className="booth-heart">❤️</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Stage/Presentation Area */}
                            <div className="gymnasium-stage">
                                <span>🎤 Presentation Stage</span>
                            </div>
                            
                            {/* Food Court */}
                            <div className="gymnasium-food-court">
                                <span>🍕 Food Court</span>
                            </div>
                            
                            {/* Registration */}
                            <div className="gymnasium-registration">
                                <span>📝 Registration</span>
                            </div>
                        </div>
                        
                        {/* Legend */}
                        <div className="gymnasium-legend">
                            <div className="legend-item">
                                <div className="legend-booth booth-normal"></div>
                                <span>Regular Vendor</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-booth booth-special"></div>
                                <span>Sponsor</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-booth booth-favorite"></div>
                                <span>Your Favorites</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="kids-expo-vendor-list">
                    <h3>
                        Expo Vendors ({filteredLocations.length})
                        {selectedCategory !== 'all' && (
                            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
                                - Filtered by {selectedCategory}
                            </span>
                        )}
                    </h3>
                    <div>
                        {filteredLocations.length === 0 ? (
                            <div style={{
                                textAlign: 'center', 
                                padding: '40px', 
                                color: '#666',
                                fontStyle: 'italic'
                            }}>
                                No vendors found for the selected category.
                            </div>
                        ) : (
                            filteredLocations.map((vendor, index) => (
                                <div key={vendor.id || index} className="kids-expo-vendor-item">
                                    <div className="kids-expo-vendor-info">
                                        <div className="kids-expo-vendor-name">
                                            {getLocationIcon(vendor.type)} {vendor.name}
                                            {vendor.featured && (
                                                <span style={{color: '#ffc107', marginLeft: '8px'}}>🌟</span>
                                            )}
                                            {vendor.sponsor && (
                                                <span style={{color: '#4a90e2', marginLeft: '8px'}}>⭐</span>
                                            )}
                                            <button
                                                onClick={() => toggleFavorite(vendor.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    fontSize: '16px',
                                                    marginLeft: '8px',
                                                    cursor: 'pointer'
                                                }}
                                                title={favoriteVendors.has(vendor.id) ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                {favoriteVendors.has(vendor.id) ? '❤️' : '🤍'}
                                            </button>
                                        </div>
                                        <div className="kids-expo-vendor-booth">Booth: {vendor.booth}</div>
                                        
                                        {vendor.category && (
                                            <div style={{
                                                fontSize: '12px', 
                                                color: '#4a90e2', 
                                                marginTop: '2px',
                                                fontWeight: 'bold'
                                            }}>
                                                {vendor.category}
                                            </div>
                                        )}
                                        
                                        {vendor.description && (
                                            <div style={{
                                                fontSize: '14px', 
                                                color: '#888', 
                                                marginTop: '4px',
                                                lineHeight: '1.4'
                                            }}>
                                                {vendor.description}
                                            </div>
                                        )}

                                        {vendor.services && vendor.services.length > 0 && (
                                            <div style={{
                                                fontSize: '12px', 
                                                color: '#666', 
                                                marginTop: '6px',
                                                fontStyle: 'italic'
                                            }}>
                                                Services: {vendor.services.slice(0, 3).join(', ')}
                                                {vendor.services.length > 3 && '...'}
                                            </div>
                                        )}
                                        
                                        <div style={{
                                            display: 'flex', 
                                            flexWrap: 'wrap', 
                                            gap: '12px', 
                                            marginTop: '8px'
                                        }}>
                                            {vendor.phone && (
                                                <div style={{fontSize: '12px', color: '#666'}}>
                                                    📞 {vendor.phone}
                                                </div>
                                            )}
                                            {vendor.website && (
                                                <a 
                                                    href={vendor.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        fontSize: '12px', 
                                                        color: '#4a90e2',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    🌐 Website
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="kids-expo-vendor-actions">
                                        <button 
                                            className="kids-expo-btn kids-expo-btn-primary kids-expo-btn-small"
                                            onClick={() => {
                                                if (!config.DEMO_MODE && map) {
                                                    map.setCenter({ lat: vendor.lat, lng: vendor.lng });
                                                    map.setZoom(19);
                                                    showStatus(`Focusing on ${vendor.name}`, 'success');
                                                } else {
                                                    showStatus(`Booth: ${vendor.booth}`, 'success');
                                                }
                                            }}
                                        >
                                            Find Booth
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Favorites Section */}
                {favoriteVendors.size > 0 && (
                    <div className="favorites-section">
                        <h3>❤️ Your Favorite Vendors ({favoriteVendors.size})</h3>
                        <div className="favorites-list">
                            {locations
                                .filter(vendor => favoriteVendors.has(vendor.id))
                                .map(vendor => (
                                    <div key={vendor.id} className="favorite-item">
                                        <span>{getLocationIcon(vendor.type)} {vendor.name}</span>
                                        <span style={{ fontSize: '12px', color: '#666' }}>Booth: {vendor.booth}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Sponsors Section */}
                <div className="sponsors-section">
                    <h3>🙏 Thank You to Our Sponsors</h3>
                    <div className="sponsors-grid">
                        {locations
                            .filter(vendor => vendor.sponsor)
                            .sort((a, b) => a.featured ? -1 : 1)
                            .map(sponsor => (
                                <div key={sponsor.id} className="sponsor-item">
                                    <div className="sponsor-name">
                                        {sponsor.featured && '⭐ Presenting Sponsor: '}
                                        {sponsor.name}
                                    </div>
                                    <div className="sponsor-category">{sponsor.category}</div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Event Info Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '30px',
                    padding: '20px',
                    background: 'rgba(74, 144, 226, 0.1)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: 'rgba(74, 144, 226, 0.8)'
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                        🎪 Horizon West Kids Expo
                    </div>
                    <div>📅 July 23rd • 🏟️ Gymnasium Layout</div>
                    <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
                        Your one-stop destination for all your children's needs
                    </div>
                    <div style={{marginTop: '10px', fontSize: '12px', opacity: 0.6}}>
                        Environment: {process.env.NODE_ENV} | Mode: {config.DEMO_MODE ? 'Demo' : 'Live'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KidsExpoMap;