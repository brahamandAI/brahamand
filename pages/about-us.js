import React from 'react';
import Head from 'next/head';
import styles from '../styles/AboutUs.module.css';
import { FaBrain, FaLeaf, FaShieldAlt, FaRecycle } from 'react-icons/fa';
import { MdHealthAndSafety, MdFactory, MdSelfImprovement } from 'react-icons/md';
import { GiArtificialIntelligence, GiRobotGolem } from 'react-icons/gi';

const AboutUs = () => {
  return (
    <>
      <Head>
        <title>About Us - Robustrix IT Solutions</title>
        <meta name="description" content="Learn about Robustrix IT Solutions - Pioneers in industrial AI computing with fanless embedded PCs" />
      </Head>

      <div className={styles.aboutContainer}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1>About Robustrix IT Solutions</h1>
            <p>Pioneering Industrial AI Computing with Fanless Embedded PCs</p>
          </div>
        </section>

        {/* Mission Section */}
        <section className={styles.missionSection}>
          <div className={styles.missionContent}>
            <h2>Our Mission</h2>
            <p>To revolutionize industrial computing by providing AI-driven, fanless embedded PCs that deliver unmatched performance, reliability, and sustainability.</p>
          </div>
        </section>

        {/* Story Section */}
        <section className={styles.storySection}>
          <h2>Our Story</h2>
          <p>Founded with a vision to transform industrial computing, Robustrix IT Solutions emerged from the need for reliable, efficient, and sustainable computing solutions in demanding environments. Our journey began with a simple question: How can we make industrial computing more efficient and environmentally friendly?</p>
        </section>

        {/* Differentiators Section */}
        <section className={styles.differentiatorsSection}>
          <h2>What Sets Us Apart</h2>
          <div className={styles.differentiatorsGrid}>
            <div className={styles.differentiatorCard}>
              <div className={styles.cardIcon}>
                <FaBrain />
              </div>
              <h3>AI-Driven Computing</h3>
              <p>Advanced AI capabilities for industrial applications</p>
            </div>
            <div className={styles.differentiatorCard}>
              <div className={styles.cardIcon}>
                <FaLeaf />
              </div>
              <h3>Silent Operation</h3>
              <p>Fanless design for noise-free environments</p>
            </div>
            <div className={styles.differentiatorCard}>
              <div className={styles.cardIcon}>
                <FaShieldAlt />
              </div>
              <h3>Durability</h3>
              <p>Built to withstand harsh industrial conditions</p>
            </div>
            <div className={styles.differentiatorCard}>
              <div className={styles.cardIcon}>
                <FaRecycle />
              </div>
              <h3>Sustainability</h3>
              <p>Energy-efficient solutions for a greener future</p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className={styles.valuesSection}>
          <h2>Our Core Values</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <h3>Innovation</h3>
              <p>Pushing boundaries in industrial computing</p>
            </div>
            <div className={styles.valueCard}>
              <h3>Reliability</h3>
              <p>Consistent performance in any environment</p>
            </div>
            <div className={styles.valueCard}>
              <h3>Sustainability</h3>
              <p>Environmentally conscious solutions</p>
            </div>
            <div className={styles.valueCard}>
              <h3>Customer Focus</h3>
              <p>Tailored solutions for specific needs</p>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className={styles.impactSection}>
          <h2>Our Impact</h2>
          <div className={styles.impactGrid}>
            <div className={styles.impactCard}>
              <div className={styles.impactIcon}>
                <GiArtificialIntelligence />
              </div>
              <h3>AI Vision Systems</h3>
              <p>Enhancing quality control and automation</p>
            </div>
            <div className={styles.impactCard}>
              <div className={styles.impactIcon}>
                <GiRobotGolem />
              </div>
              <h3>Autonomous Robotics</h3>
              <p>Powering next-generation robotics</p>
            </div>
            <div className={styles.impactCard}>
              <div className={styles.impactIcon}>
                <MdHealthAndSafety />
              </div>
              <h3>Healthcare</h3>
              <p>Supporting medical imaging and diagnostics</p>
            </div>
            <div className={styles.impactCard}>
              <div className={styles.impactIcon}>
                <MdFactory />
              </div>
              <h3>Manufacturing</h3>
              <p>Optimizing production processes</p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className={styles.contactSection}>
          <h2>Get in Touch</h2>
          <div className={styles.contactForm}>
            <form>
              <div className={styles.formGroup}>
                <input type="text" placeholder="Your Name" required />
              </div>
              <div className={styles.formGroup}>
                <input type="tel" placeholder="Phone Number" required />
              </div>
              <div className={styles.formGroup}>
                <input type="email" placeholder="Email Address" required />
              </div>
              <div className={styles.formGroup}>
                <textarea placeholder="Your Message" required></textarea>
              </div>
              <button type="submit" className={styles.submitButton}>Send Message</button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutUs; 