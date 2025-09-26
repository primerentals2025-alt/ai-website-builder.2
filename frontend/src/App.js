import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Components
const Header = ({ currentPage, setCurrentPage }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 cursor-pointer"
              onClick={() => setCurrentPage('home')}
            >
              Prime Real Estate
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'home' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('properties')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'properties' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Properties
            </button>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setCurrentPage('admin')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    currentPage === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Add Property
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentPage('login')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'login' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Admin Login
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                  currentPage === 'home' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentPage('properties');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                  currentPage === 'properties' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Properties
              </button>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setCurrentPage('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                      currentPage === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Add Property
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setCurrentPage('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                    currentPage === 'login' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const HomePage = ({ setCurrentPage }) => {
  const heroImages = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc1ODg3OTU5Nnww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjByZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc1ODg3OTU5Nnww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjByZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc1ODg3OTU5Nnww&ixlib=rb-4.1.0&q=85'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-r from-blue-900 to-blue-700 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
             style={{ backgroundImage: `url(${heroImages[0]})` }}></div>
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4">
          <div className="max-w-4xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6">
              Find Your Dream Home
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-200 px-4">
              Discover luxury properties with Prime Real Estate - Your trusted partner in finding the perfect home
            </p>
            <button
              onClick={() => setCurrentPage('properties')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors duration-300 transform hover:scale-105"
            >
              Browse Properties
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Prime Real Estate?</h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">We provide exceptional service and expertise in real estate</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Premium Properties</h3>
              <p className="text-gray-600 text-sm sm:text-base px-2">Carefully curated selection of luxury homes and prime locations</p>
            </div>
            
            <div className="text-center p-4 sm:p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Expert Guidance</h3>
              <p className="text-gray-600 text-sm sm:text-base px-2">Professional real estate agents with years of experience</p>
            </div>
            
            <div className="text-center p-4 sm:p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Trusted Service</h3>
              <p className="text-gray-600 text-sm sm:text-base px-2">Reliable and transparent process from start to finish</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Featured Properties</h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">Explore our stunning collection of premium real estate</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {heroImages.map((image, index) => (
              <div key={index} className="relative group overflow-hidden rounded-lg shadow-lg">
                <img
                  src={image}
                  alt={`Property ${index + 1}`}
                  className="w-full h-48 sm:h-56 lg:h-64 object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h4 className="text-base sm:text-lg font-semibold">Luxury Property</h4>
                  <p className="text-sm">Premium Location</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const PropertiesPage = ({ setSelectedProperty }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else {
        setError('Failed to fetch properties');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchProperties}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Properties</h1>
          <p className="text-xl text-gray-600">Discover your dream home from our exclusive collection</p>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No properties available</h3>
            <p className="text-gray-500 text-sm sm:text-base">Check back soon for new listings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-40 sm:h-48">
                  <img
                    src={property.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc1ODg3OTU5Nnww&ixlib=rb-4.1.0&q=85'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                    <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                      property.status === 'for_sale' ? 'bg-green-100 text-green-800' :
                      property.status === 'for_rent' ? 'bg-blue-100 text-blue-800' :
                      property.status === 'sold' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-2 text-sm sm:text-base">{property.description}</p>
                  
                  <div className="flex items-center text-gray-500 mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="text-xs sm:text-sm truncate">{property.location}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">{formatPrice(property.price)}</span>
                    <span className="text-xs sm:text-sm text-gray-500 capitalize">{property.property_type}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-4">
                    <span className="flex items-center justify-center sm:justify-start">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z"></path>
                      </svg>
                      <span className="hidden sm:inline">{property.bedrooms} beds</span>
                      <span className="sm:hidden">{property.bedrooms}bd</span>
                    </span>
                    <span className="flex items-center justify-center sm:justify-start">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M10.5 3L12 2l1.5 1H21l-3 7H6l-3-7h7.5z"></path>
                      </svg>
                      <span className="hidden sm:inline">{property.bathrooms} baths</span>
                      <span className="sm:hidden">{property.bathrooms}ba</span>
                    </span>
                    <span className="text-center sm:text-left">{property.square_footage} sqft</span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedProperty(property)}
                    className="w-full bg-blue-600 text-white py-2 sm:py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PropertyDetailPage = ({ property, onBack }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Properties
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-96 bg-gray-200">
            <img
              src={property.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc1ODg3OTU5Nnww&ixlib=rb-4.1.0&q=85'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                property.status === 'for_sale' ? 'bg-green-100 text-green-800' :
                property.status === 'for_rent' ? 'bg-blue-100 text-blue-800' :
                property.status === 'sold' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {property.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Details */}
              <div className="lg:col-span-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
                
                <div className="flex items-center text-gray-600 mb-6">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span className="text-sm sm:text-base">{property.location}</span>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{property.description}</p>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Amenities</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span className="text-gray-700 text-sm sm:text-base">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price and Details Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 lg:sticky lg:top-8">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4">{formatPrice(property.price)}</div>
                  
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Property Type:</span>
                      <span className="font-medium capitalize">{property.property_type}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Bathrooms:</span>
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Square Footage:</span>
                      <span className="font-medium">{property.square_footage} sqft</span>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <button className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base">
                      Contact Agent
                    </button>
                    <button className="w-full bg-gray-200 text-gray-800 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm sm:text-base">
                      Schedule Tour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminLogin = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage properties
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    square_footage: '',
    property_type: 'house',
    status: 'for_sale',
    amenities: '',
    images: ''
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (files) => {
    setUploading(true);
    const newUploadedImages = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          newUploadedImages.push({
            url: `${API_BASE_URL}${result.url}`,
            filename: result.filename,
            file: file
          });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      setUploadedImages(prev => [...prev, ...newUploadedImages]);
      setSuccess(`Successfully uploaded ${newUploadedImages.length} image(s)`);
    } catch (error) {
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeUploadedImage = async (index) => {
    const image = uploadedImages[index];
    try {
      await fetch(`${API_BASE_URL}/api/upload/${image.filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Combine uploaded images and URL images
      const allImages = [
        ...uploadedImages.map(img => img.url),
        ...(formData.images ? formData.images.split(',').map(i => i.trim()).filter(i => i) : [])
      ];

      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        square_footage: parseInt(formData.square_footage),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        images: allImages
      };

      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyData)
      });

      if (response.ok) {
        setSuccess('Property added successfully!');
        setFormData({
          title: '',
          description: '',
          price: '',
          location: '',
          bedrooms: '',
          bathrooms: '',
          square_footage: '',
          property_type: 'house',
          status: 'for_sale',
          amenities: '',
          images: ''
        });
        setUploadedImages([]);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add property');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Add New Property</h1>
          
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select
                  name="property_type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.property_type}
                  onChange={handleChange}
                >
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="villa">Villa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="for_sale">For Sale</option>
                  <option value="for_rent">For Rent</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.bedrooms}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  required
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage</label>
                <input
                  type="number"
                  name="square_footage"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.square_footage}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities (comma-separated)</label>
              <input
                type="text"
                name="amenities"
                placeholder="e.g., Pool, Garage, Garden, Fireplace"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.amenities}
                onChange={handleChange}
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
              
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop images here, or{' '}
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      browse files
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images ({uploadedImages.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="mt-2 text-sm text-blue-600">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading images...
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Image URLs (optional, comma-separated)</label>
              <textarea
                name="images"
                rows={2}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.images}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Adding Property...' : 'Add Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProperty, setSelectedProperty] = useState(null);

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    setCurrentPage('property-detail');
  };

  const handleBackToProperties = () => {
    setSelectedProperty(null);
    setCurrentPage('properties');
  };

  const handleLoginSuccess = () => {
    setCurrentPage('home');
  };

  const renderCurrentPage = () => {
    if (selectedProperty && currentPage === 'property-detail') {
      return <PropertyDetailPage property={selectedProperty} onBack={handleBackToProperties} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;
      case 'properties':
        return <PropertiesPage setSelectedProperty={handlePropertySelect} />;
      case 'login':
        return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <div className="App">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        {renderCurrentPage()}
      </div>
    </AuthProvider>
  );
}

export default App;