import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Cloud, FileText, BarChart2, Globe, Settings, Star, Home, Briefcase, Youtube, Activity} from 'react-feather';

import avatar from "../../public/images/team/team-01sm.jpg";
import light from "../../public/images/light/switch/sun-01.svg";
import dark from "../../public/images/light/switch/vector.svg";
import playApp from "../../public/images/cta-img/play-app.png";
import appleApp from "../../public/images/cta-img/apple-app.png";

import SmallNavItem from "../../data/header.json";
import { useAppContext } from "@/context/Context";

const LeftSidebar = () => {
  const router = useRouter();
  const { shouldCollapseLeftbar, setShouldCollapseLeftbar, isLightTheme, toggleTheme } = useAppContext();
  const sidebarRef = useRef(null);
  const isActive = (path) => {
    return router.pathname === path;
  };

  const handleClickOutside = (event) => {
    if (event.target.closest('.popup-dashboardleft-btn')) return;
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setShouldCollapseLeftbar(true);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentPath = router.pathname;

  const handleToolClick = (e, path) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className={`rbt-left-panel popup-dashboardleft-section ${
          shouldCollapseLeftbar ? "collapsed" : ""
        }`}
      >
        <div className="rbt-default-sidebar sticky-top rbt-shadow-box rbt-gradient-border">
          <div className="sidebar-mobile-header d-block d-lg-none">
            <span className="sidebar-mobile-title">Menu</span>
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setShouldCollapseLeftbar(true)}
              aria-label="Close menu"
            >
              <i className="fa-sharp fa-regular fa-x"></i>
            </button>
          </div>
          <div className="inner">
            <div className="content-item-content">
              <div className="rbt-default-sidebar-wrapper" style={{
                scrollbarWidth: 'thin',
                msOverflowStyle: 'auto',
                scrollbarColor: '#666 #eee',
                maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto'
              }}>
                <style jsx>{`
                  .rbt-default-sidebar-wrapper::-webkit-scrollbar {
                    display: block;
                    width: 8px;
                  }
                  .rbt-default-sidebar-wrapper::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                  }
                  .rbt-default-sidebar-wrapper::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                  }
                  .rbt-default-sidebar-wrapper::-webkit-scrollbar-thumb:hover {
                    background: #555;
                  }
                `}</style>
                <nav className="mainmenu-nav">
                  <ul className="dashboard-mainmenu">
                    <li className={currentPath === '/' ? 'active' : ''}>
                      <Link href="/" className="d-flex align-items-center">
                        <Home size={18} className="me-2" />
                        <span>Home</span>
                      </Link>
                    </li>
                    {/* Comment out YouTube Summarizer navigation item
                    <li className={currentPath === '/youtube-summarizer' ? 'active' : ''}>
                      <Link href="/youtube-summarizer" className="d-flex align-items-center">
                        <Youtube size={18} className="me-2" />
                        <span>YouTube Summarizer</span>
                      </Link>
                    </li>
                    */}
                    <li className={currentPath === '/weather-forecast' ? 'active' : ''}>
                      <Link href="/weather-forecast" className="d-flex align-items-center">
                        <Cloud size={18} className="me-2" />
                        <span>Weather</span>
                      </Link>
                    </li>
                    <li className={currentPath === '/pdf-analysis' ? 'active' : ''}>
                      <Link href="/pdf-analysis" className="d-flex align-items-center">
                        <FileText size={18} className="me-2" />
                        <span>PDF Analysis</span>
                      </Link>
                    </li>
                    <li className={currentPath === '/news-updates' ? 'active' : ''}>
                      <Link href="/news-updates" className="d-flex align-items-center">
                        <Globe size={18} className="me-2" />
                        <span>News</span>
                      </Link>
                    </li>
                    <li className={currentPath === '/live-news' ? 'active' : ''}>
                      <Link href="/live-news" className="d-flex align-items-center" onClick={(e) => handleToolClick(e, '/live-news')}>
                        <Activity size={18} className="me-2" />
                        <span>Live News</span>
                      </Link>
                    </li>
                    <li className={currentPath === '/stock-market' ? 'active' : ''}>
                      <Link href="/stock-market" className="d-flex align-items-center">
                        <BarChart2 size={18} className="me-2" />
                        <span>Stock Market</span>
                      </Link>
                    </li>
                    <li className={currentPath === '/kundli' ? 'active' : ''}>
                      <Link href="/kundli" className="d-flex align-items-center">
                        <Star size={18} className="me-2" />
                        <span>Kundli</span>
                      </Link>
                    </li>
                    <li className="nav-divider" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', margin: '8px 0' }}></li>
                    <li className={currentPath === '/settings' ? 'active' : ''}>
                      <Link href="/settings" className="d-flex align-items-center">
                        <Settings size={18} className="me-2" />
                        <span>Settings</span>
                      </Link>
                    </li>
                    <li className={currentPath === '/favorites' ? 'active' : ''}>
                      <Link href="/favorites" className="d-flex align-items-center">
                        <Star size={18} className="me-2" />
                        <span>Favorites</span>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        

          <div className="subscription-box" style={{background:'#EFEFFF !important'}}>
          <div className="app-store-btn d-flex gap-2 p-2 justify-content-center">
                  <Link className="store-btn" href="https://play.google.com/store/apps/details?id=co.median.android.xlrmlbo" target="_blank" rel="noopener noreferrer">
                    <Image
                      src={playApp}
                      width={117}
                      height={55}
                      alt="Play Store Button"
                    />
                  </Link>
                  <Link className="store-btn" href="#">
                    <Image
                      src={appleApp}
                      width={117}
                      height={55}
                      alt="Apple Store Button"
                    />
                  </Link>
                </div>
            <div className="inner">
              <Link href="/profile-details" className="autor-info">
                {/* <div className="author-img active">
                  <Image
                    className="w-100"
                    width={49}
                    height={48}
                    src={avatar}
                    alt="Author"
                  />
                </div> */}
                <div className="author-desc">
                  <h6>ब्रह्मांड AI</h6>
                  {/* <p>trentadam@net</p> */}
                </div>
                <div className="author-badge">Free</div>
              </Link>
            </div>
          </div>
          {/* <div className="switcher-btn-gr inner-switcher">
            <button
              className={`${isLightTheme ? "active" : ""}`}
              onClick={toggleTheme}
            >
              <Image src={dark} alt="Switcher Image" />
              <span className="text">Dark</span>
            </button>
            <button
              className={`${!isLightTheme ? "active" : ""}`}
              onClick={toggleTheme}
            >
              <Image src={light} alt="Switcher Image" />
              <span className="text">Light</span>
            </button>
          </div> */}
          <p className="subscription-copyright copyright-text text-center b3  small-text">
            © 2025
            <Link
              className="ps-2"
              href="#"
            >
              ब्रह्मांड AI
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
};

export default LeftSidebar;
