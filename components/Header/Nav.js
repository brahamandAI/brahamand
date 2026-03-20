import React, { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { FaChevronDown } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

import MenuData from "../../data/header.json";

import NavProps from "./NavProps";
import menuImg from "../../public/images/menu-img/menu-img-2.png";

// CSS-based hover button component (faster than framer-motion)
const HoverButton = ({ text, href, hasIcon }) => {
  const router = useRouter();
  const isActive = router.pathname === href;
  
  return (
    <div className="nav-hover-wrapper">
      <Link
        href={href}
        className={`nav-hover-item ${isActive ? "active" : ""}`}
      >
        {text}
        {hasIcon && <FaChevronDown className="nav-chevron" />}
      </Link>
    </div>
  );
};

// CSS-based dropdown button component
const HoverDropdownButton = ({ text, onClick, isOpen }) => {
  return (
    <div className="nav-hover-wrapper">
      <a
        href="#"
        className={`nav-hover-item ${isOpen ? "open" : ""}`}
        onClick={onClick}
      >
        {text}
        <FaChevronDown className="nav-chevron" />
      </a>
    </div>
  );
};

// CSS-based submenu item
const SubMenuItem = ({ innerData, isActiveFunc }) => {
  return (
    <div className="submenu-hover-wrapper">
      <Link
        className={`submenu-hover-item ${isActiveFunc(innerData.link) ? "active" : ""} ${innerData.isDisable ? "disabled" : ""}`}
        href={!innerData.isDisable ? innerData.link : "#"}
      >
        <span>{innerData.title}</span>
        {innerData.badge ? (
          <div className="rainbow-badge-card badge-sm ml--5">
            {innerData.badge}
          </div>
        ) : (
          ""
        )}
      </Link>
    </div>
  );
};

const Nav = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [sectionStates, setSectionStates] = useState({
    Tools: true,
    Pages: true,
  });

  const toggleSection = (subTitle) => {
    setSectionStates((prevState) => ({
      ...prevState,
      [subTitle]: !prevState[subTitle],
    }));
  };

  const isActive = (href) => router.pathname === href;

  // Filter out SignIn and Sign Up items when user is logged in
  const filteredNavItems = MenuData.nav.filter(item => {
    if (isLoggedIn) {
      return !['SignIn', 'Sign Up'].includes(item.text);
    }
    return true;
  });

  return (
    <>
      <style jsx global>{`
        .nav-hover-wrapper .nav-hover-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s ease;
          color: inherit;
          text-decoration: none;
        }
        .nav-hover-wrapper:hover .nav-hover-item,
        .nav-hover-wrapper .nav-hover-item:hover {
          color: #1e90ff !important;
        }
        .nav-chevron {
          font-size: 11px;
          vertical-align: middle;
          opacity: 0.75;
        }
        .submenu-hover-wrapper .submenu-hover-item {
          transition: color 0.15s ease, padding-left 0.15s ease;
        }
        .submenu-hover-wrapper:hover .submenu-hover-item {
          color: #1e90ff;
          padding-left: 4px;
        }
      `}</style>
      <ul className="mainmenu">
        {filteredNavItems.map((data, index) => (
          <li
            className={`${
              data.dropdown
                ? "has-dropdown has-menu-child-item position-relative"
                : ""
            } ${data.megamenu ? "with-megamenu has-menu-child-item" : ""}`}
            key={index}
          >
            {data.text === "Home" || data.text === "SignIn" || data.text === "Sign Up" || data.text === "About Us" ? (
              <HoverButton text={data.text} href={data.link} hasIcon={data.isIcon} />
            ) : data.link === "#" && data.text === "Tools" ? (
              <HoverDropdownButton 
                text={data.text} 
                onClick={() => toggleSection(data.text)}
                isOpen={!sectionStates[data.text]}
              />
            ) : data.link === "#" ? (
              <a
                href="#"
                className={` ${!sectionStates[data.text] ? "open" : ""}`}
                onClick={() => toggleSection(data.text)}
              >
                {data.text}
                {data.isIcon ? (
                  <i className="fa-regular fa-chevron-down"></i>
                ) : (
                  ""
                )}
              </a>
            ) : (
              <Link
                href={data.link}
                className={isActive(data.link) ? "active" : ""}
              >
                {data.text}
                {data.isIcon ? (
                  <i className="fa-regular fa-chevron-down"></i>
                ) : (
                  ""
                )}
              </Link>
            )}

            {data.isMenu &&
            !data.inner &&
            !data.dashboard &&
            !data.upcoming ? (
              <ul
                className={`submenu ${
                  !sectionStates[data.text] ? "d-block" : ""
                }`}
              >
                {data.subItem &&
                  data.subItem.map((innerData, innerIndex) => (
                    <li key={innerIndex}>
                      <SubMenuItem innerData={innerData} isActiveFunc={isActive} />
                    </li>
                  ))}
              </ul>
            ) : data.isMenu ? (
              <div
                className={`rainbow-megamenu ${
                  !sectionStates[data.text] ? "d-block active" : ""
                }`}
              >
                <div className="wrapper">
                  <div className="row row--0">
                    <NavProps list={data.inner} />
                    <NavProps list={data.dashboard} />
                    <NavProps list={data.upcoming} />
                    <div className="col-lg-3 single-mega-item">
                      <div className="header-menu-img">
                        <Image
                          src={menuImg}
                          width={326}
                          height={458}
                          alt="Menu Split Image"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              ""
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export default Nav;
