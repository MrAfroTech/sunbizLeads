import Nav from './components/Nav';
import Hero from './components/Hero';
import Tiers from './components/Tiers';
import Flow from './components/Flow';
import Checkout from './components/Checkout';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <div className="noise" />
      <Nav />
      <Hero />
      <Tiers />
      <Flow />
      <Checkout />
      <Footer />
    </>
  );
}
