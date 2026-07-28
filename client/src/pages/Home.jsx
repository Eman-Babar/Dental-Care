import Hero from "../components/home/Hero";
import ServicesSection from "../components/home/Services";
import WhyChooseUs from "../components/home/WhyChooseUs";
import DoctorsSection from "../components/home/Doctors";
import Testimonials from "../components/home/Testimonials";
import Footer from "../components/layout/Footer";

function Home() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <WhyChooseUs />
      <DoctorsSection />
      <Testimonials />
      <Footer />
    </>
  );
}

export default Home;