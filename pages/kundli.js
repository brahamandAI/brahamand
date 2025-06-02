import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHead from './Head';
import Context from "@/context/Context";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import LeftDashboardSidebar from "@/components/Header/LeftDashboardSidebar"; 
import PopUpMobileMenu from "@/components/Header/PopUpMobileMenu"; 
import { Home } from 'react-feather';

const KundliPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    tob: '',
    pob: '',
    gender: '',
  });

  const [kundliResult, setKundliResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setLoading(true);
    setError(null);
    setKundliResult(null);
    
    // Validate place of birth has city, country format (contains a comma)
    if (!formData.pob.includes(',')) {
      setError('Place of birth must be in the format "City, Country" (e.g., "Delhi, India"). Please include both city and country separated by a comma.');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Submitting form data:', formData);
      
      // Call the API endpoint
      const response = await fetch('/api/kundli', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          dob: formData.dob,
          tob: formData.tob,
          pob: formData.pob,
          gender: formData.gender,
        }),
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!response.ok) {
        // Check for specific error types to provide better guidance
        if (data.error && data.error.includes("Could not find coordinates")) {
          throw new Error(`Place of birth not found: "${formData.pob}". Please provide a more specific location like "City, Country".`);
        } else if (data.error && data.error.includes("Error processing input file")) {
          throw new Error(`Error processing your data: ${data.error}`);
        } else if (data.details && data.details.includes("Unexpected end of JSON input")) {
          throw new Error("The server couldn't process your request. Please try again with a more specific location name.");
        } else if (data.details && data.details.includes("ValueError")) {
          throw new Error(`Invalid date or time format: ${data.details}`);
        } else {
          throw new Error(data.error || data.details || 'Failed to generate Kundli');
        }
      }
      
      // Validate the structure of the response
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from the API');
      }
      
      setKundliResult(data);
    } catch (err) {
      console.error('Error generating Kundli:', err);
      setError(err.message || 'An error occurred while generating the Kundli');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <PageHead title="Generate Kundli - Brahamand.ai" 
        description="Generate your Vedic Birth Chart (Kundli) online with detailed planetary positions, houses, dashas, and yogas."
        keywords="kundli, birth chart, vedic astrology, jyotish, horoscope, planets, houses, dashas, nakshatras"
      >
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <style jsx global>{`
          @media (max-width: 768px) {
            .table-responsive {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            .kundli-form-container input, 
            .kundli-form-container select {
              font-size: 16px !important; /* Prevents iOS zoom on focus */
            }
            .card-header h4 {
              font-size: 1.2rem;
            }
            .card {
              margin-bottom: 1rem;
            }
            .kundli-results {
              padding: 0;
            }
            .form-label {
              font-size: 0.95rem;
            }
            .form-text {
              font-size: 0.8rem;
            }
            .alert {
              padding: 0.75rem;
            }
            /* Fix for mobile tables */
            .table th, .table td {
              padding: 0.5rem;
              font-size: 0.9rem;
            }
            /* Improve touch targets */
            .btn {
              min-height: 44px;
            }
          }
        `}</style>
      </PageHead>

      <main className="page-wrapper rbt-dashboard-page">
        <Context>
          <div className="rbt-panel-wrapper">
            <HeaderDashboard display="d-none" />
            <PopUpMobileMenu />
            <LeftDashboardSidebar />

            <div className="rbt-main-content">
              <div className="rbt-daynamic-page-content">
                <div className="rbt-dashboard-content bg-color-white">
                  <div className="content-page pb--20">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h3 className="title" style={{ color: '#000' }}>Kundli Generator</h3>
                      <Link href="/" className="btn" style={{
                        background: 'linear-gradient(45deg, #3F51B5, #5677fd)',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 10px rgba(63, 81, 181, 0.2)',
                        fontWeight: '500'
                      }}>
                        <Home size={16} /> Home
                      </Link>
                    </div>
                    <div className="kundli-form-container" style={{ 
                      maxWidth: '100%', 
                      margin: '0 auto', 
                      background: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '12px', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      <form onSubmit={handleSubmit} autoComplete="on" noValidate>
                        
                        {/* Full Name */}
                        <div className="mb-4">
                          <label htmlFor="fullName" className="form-label fw-bold" style={{ color: '#000', marginBottom: '8px' }}>Full Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="fullName" 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            required 
                            style={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e0e0e0', 
                              padding: '12px 16px', 
                              fontSize: '14px', 
                              color: '#000',
                              WebkitAppearance: 'none' /* Improves iOS rendering */
                            }}
                          />
                          <small className="form-text text-muted">Optional, but good for personalization.</small>
                        </div>

                        {/* Date of Birth */}
                        <div className="mb-4">
                          <label htmlFor="dob" className="form-label fw-bold" style={{ color: '#000', marginBottom: '8px' }}>Date of Birth</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            id="dob" 
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            required 
                            style={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e0e0e0', 
                              padding: '12px 16px', 
                              fontSize: '14px', 
                              color: '#000',
                              WebkitAppearance: 'none'
                            }}
                          />
                           <small className="form-text text-muted">Format: YYYY-MM-DD or select from calendar.</small>
                        </div>

                        {/* Time of Birth */}
                        <div className="mb-4">
                          <label htmlFor="tob" className="form-label fw-bold" style={{ color: '#000', marginBottom: '8px' }}>Time of Birth</label>
                          <input 
                            type="time" 
                            className="form-control" 
                            id="tob" 
                            name="tob"
                            value={formData.tob}
                            onChange={handleChange}
                            required 
                            step="60" // Allows HH:MM selection
                            style={{ borderRadius: '8px', border: '1px solid #e0e0e0', padding: '12px 16px', fontSize: '14px', color: '#000' }}
                          />
                          <small className="form-text text-muted">Format: HH:MM AM/PM or 24-hour. Precision is important.</small>
                        </div>

                        {/* Place of Birth */}
                        <div className="mb-4">
                          <label htmlFor="pob" className="form-label fw-bold" style={{ color: '#000', marginBottom: '8px' }}>
                            Place of Birth <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="pob" 
                            name="pob"
                            value={formData.pob}
                            onChange={handleChange}
                            placeholder="Enter city, country (e.g., Delhi, India)"
                            required 
                            style={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e0e0e0', 
                              padding: '12px 16px', 
                              fontSize: '14px', 
                              color: '#000' 
                            }}
                          />
                          <small className="form-text" style={{ 
                            color: '#d32f2f', 
                            fontWeight: '500',
                            backgroundColor: '#ffebee',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            display: 'block',
                            marginTop: '8px'
                          }}>
                            <strong>⚠️ Important:</strong> Always include both city AND country separated by a comma (e.g., "Delhi, India" not just "Delhi")
                          </small>
                          <small className="form-text text-muted d-block mt-1">
                            We'll use this to find coordinates and time zone.
                          </small>
                        </div>

                        {/* Gender (Optional) */}
                        <div className="mb-4">
                          <label className="form-label fw-bold d-block" style={{ color: '#000', marginBottom: '8px' }}>Gender (Optional)</label>
                          <div className="form-check form-check-inline">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="gender" 
                              id="male" 
                              value="Male"
                              checked={formData.gender === 'Male'}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="male" style={{ color: '#000' }}>Male</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="gender" 
                              id="female" 
                              value="Female"
                              checked={formData.gender === 'Female'}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="female" style={{ color: '#000' }}>Female</label>
                          </div>
                           <div className="form-check form-check-inline">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="gender" 
                              id="other" 
                              value="Other"
                              checked={formData.gender === 'Other'}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="other" style={{ color: '#000' }}>Other</label>
                          </div>
                        </div>

                        {/* Time Zone Info */}
                        <div className="mb-4 alert alert-info" role="alert" style={{ fontSize: '13px', backgroundColor: '#e3f2fd', borderColor: '#bde0fe', color: '#0c5460' }}>
                          <strong>Note:</strong> Time Zone / UTC Offset will be automatically calculated based on your Place of Birth and Date of Birth.
                        </div>

                        {/* Submit Button */}
                        <div className="text-center mt-4">
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                              borderRadius: '8px',
                              background: 'linear-gradient(45deg, #3F51B5, #5677fd)',
                              border: 'none',
                              padding: '12px 30px',
                              fontWeight: '500',
                              fontSize: '16px'
                            }}
                          >
                            {loading ? 'Generating...' : 'Generate Kundli'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Loading Indicator */}
                    {loading && (
                      <div className="text-center mt-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Generating your kundli chart. This may take a moment...</p>
                      </div>
                    )}

                    {/* Error Display */}
                    {error && (
                      <div className="alert alert-danger mt-4" role="alert">
                        <h4 className="alert-heading">Error!</h4>
                        <p>{error}</p>
                        
                        {/* Display helpful tips based on error message */}
                        {error.includes("Place of birth not found") && (
                          <div className="mt-3">
                            <h5>Suggestions:</h5>
                            <ul>
                              <li>Make sure the place name is spelled correctly</li>
                              <li>Add country name for better accuracy (e.g., "New York, USA" instead of just "New York")</li>
                              <li>Try a larger nearby city if your location is very small</li>
                            </ul>
                          </div>
                        )}
                        
                        {error.includes("date or time format") && (
                          <div className="mt-3">
                            <h5>Suggestions:</h5>
                            <ul>
                              <li>Date should be in YYYY-MM-DD format</li>
                              <li>Time should be in 24-hour format (HH:MM)</li>
                              <li>Make sure the date entered is valid</li>
                            </ul>
                          </div>
                        )}
                        
                        {error.includes("Error generating kundli") && !error.includes("Place of birth not found") && !error.includes("date or time format") && (
                          <div className="mt-3">
                            <h5>Suggestions:</h5>
                            <ul>
                              <li>Check your internet connection</li>
                              <li>Try again in a few minutes</li>
                              <li>If the problem persists, try a different place of birth or date/time</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Kundli Results Display */}
                    {kundliResult && !loading && !error && (
                      <div className="kundli-results mt-4 mt-md-5">
                        <h3 className="text-center mb-3 mb-md-4" style={{ fontSize: '1.5rem' }}>
                          Kundli Chart for {kundliResult.personalInfo?.fullName || 'Your Birth Chart'}
                        </h3>
                        
                        <div className="card mb-4">
                          <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">Basic Information</h4>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-6">
                                <p><strong>Name:</strong> {kundliResult.personalInfo?.fullName || 'Not specified'}</p>
                                <p><strong>Date of Birth:</strong> {kundliResult.personalInfo?.dateOfBirth || 'Not available'}</p>
                                <p><strong>Time of Birth:</strong> {kundliResult.personalInfo?.timeOfBirth || 'Not available'}</p>
                              </div>
                              <div className="col-md-6">
                                <p><strong>Place of Birth:</strong> {kundliResult.personalInfo?.placeOfBirth || 'Not available'}</p>
                                <p><strong>Latitude:</strong> {kundliResult.personalInfo?.coordinates?.lat || 'Not available'}</p>
                                <p><strong>Longitude:</strong> {kundliResult.personalInfo?.coordinates?.lng || 'Not available'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          {kundliResult.ascendant && (
                            <div className="col-12 col-md-6 mb-4">
                              <div className="card h-100">
                                <div className="card-header bg-primary text-white">
                                  <h4 className="mb-0">Ascendant (Lagna)</h4>
                                </div>
                                <div className="card-body">
                                  <p><strong>Sign:</strong> {kundliResult.ascendant || 'Not available'}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {kundliResult.planets && kundliResult.planets.length > 0 && (
                            <div className="col-12 col-md-6 mb-4">
                              <div className="card h-100">
                                <div className="card-header bg-primary text-white">
                                  <h4 className="mb-0">Planetary Positions</h4>
                                </div>
                                <div className="card-body">
                                  <div className="table-responsive" style={{ minHeight: '200px' }}>
                                    <table className="table table-striped">
                                      <thead>
                                        <tr>
                                          <th>Planet</th>
                                          <th>Sign</th>
                                          <th>House</th>
                                          <th>Nakshatra</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {kundliResult.planets.map((planet, index) => (
                                          <tr key={index}>
                                            <td>{planet.name}</td>
                                            <td>{planet.sign || 'Not available'}</td>
                                            <td>{planet.house || 'Not available'}</td>
                                            <td>{planet.nakshatra || 'Not available'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {kundliResult.houses && kundliResult.houses.length > 0 && (
                          <div className="card mb-4">
                            <div className="card-header bg-primary text-white">
                              <h4 className="mb-0">Houses</h4>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                {kundliResult.houses.map((house, index) => (
                                  <div className="col-12 col-sm-6 col-lg-4 mb-3" key={index}>
                                    <div className="card h-100">
                                      <div className="card-header">
                                        <h5 className="mb-0">House {house.house}</h5>
                                      </div>
                                      <div className="card-body">
                                        <p><strong>Sign:</strong> {house.sign || 'Not available'}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {kundliResult.doshas && (
                          <div className="card mb-4">
                            <div className="card-header bg-primary text-white">
                              <h4 className="mb-0">Doshas</h4>
                            </div>
                            <div className="card-body">
                              <ul className="list-group">
                                {kundliResult.doshas.mangalDosha !== undefined && (
                                  <li className="list-group-item">
                                    <strong>Mangal Dosha:</strong> {kundliResult.doshas.mangalDosha ? 'Present' : 'Not Present'}
                                  </li>
                                )}
                                {kundliResult.doshas.kaalSarpaDosha !== undefined && (
                                  <li className="list-group-item">
                                    <strong>Kaal Sarpa Dosha:</strong> {kundliResult.doshas.kaalSarpaDosha ? 'Present' : 'Not Present'}
                                    {kundliResult.doshas.kaalSarpaDosha_type && (
                                      <span> (Type: {kundliResult.doshas.kaalSarpaDosha_type})</span>
                                    )}
                                  </li>
                                )}
                                {kundliResult.doshas.sadeSati !== undefined && (
                                  <li className="list-group-item">
                                    <strong>Sade Sati:</strong> {kundliResult.doshas.sadeSati ? `Present (${kundliResult.doshas.sadeSatiPhase})` : 'Not Present'}
                                  </li>
                                )}
                                {kundliResult.doshas.grahanDosha !== undefined && (
                                  <li className="list-group-item">
                                    <strong>Grahan Dosha:</strong> {kundliResult.doshas.grahanDosha ? 'Present' : 'Not Present'}
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}

                        {kundliResult.interpretation && (
                          <div className="card mb-4">
                            <div className="card-header bg-primary text-white">
                              <h4 className="mb-0">Interpretation</h4>
                            </div>
                            <div className="card-body">
                              {kundliResult.interpretation.personality && (
                                <p><strong>Personality:</strong> {kundliResult.interpretation.personality}</p>
                              )}
                              {kundliResult.interpretation.emotions && (
                                <p><strong>Emotions:</strong> {kundliResult.interpretation.emotions}</p>
                              )}
                              {kundliResult.interpretation.nakshatra && (
                                <p><strong>Nakshatra Influence:</strong> {kundliResult.interpretation.nakshatra}</p>
                              )}
                              {kundliResult.interpretation.ascendant && (
                                <p><strong>Ascendant:</strong> {kundliResult.interpretation.ascendant}</p>
                              )}
                              {kundliResult.interpretation.lifeThemes && (
                                <p><strong>Life Themes:</strong> {kundliResult.interpretation.lifeThemes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {kundliResult.interpretation && kundliResult.interpretation.keyPlanetaryPositions && (
                          <div className="card mb-4">
                            <div className="card-header bg-primary text-white">
                              <h4 className="mb-0">Key Planetary Positions</h4>
                            </div>
                            <div className="card-body">
                              <ul className="list-group">
                                {kundliResult.interpretation.keyPlanetaryPositions.map((position, index) => (
                                  <li className="list-group-item" key={index}>{position}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {kundliResult.interpretation && kundliResult.interpretation.noteableAspects && (
                          <div className="card mb-4">
                            <div className="card-header bg-primary text-white">
                              <h4 className="mb-0">Notable Aspects</h4>
                            </div>
                            <div className="card-body">
                              <ul className="list-group">
                                {kundliResult.interpretation.noteableAspects.map((aspect, index) => (
                                  <li className="list-group-item" key={index}>{aspect}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {kundliResult.disclaimer && (
                          <div className="alert alert-info text-center mt-4" role="alert">
                            {kundliResult.disclaimer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Context>
      </main>

      {showScrollTop && (
        <button 
          onClick={scrollToTop} 
          className="scroll-to-top"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#3F51B5',
            color: 'white',
            border: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px'
          }}
        >
          ↑
        </button>
      )}
    </>
  );
};

export default KundliPage; 