import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-blue-900 text-white pt-4 pb-4">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold">Shunmugam Textiles</h3>
                        <p className="text-slate-300 leading-relaxed">
                            Leading textile manufacturer with over 20 years of experience in producing
                            high-quality fabrics for global markets.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
                        <ul className="list-none p-0 m-0 flex flex-col gap-2">
                            <li><a href="/" className="text-slate-300 no-underline transition-colors hover:text-white">Home</a></li>
                            <li><a href="/products" className="text-slate-300 no-underline transition-colors hover:text-white">Products</a></li>
                            <li><a href="/about" className="text-slate-300 no-underline transition-colors hover:text-white">About Us</a></li>
                            <li><a href="/contact" className="text-slate-300 no-underline transition-colors hover:text-white">Contact</a></li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="text-lg font-semibold mb-2">Contact Info</h4>
                        <ul className="list-none p-0 m-0 flex flex-col gap-3">
                            <li className="flex items-start gap-3 text-slate-300">
                                <MapPin size={18} className="shrink-0 mt-0.5" />
                                <span>3-835, Vathiyar Thottam, Valayakaranur Post, Komarapalayam-638183, Namakkal District, Tamil Nadu, India</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-300">
                                <Phone size={18} className="shrink-0 mt-0.5" />
                                <span>+91-9994140750 / +91-9842525705 / +91-9894847874</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-300">
                                <Mail size={18} className="shrink-0 mt-0.5" />
                                <span>shunmugamtextile@gmail.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6 text-center text-slate-300">
                    <p className="m-0">&copy; 2025 Shunmugam Textiles. All rights reserved.</p>
                    <p className="m-0 mt-2 text-sm text-slate-400">
                    Developed by{" "}
                    <span className="text-slate-300 font-medium">Kishore S</span> &{" "}
                    <span className="text-slate-300 font-medium">Sanjay B</span>{" "}
                    (
                    <a
                        href="mailto:senthilkishore706@gmail.com"
                        className="hover:underline"
                    >
                        senthilkishore706@gmail.com
                    </a>
                    )
                    </p>

                </div>
            </div>
        </footer>
    );
};

export default Footer;
