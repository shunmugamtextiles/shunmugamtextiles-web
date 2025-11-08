const About = () => {
  return (
    <div>

      {/* Leadership Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-900 mb-2">
              Shunmugam Textiles - Komarapalayam
            </h2>
          </div>

          {/* Founder Section */}
          <div className="mb-10">
            <h3 className="text-xl md:text-2xl font-bold text-blue-900 text-center mb-8 md:mb-12 underline decoration-2 underline-offset-4">
              FOUNDER
            </h3>
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center p-2">
                  <img
                    src="/Nachiappan.jpg?v=1"
                    alt="P. Nachiappan"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Failed to load Nachiappan.jpg:', e.target.src);
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-blue-900">P. Nachiappan</p>
                  <p className="text-sm md:text-base text-slate-600">(late)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Board of Directors Section */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-blue-900 text-center mb-8 md:mb-12 underline decoration-2 underline-offset-4">
              BOARD OF DIRECTORS
            </h3>
            
            {/* First Row - Proprietors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center p-2">
                  <img
                    src="/Sellamuthu.jpg?v=1"
                    alt="N. Sellamuthu"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Failed to load Sellamuthu.jpg:', e.target.src);
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-blue-900">N. Sellamuthu</p>
                  <p className="text-sm md:text-base text-slate-600">(proprietor)</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center p-2">
                  <img
                    src="/Loganathan.jpg"
                    alt="N. Loganathan"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = '/logo.jpg';
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-blue-900">N. Loganathan</p>
                  <p className="text-sm md:text-base text-slate-600">(proprietor)</p>
                </div>
              </div>
            </div>

            {/* Second Row - Executive Directors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center p-2">
                  <img
                    src="/Mythies Kumar.jpg"
                    alt="S. Mythirei Kumar"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = '/logo.jpg';
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-blue-900">S. Mythirei Kumar</p>
                  <p className="text-sm md:text-base text-slate-600">Executive Director</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center p-2">
                  <img
                    src="/Shanmugaraj.jpg?v=1"
                    alt="L. Shanmugaraj"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Failed to load Shanmugaraj.jpg:', e.target.src);
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-blue-900">L. Shanmugaraj</p>
                  <p className="text-sm md:text-base text-slate-600">Executive Director</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center p-2">
                  <img
                    src="/Arun.jpg"
                    alt="S. Arun"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = '/logo.jpg';
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-blue-900">S. Arun</p>
                  <p className="text-sm md:text-base text-slate-600">Executive Director</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Description Section */}
          <div className="mt-8 md:mt-12">
            <div className="bg-white p-6 md:p-10 rounded-xl shadow-md">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed text-sm md:text-base mb-4">
                  Shunmugam Textiles, was registered and incorporated in 1975 with current GST NO: <strong>33ABTPL6234F1ZK</strong>. Based in TamilNadu, India, we have garnered acclaim as the Manufacturer and Supplier of Cotton Lungies and Towels.
                </p>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base mb-4">
                  Initially we started our company to trade Lungies for the needs of Tamilnadu Customers. Later we started our own production with capacity of <strong>300 power looms</strong> and expanded our production across TamilNadu. Gradually our products were marketed to Andhra Pradesh, Telangana, Kerala, Bihar, Assam, Uttar Pradesh, Karnataka, West Bengal, Orissa and Maharashtra.
                </p>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base mb-4">
                  The Company Manufactures powerloom Lungies and Towels in the Name of <strong>Leader Brand, Sun-Star and Jai Bharath Brand</strong>. We are the only Major Manufacturer of Powerloom Lungies and Towels in Indian Market with <strong>300 plus owned drop-box powerlooms</strong>.
                </p>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base mb-4">
                  Our Lungies and towels are made with high quality <strong>Combed Yarn</strong>. The finished goods supplied by the Weavers are checked for stringent Quality, branded and released for Sale. The Quality is controlled internally by our trained and qualified staff. We are having more than <strong>40 years experience</strong> in the Manufacture and Sales of Powerloom Lungies and Towels.
                </p>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base mb-4">
                  Available in various colors and patterns, the offered Lungies and Towels were highly appreciated for their <strong>color-fastness, soft and easy to wash property</strong>.
                </p>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                  In addition, we have our sister concern companies <strong>S.A.M Lungie Company GSTN NO: 33AFMPC1211Q1ZM & Nachiappan Traders</strong> with a vast distribution network to cater the needs of the clients promptly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
