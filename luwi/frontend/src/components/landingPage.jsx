import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AcercaDeNosotros from "./Acercadenosotros";
import ComoFunciona from "./Comofunciona";
import Footer from "./Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar + hero comparten el panel azul de fondo (de arriba hasta el final del hero) */}
      <div className="relative isolate overflow-x-clip">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 -z-10 hidden w-[38%] rounded-bl-[64px] rounded-tl-[64px] bg-azul md:block"
        />
        <Navbar />
        <Hero />
      </div>
      <ComoFunciona/>
       <AcercaDeNosotros/>
      <Footer/>
    </div>
  );
}