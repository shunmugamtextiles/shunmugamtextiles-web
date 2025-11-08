import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <div>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-600 text-white py-12 md:py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl text-blue-100">
            Get in touch with us for any inquiries or business opportunities
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-slate-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-xl shadow-md">
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 md:mb-6">Get in Touch</h2>
              <div className="flex flex-col gap-4 md:gap-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shrink-0">
                    <MapPin size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-blue-900 mb-1">Address</h4>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      SHUNMUGAM TEXTILES<br />
                      3-835, VATHIYAR THOTTAM,<br />
                      VALAYAKARANUR POST,<br />
                      KOMARAPALAYAM-638183,<br />
                      Namakkal District, Tamil Nadu, INDIA
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shrink-0">
                    <Phone size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-blue-900 mb-1">Phone</h4>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">+91-9994140750<br />+91-9842525705<br />+91-9894847874</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shrink-0">
                    <Mail size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-blue-900 mb-1">Email</h4>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">shunmugamtextile@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-xl shadow-md">
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 md:mb-6">Our Location</h2>
              <div className="w-full h-96 md:h-[500px] rounded-xl overflow-hidden border-2 border-slate-200">
                <iframe
                  src={`https://www.google.com/maps?q=${11.444003235974746},${77.72541908468246}&hl=en&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Shunmugam Textiles Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
