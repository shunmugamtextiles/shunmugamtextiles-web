import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const productImages = [
    '/product1.jpg',
    '/product2.jpg',
    '/product3.jpg',
    '/product4.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % productImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [productImages.length]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="flex flex-col gap-4 md:gap-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Welcome to Shunmugam Textiles</h1>
            <p className="text-base md:text-lg leading-relaxed text-blue-100">
              Leading textile manufacturer with over 20 years of experience in producing
              high-quality fabrics for global markets. Our commitment to excellence and
              sustainable practices sets us apart in the industry.
            </p>
            <div className="flex gap-3 md:gap-4 mt-2 md:mt-4 flex-col sm:flex-row">
              <Link to="/products" className="bg-white text-blue-600 px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-xl text-sm md:text-base no-underline">
                View Products
                <ArrowRight size={18} className="md:w-5 md:h-5" />
              </Link>
              <Link to="/contact" className="bg-transparent text-white px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold border-2 border-white transition-all hover:bg-white hover:text-blue-600 text-sm md:text-base no-underline text-center">Contact Us</Link>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <div className="w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl relative">
              {productImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Product ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to product ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-slate-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-900 mb-3 md:mb-4">Why Choose Shunmugam Textiles?</h2>
            <p className="text-lg md:text-xl text-slate-600">We deliver excellence in every thread</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="text-blue-600 mb-3 md:mb-4">
                <CheckCircle size={28} className="md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2 md:mb-3">Quality Assurance</h3>
              <p className="text-slate-600 leading-relaxed">
                Premium quality fabrics that meet international standards
              </p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="text-blue-600 mb-3 md:mb-4">
                <CheckCircle size={28} className="md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2 md:mb-3">Sustainable Practices</h3>
              <p className="text-slate-600 leading-relaxed">
                Eco-friendly manufacturing processes for a better tomorrow
              </p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="text-blue-600 mb-3 md:mb-4">
                <CheckCircle size={28} className="md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2 md:mb-3">Global Reach</h3>
              <p className="text-slate-600 leading-relaxed">
                Serving customers worldwide with reliable delivery
              </p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="text-blue-600 mb-3 md:mb-4">
                <CheckCircle size={28} className="md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2 md:mb-3">Custom Solutions</h3>
              <p className="text-slate-600 leading-relaxed">
                Tailored textile solutions for your specific needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section
      <section className="bg-gradient-to-br from-blue-900 to-blue-600 text-white py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-4xl font-bold mb-4">Ready to Experience Quality?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Get in touch with us today to discuss your textile requirements
          </p>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-all hover:bg-blue-50 hover:-translate-y-0.5">
            Get Started
            <ArrowRight size={20} />
          </button>
        </div>
      </section> */}
    </div>
  );
};

export default Home;
