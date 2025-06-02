import React from 'react';
import TextToImage from '../components/ImageGenerator/TextToImage';
import TopBar from '../components/Common/TopBar';
import Header from '../components/Common/Header';
import Image from 'next/image';

// Import the photo icon (assuming it's in the same location as other icons)
import imgPhoto from '../public/images/icons/photo-icon.png';

const ImageGeneratorPage = () => {
  return (
    <>
      <Header />
      <div className="main-content-wrapper">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-12">
              {/* Header Section */}
              <TopBar
                padding={true}
                barImg={imgPhoto}
                title="AI Image Generator"
                wdt={24}
                htd={24}
              />
              
              {/* Main Content */}
              <div className="chat-box-list-wrapper">
                <TextToImage />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageGeneratorPage; 