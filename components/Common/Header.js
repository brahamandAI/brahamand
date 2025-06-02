import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="main-header">
      <div className="container-fluid">
        <div className="header-content">
          <div className="header-left">
            <Link href="/" className="home-link">
              <i className="fa-solid fa-home"></i>
              <span>Home</span>
            </Link>
          </div>
          <div className="header-right">
            {user ? (
              <button onClick={logout} className="auth-button signout-btn">
                <i className="fa-solid fa-sign-out-alt"></i>
                <span>Sign Out</span>
              </button>
            ) : (
              <>
                <Link href="/signin" className="auth-button signin-btn">
                  <i className="fa-solid fa-sign-in-alt"></i>
                  <span>Sign In</span>
                </Link>
                <Link href="/signup" className="auth-button signup-btn">
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-header {
          background: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .home-link,
        .auth-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .home-link {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .home-link:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .header-right {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .auth-button {
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .signin-btn {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .signin-btn:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .signup-btn {
          color: white;
          background: #3b82f6;
        }

        .signup-btn:hover {
          background: #2563eb;
        }

        .signout-btn {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .signout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        i {
          font-size: 1rem;
        }
      `}</style>
    </header>
  );
};

export default Header; 