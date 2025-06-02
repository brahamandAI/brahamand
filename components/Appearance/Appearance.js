import React, { useState } from "react";
import Image from "next/image";

import darkImg from "../../public/images/switcher-img/light.png";
import lightImg from "../../public/images/switcher-img/light.png";
import flag from "../../public/images/icons/en-us.png";
import flag2 from "../../public/images/icons/fr.png";

import UserNav from "../Common/UserNav";
import { useAppContext } from "@/context/Context";

const Appearance = () => {
  const { isLightTheme, toggleTheme } = useAppContext();

  return (
    <>
      <div className="rbt-main-content mb-0">
        <div className="rbt-daynamic-page-content center-width">
          <div className="rbt-dashboard-content">
            <UserNav title="Appearance" />
            <div className="content-page pb--50">
              <div className="chat-box-list">
                <div className="single-settings-box">
                  <h4 className="title">Appearance</h4>
                  <div className="switcher-btn-grp">
                    <button
                      className={`dark-switcher ${
                        isLightTheme ? "active" : ""
                      }`}
                      onClick={toggleTheme}
                    >
                      <Image
                        src={darkImg}
                        width={200}
                        height={150}
                        alt="Switcher Image"
                      />
                      <span className="text">Dark Mode</span>
                    </button>
                    <button
                      className={`light-switcher ${
                        !isLightTheme ? "active" : ""
                      }`}
                      onClick={toggleTheme}
                    >
                      <Image
                        src={lightImg}
                        width={200}
                        height={150}
                        alt="Switcher Image"
                      />
                      <span className="text">Light Mode</span>
                    </button>
                  </div>
                </div>

                <div className="single-settings-box">
                  <h4 className="title">Languages</h4>
                  <div className="select-area">
                    <h6 className="text">System Language</h6>
                    <div className="rbt-modern-select bg-transparent height-45">
                      <select id="system-language-select" onChange={(e) => {
                        // Get the language code from the value
                        const [name, code] = e.target.value.split('|');
                        
                        // Store the selected language in localStorage for persistence
                        localStorage.setItem('selectedLanguage', name);
                        localStorage.setItem('languageCode', code);
                        
                        // Define language direction (RTL or LTR)
                        const rtlLanguages = ['ur', 'ks', 'sd'];
                        const direction = rtlLanguages.includes(code) ? 'rtl' : 'ltr';
                        
                        // Set language attributes on document root
                        document.documentElement.setAttribute('lang', code);
                        document.documentElement.setAttribute('dir', direction);
                        
                        // Update UI to show language has been selected
                        const messageElement = document.createElement('div');
                        messageElement.innerHTML = `
                          <div class="language-content" style="
                            position: fixed;
                            bottom: 90px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(49, 130, 206, 0.9);
                            color: white;
                            padding: 12px 20px;
                            border-radius: 20px;
                            font-size: 14px;
                            z-index: 1000;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            max-width: 80%;
                            text-align: center;
                            font-weight: 500;
                            line-height: 1.5;
                          ">
                            ${name} language selected successfully.
                          </div>
                        `;
                        document.body.appendChild(messageElement);
                        setTimeout(() => document.body.removeChild(messageElement), 3000);
                      }}>
                        <option value="English|en">English</option>
                        <option value="Hindi|hi">Hindi</option>
                        <option value="Bengali|bn">Bengali</option>
                        <option value="Telugu|te">Telugu</option>
                        <option value="Marathi|mr">Marathi</option>
                        <option value="Tamil|ta">Tamil</option>
                        <option value="Urdu|ur">Urdu</option>
                        <option value="Gujarati|gu">Gujarati</option>
                        <option value="Kannada|kn">Kannada</option>
                        <option value="Odia|or">Odia</option>
                        <option value="Malayalam|ml">Malayalam</option>
                        <option value="Punjabi|pa">Punjabi</option>
                        <option value="Assamese|as">Assamese</option>
                        <option value="Maithili|mai">Maithili</option>
                        <option value="Sanskrit|sa">Sanskrit</option>
                        <option value="Santali|sat">Santali</option>
                        <option value="Kashmiri|ks">Kashmiri</option>
                        <option value="Nepali|ne">Nepali</option>
                        <option value="Konkani|kok">Konkani</option>
                        <option value="Dogri|doi">Dogri</option>
                        <option value="Sindhi|sd">Sindhi</option>
                        <option value="Bodo|brx">Bodo</option>
                      </select>
                    </div>
                  </div>
                  <div className="select-area mt--20">
                    <h6 className="text">Generate Language</h6>

                    <div className="rbt-modern-select bg-transparent height-45">
                      <select id="generate-language-select" onChange={(e) => {
                        // Get the language code from the value
                        const [name, code] = e.target.value.split('|');
                        
                        // Store the selected language in localStorage for persistence
                        localStorage.setItem('selectedLanguage', name);
                        localStorage.setItem('languageCode', code);
                        
                        // Define language direction (RTL or LTR)
                        const rtlLanguages = ['ur', 'ks', 'sd'];
                        const direction = rtlLanguages.includes(code) ? 'rtl' : 'ltr';
                        
                        // Set language attributes on document root
                        document.documentElement.setAttribute('lang', code);
                        document.documentElement.setAttribute('dir', direction);
                        
                        // Update UI to show language has been selected
                        const messageElement = document.createElement('div');
                        messageElement.innerHTML = `
                          <div class="language-content" style="
                            position: fixed;
                            bottom: 90px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(49, 130, 206, 0.9);
                            color: white;
                            padding: 12px 20px;
                            border-radius: 20px;
                            font-size: 14px;
                            z-index: 1000;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            max-width: 80%;
                            text-align: center;
                            font-weight: 500;
                            line-height: 1.5;
                          ">
                            ${name} language selected successfully.
                          </div>
                        `;
                        document.body.appendChild(messageElement);
                        setTimeout(() => document.body.removeChild(messageElement), 3000);
                      }}>
                        <option value="English|en">English</option>
                        <option value="Hindi|hi">Hindi</option>
                        <option value="Bengali|bn">Bengali</option>
                        <option value="Telugu|te">Telugu</option>
                        <option value="Marathi|mr">Marathi</option>
                        <option value="Tamil|ta">Tamil</option>
                        <option value="Urdu|ur">Urdu</option>
                        <option value="Gujarati|gu">Gujarati</option>
                        <option value="Kannada|kn">Kannada</option>
                        <option value="Odia|or">Odia</option>
                        <option value="Malayalam|ml">Malayalam</option>
                        <option value="Punjabi|pa">Punjabi</option>
                        <option value="Assamese|as">Assamese</option>
                        <option value="Maithili|mai">Maithili</option>
                        <option value="Sanskrit|sa">Sanskrit</option>
                        <option value="Santali|sat">Santali</option>
                        <option value="Kashmiri|ks">Kashmiri</option>
                        <option value="Nepali|ne">Nepali</option>
                        <option value="Konkani|kok">Konkani</option>
                        <option value="Dogri|doi">Dogri</option>
                        <option value="Sindhi|sd">Sindhi</option>
                        <option value="Bodo|brx">Bodo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Appearance;
