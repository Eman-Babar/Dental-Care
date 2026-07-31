import Hero from "../components/home/Hero";
import Stats from "../components/home/Stats";
import ServicesSection from "../components/home/Services";
import WhyChooseUs from "../components/home/WhyChooseUs";
import Results from "../components/home/Results";
import DoctorsSection from "../components/home/Doctors";
import Testimonials from "../components/home/Testimonials";
import CtaBanner from "../components/home/CtaBanner";
import Footer from "../components/layout/Footer";
import LocalBusinessJsonLd from "../components/common/LocalBusinessJsonLd";

function Home() {
  return (
    <>
      <LocalBusinessJsonLd />
      <Hero />
      <Stats />
      <ServicesSection />
      <WhyChooseUs />
      <Results />
      <DoctorsSection />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </>
  );
}

export default Home;
