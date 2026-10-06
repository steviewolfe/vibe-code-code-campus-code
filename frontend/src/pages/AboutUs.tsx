import '../styles/pages.css'

interface AboutUsProps {
  onSelectProduct?: (productId: string) => void
}

export function AboutUs({ onSelectProduct }: AboutUsProps) {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About<br />Campus Customs</h1>
          <p className="about-tagline">Celebrating Yale Pride Since Day One</p>
        </div>
      </section>

      {/* Mission */}
      <section className="about-section">
        <div className="about-section-wrapper">
          <h2>Our Mission</h2>
          <p className="about-text">
            Campus Customs is dedicated to delivering officially licensed Yale University merchandise
            that students, alumni, and fans can be proud to wear. We believe in quality, authenticity,
            and celebrating the Bulldog spirit that unites the Yale community.
          </p>
          <p className="about-text">
            Whether you're a current student, proud parent, or lifelong alumni, our curated collection
            ensures you can represent Yale with style and confidence.
          </p>
        </div>
      </section>

      {/* Why Choose */}
      <section className="about-section about-section--alt">
        <div className="about-section-wrapper">
          <h2>Why Choose Campus Customs?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <h3>Official Licensing</h3>
              <p>All products are officially licensed by Yale University</p>
            </div>
            <div className="benefit-item">
              <h3>Premium Quality</h3>
              <p>Partnerships with trusted brands like Champion, Brooks Brothers, and Under Armour</p>
            </div>
            <div className="benefit-item">
              <h3>Extensive Selection</h3>
              <p>Over 100 unique designs featuring Yale colleges, schools, and athletic teams</p>
            </div>
            <div className="benefit-item">
              <h3>Fast Shipping</h3>
              <p>Quick delivery to get your gear when you need it</p>
            </div>
            <div className="benefit-item">
              <h3>Customer Support</h3>
              <p>Dedicated team ready to help with sizing and questions</p>
            </div>
            <div className="benefit-item">
              <h3>Student Discounts</h3>
              <p>Special pricing for current Yale students with valid ID</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="about-section">
        <div className="about-section-wrapper">
          <h2>Our Story</h2>
          <p className="about-text">
            Campus Customs started with a simple idea: make it easy for Yale community members to find
            and purchase high-quality official merchandise. From classic navy hoodies to college-specific
            crests, we've built a collection that captures the essence of the Yale experience.
          </p>
          <p className="about-text">
            Our team works directly with Yale University to ensure every product meets our standards
            for quality, design, and authenticity. We're proud to be the go-to source for Yale apparel.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="about-section about-section--alt">
        <div className="about-section-wrapper">
          <h2>What Our Customers Say</h2>
          <div className="testimonial-grid">
            <blockquote className="testimonial-card">
              <p className="testimonial-text">
                "Great quality merchandise and fast shipping. I love representing my college!"
              </p>
              <footer className="testimonial-author">Sarah M., Yale '24</footer>
            </blockquote>
            <blockquote className="testimonial-card">
              <p className="testimonial-text">
                "Campus Customs has everything I need. Best selection of Yale gear anywhere."
              </p>
              <footer className="testimonial-author">Michael T., Yale Alumni</footer>
            </blockquote>
            <blockquote className="testimonial-card">
              <p className="testimonial-text">
                "Perfect gifts for my kids in different Yale colleges. Highly recommend!"
              </p>
              <footer className="testimonial-author">Jennifer L., Yale Parent</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="about-section">
        <div className="about-section-wrapper">
          <h2>Connect With Us</h2>
          <p className="about-text">Have questions? We'd love to hear from you.</p>
          <div className="contact-grid">
            <div className="contact-item">
              <p className="contact-label">Email</p>
              <p className="contact-value">support@campuscustoms.yale.edu</p>
            </div>
            <div className="contact-item">
              <p className="contact-label">Phone</p>
              <p className="contact-value">1-800-YALE-SHOP</p>
            </div>
            <div className="contact-item">
              <p className="contact-label">Live Chat</p>
              <p className="contact-value">Available during business hours</p>
            </div>
            <div className="contact-item">
              <p className="contact-label">Office</p>
              <p className="contact-value">New Haven, Connecticut</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
