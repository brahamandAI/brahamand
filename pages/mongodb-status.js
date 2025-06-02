import React, { useState, useEffect } from "react";
import PageHead from "./Head";
import Context from "@/context/Context";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import LeftDashboardSidebar from "@/components/Header/LeftDashboardSidebar";
import Link from "next/link";
import { Home, Database, CheckCircle, XCircle, RefreshCw, Code, Server, GitBranch } from 'react-feather';

const MongoDBStatusPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkMongoDBStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-mongodb');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error("Error checking MongoDB status:", err);
      setError(err.message || "Failed to check MongoDB status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMongoDBStatus();
  }, []);

  const renderStatus = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Checking MongoDB connection...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger p-4 rounded-4">
          <h4 className="alert-heading d-flex align-items-center">
            <XCircle className="me-2" /> Connection Error
          </h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">Please check your network connection and try again.</p>
        </div>
      );
    }

    if (status) {
      if (status.success) {
        return (
          <div className="alert alert-success p-4 rounded-4">
            <h4 className="alert-heading d-flex align-items-center">
              <CheckCircle className="me-2" /> MongoDB Connection Successful
            </h4>
            <p>Successfully connected to MongoDB and verified access to the database.</p>
            <hr />
            <div className="row">
              <div className="col-md-6">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-0">
                    <span><Database className="me-2" size={16} /> Database:</span>
                    <span className="badge bg-success rounded-pill">{status.database}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-0">
                    <span><Code className="me-2" size={16} /> Articles:</span>
                    <span className="badge bg-primary rounded-pill">{status.articleCount}</span>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-0">
                    <span><Server className="me-2" size={16} /> URI:</span>
                    <span className="badge bg-secondary rounded-pill">{status.mongodb_uri}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="alert alert-danger p-4 rounded-4">
            <h4 className="alert-heading d-flex align-items-center">
              <XCircle className="me-2" /> MongoDB Connection Failed
            </h4>
            <p>{status.error?.message || "Unknown error occurred"}</p>
            {status.error?.hint && (
              <>
                <hr />
                <p className="mb-0"><strong>Hint:</strong> {status.error.hint}</p>
              </>
            )}
            <hr />
            <div className="bg-light p-3 rounded">
              <h5 className="mb-3">Troubleshooting Steps:</h5>
              <ol className="ps-3">
                <li className="mb-2">Check if MongoDB is running on your machine or server</li>
                <li className="mb-2">Verify your MongoDB connection string: <code>{status.mongodb_uri}</code></li>
                <li className="mb-2">Make sure the 'news_db' database exists</li>
                <li className="mb-2">Ensure your network/firewall allows connections to MongoDB</li>
                <li className="mb-2">If using MongoDB Atlas, check if your IP is whitelisted</li>
              </ol>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  const renderFastAPIStatus = () => {
    return (
      <div className="card shadow-sm rounded-4 p-4 mt-4">
        <h5 className="card-title">FastAPI Service Status</h5>
        <div className="card-body p-0">
          <p>To use the Live News feature, you need:</p>
          <ol>
            <li>A running MongoDB server with proper connection</li>
            <li>A running FastAPI service that connects to MongoDB</li>
          </ol>
          <div className="bg-light p-3 rounded mt-3">
            <h6>FastAPI Service Setup:</h6>
            <ol>
              <li>Make sure Python and pip are installed</li>
              <li>Install required packages: <code>pip install fastapi uvicorn motor beautifulsoup4 httpx apscheduler</code></li>
              <li>Run the FastAPI service: <code>uvicorn main:app --reload</code></li>
              <li>The service should be running at: <code>http://localhost:8000</code></li>
            </ol>
            <p className="mb-0">
              <GitBranch size={16} className="me-1" /> Your FastAPI code is configured to use the database: <code>news_db</code> and collection: <code>articles</code>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHead title="MongoDB Status - AI Tools" />

      <main className="page-wrapper rbt-dashboard-page">
        <Context>
          <div className="rbt-panel-wrapper">
            <HeaderDashboard display="d-none" />
            <PopupMobileMenu />
            <LeftDashboardSidebar />

            <div className="rbt-main-content">
              <div className="rbt-daynamic-page-content">
                <div className="rbt-dashboard-content bg-color-white">
                  <div className="content-page pb--20">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h3 className="title">MongoDB Connection Status</h3>
                      <div className="d-flex gap-2">
                        <button 
                          onClick={checkMongoDBStatus} 
                          className="btn btn-outline-primary"
                          disabled={loading}
                        >
                          <RefreshCw size={16} className={`me-2 ${loading ? 'spin' : ''}`} /> 
                          {loading ? 'Checking...' : 'Recheck'}
                        </button>
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
                    </div>
                    
                    <p className="mb-4">
                      This page helps you diagnose connection issues with MongoDB that may affect the Live News feature.
                    </p>
                    
                    <style jsx>{`
                      .spin {
                        animation: spinner 1s linear infinite;
                      }
                      @keyframes spinner {
                        to {transform: rotate(360deg);}
                      }
                    `}</style>

                    {renderStatus()}
                    {renderFastAPIStatus()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Context>
      </main>
    </>
  );
};

export default MongoDBStatusPage; 