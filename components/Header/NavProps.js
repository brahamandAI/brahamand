import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { FaLaptopCode, FaFileAlt, FaCloudSun, FaNewspaper, FaChartLine } from "react-icons/fa";

// Get icon for menu item
const getItemIcon = (text) => {
  // These are just examples, adjust based on your actual menu items
  if (text.includes("Code") || text.includes("HTML")) return <FaLaptopCode className="me-2" />;
  if (text.includes("PDF")) return <FaFileAlt className="me-2" />;
  if (text.includes("Weather")) return <FaCloudSun className="me-2" />;
  if (text.includes("News")) return <FaNewspaper className="me-2" />;
  if (text.includes("Stock")) return <FaChartLine className="me-2" />;
  return null;
};

// CSS-based mega menu item (faster)
const MegaMenuItem = ({ item, isActive }) => {
  return (
    <div className="mega-hover-wrapper">
      <Link
        className={`mega-hover-item ${item.isComing ? "disabled" : ""} ${
          isActive(item.link) ? "active" : ""
        }`}
        href={item.link}
        style={{ display: "flex", alignItems: "center" }}
      >
        {getItemIcon(item.text)}
        <span>{item.text}</span>
        {item.badge ? (
          <div className="rainbow-badge-card badge-sm ml--5">
            {item.badge}
          </div>
        ) : (
          ""
        )}
      </Link>
    </div>
  );
};

const NavProps = ({ list }) => {
  const router = useRouter();
  const isActive = (href) => router.pathname === href;
  return (
    <>
      <style jsx global>{`
        .mega-hover-wrapper .mega-hover-item {
          transition: transform 0.15s ease, translate 0.15s ease, color 0.15s ease;
          color: inherit;
        }
        .mega-hover-wrapper:hover .mega-hover-item {
          transform: scale(1.05);
          translate: 5px 0;
          color: #1e90ff !important;
        }
        .mega-hover-wrapper:hover svg {
          color: #1e90ff !important;
        }
      `}</style>
      <div className="col-lg-3 single-mega-item">
        <ul className="mega-menu-item">
          {list &&
            list.map((item, i) => (
              <li key={i}>
                {item.heading ? (
                  <h3 className="rbt-short-title">{item.heading}</h3>
                ) : (
                  <MegaMenuItem item={item} isActive={isActive} />
                )}
              </li>
            ))}
        </ul>
      </div>
    </>
  );
};

export default NavProps;
