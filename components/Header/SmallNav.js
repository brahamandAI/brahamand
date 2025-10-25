import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { 
  FaHome, 
  FaCreditCard, 
  FaFileAlt, 
  FaCloudSun, 
  FaNewspaper, 
  FaChartLine,
  FaBell,
  FaFileContract,
  FaCog,
  FaQuestionCircle,
  FaPlusCircle
} from "react-icons/fa";

import SmallNavItem from "../../data/header.json";

// Simplified icon component
const SimpleIcon = ({ children }) => (
  <span style={{ marginRight: "10px", display: "inline-flex" }}>
    {children}
  </span>
);

// Get icon based on text or image path
const getSmallNavIcon = (data) => {
  if (data.img.includes("document")) return <FaFileAlt />;
  if (data.img.includes("weather")) return <FaCloudSun />;
  if (data.img.includes("news")) return <FaNewspaper />;
  if (data.img.includes("stocks")) return <FaChartLine />;
  return null;
};

// CSS-based nav link (faster)
const SmallNavLink = ({ data, isActive }) => {
  return (
    <div className="small-nav-hover-wrapper">
      <Link
        className={`small-nav-hover-item ${
          isActive(data.link)
            ? "active"
            : "" || data.isDisable
            ? "disabled"
            : ""
        }`}
        href={data.link}
        style={{ display: "flex", alignItems: "center" }}
      >
        <SimpleIcon>
          {getSmallNavIcon(data) || (
            <Image
              src={data.img}
              width={35}
              height={35}
              alt="AI Generator"
            />
          )}
        </SimpleIcon>
        <span>{data.text}</span>
        {data.badge !== "" ? (
          <div className="rainbow-badge-card badge-sm ml--10">
            {data.badge}
          </div>
        ) : (
          ""
        )}
      </Link>
    </div>
  );
};

// CSS-based setting nav link
const SettingNavLink = ({ href, icon, text }) => {
  // Map icon string to React Icons
  const getIconComponent = (iconName) => {
    switch(iconName) {
      case "monitor": return <FaHome />;
      case "briefcase": return <FaCreditCard />;
      case "bell": return <FaBell />;
      case "file-text": return <FaFileContract />;
      default: return <FaCog />;
    }
  };
  
  return (
    <div className="small-nav-hover-wrapper">
      <Link 
        href={href}
        className="small-nav-hover-item"
        style={{ display: "flex", alignItems: "center" }}
      >
        <SimpleIcon>
          {getIconComponent(icon)}
        </SimpleIcon>
        <span>{text}</span>
      </Link>
    </div>
  );
};

const SmallNav = () => {
  const router = useRouter();
  const isActive = (href) => router.pathname === href;
  
  return (
    <>
      <style jsx global>{`
        .small-nav-hover-wrapper .small-nav-hover-item {
          transition: transform 0.15s ease, translate 0.15s ease, color 0.15s ease;
          color: inherit;
        }
        .small-nav-hover-wrapper:hover .small-nav-hover-item {
          transform: scale(1.05);
          translate: 5px 0;
          color: #1e90ff !important;
        }
        .small-nav-hover-wrapper:hover svg {
          color: #1e90ff !important;
        }
      `}</style>
      <nav className="mainmenu-nav">
        <ul className="dashboard-mainmenu rbt-default-sidebar-list">
          <li>
            <SettingNavLink href="/dashboard" icon="monitor" text="Welcome" />
          </li>
          <li>
            <SettingNavLink href="/plans-billing" icon="briefcase" text="Manage Subsription" />
          </li>
        </ul>
        <div className="rbt-sm-separator"></div>
        <ul className="dashboard-mainmenu rbt-default-sidebar-list">
          {SmallNavItem &&
            SmallNavItem.smallNavItem.slice(0, 7).map((data, index) => (
              <li key={index}>
                <SmallNavLink data={data} isActive={isActive} />
              </li>
            ))}
        </ul>
        <div className="rbt-sm-separator"></div>
        <div className="mainmenu-nav">
          <ul className="dashboard-mainmenu rbt-default-sidebar-list">
            <li className="has-submenu">
              <div className="small-nav-hover-wrapper">
                <a
                  className="collapse-btn collapsed small-nav-hover-item"
                  data-bs-toggle="collapse"
                  href="#collapseExampleMenu"
                  role="button"
                  aria-expanded="false"
                  aria-controls="collapseExampleMenu"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <SimpleIcon>
                    <FaPlusCircle />
                  </SimpleIcon>
                  <span>Setting</span>
                </a>
              </div>
              <div className="collapse" id="collapseExampleMenu">
                <ul className="submenu rbt-default-sidebar-list">
                  {SmallNavItem &&
                    SmallNavItem.smallNavItem
                      .slice(7, 14)
                      .map((data, index) => (
                        <li key={index}>
                          <SettingNavLink 
                            href={data.link} 
                            icon={data.icon} 
                            text={data.text} 
                          />
                        </li>
                      ))}
                </ul>
              </div>
            </li>
            <li>
              <div className="small-nav-hover-wrapper">
                <a 
                  href="#"
                  className="small-nav-hover-item"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <SimpleIcon>
                    <FaQuestionCircle />
                  </SimpleIcon>
                  <span>Help & FAQ</span>
                </a>
              </div>
            </li>
          </ul>

          <div className="rbt-sm-separator"></div>
          <ul className="dashboard-mainmenu rbt-default-sidebar-list">
            <li>
              <SettingNavLink href="/release-notes" icon="bell" text="Release notes" />
            </li>
            <li>
              <SettingNavLink href="/terms-policy" icon="briefcase" text="Terms & Policy" />
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default SmallNav;
