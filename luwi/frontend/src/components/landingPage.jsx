import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AcercaDeNosotros from "./Acercadenosotros";
import ComoFunciona from "./Comofunciona";
import Footer from "./Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <ComoFunciona/>
       <AcercaDeNosotros/>
      <Footer/>
    </div>
  );
}