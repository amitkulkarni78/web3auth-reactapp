import React, { useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import Layout from './components/Layout';
import { Web3Auth } from "@web3auth/web3auth";
import { WALLET_ADAPTERS, CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { getPublicCompressed } from "@toruslabs/eccrypto";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";


import RPC from "./web3RPC";

const clinetId = "BPX_eXL6fEULeWl47mYjTjFAtcrKwffVztGffWC6cn18ibho4YXQHs263EP-13RUxGysAFZq0lKS8HHPrpY21gY";
//const clinetId = "BIn9yi_lrt0uhQBYVQId4cqu5eVsFtovsBelv03CjzMZttQYHb2HRWPbcJg1vmz84p7aEMmmwIhM24Am5YS2rBU";
interface AppPrivateKey { 
  padStart: () => {}  
} 

interface State {
  provider: SafeEventEmitterProvider | null;
  appPubKey: string | null;
  user: any | null;
};

let defaultState = {
  provider: null,
  appPubKey: null,
  user: null,
};

function App() {
  const [web3auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [state , setState] = useState<State>(defaultState);

  const [user,setUser] = useState<any>(null);
  const [appPubKey, setAppPubKey] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId: clinetId, // get it from Web3Auth Dashboard
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x13881", // hex of 137, polygon mainnet
            rpcTarget: "https://rpc-mumbai.maticvigil.com",
            // Avoid using public rpcTarget in production.
            // Use services like Infura, Quicknode etc
            displayName: "Polygon testnet",
            blockExplorer: "https://polygonscan.com",
            ticker: "MATIC",
            tickerName: "Matic",
          },
          uiConfig: {
            theme: "dark",
            loginMethodsOrder: ["facebook", "google"],
            appLogo: "https://web3auth.io/images/w3a-L-Favicon-1.svg", // Your App Logo Here
          }
        });

        const openLoginAdapter = new OpenloginAdapter({
            adapterSettings : {
              clientId: clinetId,
              network: "testnet",
              uxMode: "popup",
              whiteLabel: {
                name: "Sample Adapter",
                logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
                logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
                defaultLanguage: "en",
                dark: true,
              },
            },
        });

        web3auth.configureAdapter(openLoginAdapter);
        setWeb3Auth(web3auth);

        await web3auth.initModal({
          modalConfig: {
            [WALLET_ADAPTERS.OPENLOGIN]: {
              label: "openlogin",
              loginMethods: {
                reddit: {
                  showOnModal: false,
                  name: "reddit",
                },
                google: {
                  showOnModal: true,
                  name: "google"
                },
                facebook: {
                  showOnModal: true,
                  name: "facebook"
                }
              },
            },
          },
        });

        if( web3auth.provider) {
          setProvider(web3auth.provider);
          setState((prevState : State) => ({
            ...prevState,
            provider: web3auth.provider
          }));
        };
        
      } catch(error) {
        console.error(error);
      }
    };
    init();
  }, []);

  useEffect(() => {
      console.log(" set provider ", provider);
  }, [provider])

  const loginViaGoogle = async () => {
    if(!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }

    await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      relogin: true,
      loginProvider: 'google'
      // extraLoginOptions: {
      // 	domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
      // 	verifierIdField: 'sub'
      // },
    });

    const user = await web3auth.getUserInfo();
    setState(prevState => ({ ...prevState, user: user }));
    if(user) {
      setUser(user);
    }
    console.log(user);

    const app_scoped_privkey: any = await web3auth.provider?.request({
      method: "eth_private_key", // use "private_key" for other non-evm chains
    });

    if ( app_scoped_privkey ) {
      const app_pub_key = getPublicCompressed(Buffer.from(app_scoped_privkey?.padStart(64, "0"), "hex")).toString("hex");
      if(app_pub_key) {
        console.log("app_pub_key,: ",app_pub_key);
        setAppPubKey(app_pub_key);
        setState((prevState : State) => ({
          ...prevState,
          appPubKey: app_pub_key
        }));
      } 
    } 

  };


  
  const loginViafacebook = async () => {
    if(!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }

    await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      relogin: true,
      loginProvider: 'facebook'
      // extraLoginOptions: {
      // 	domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
      // 	verifierIdField: 'sub'
      // },
    });

    const user = await web3auth.getUserInfo();
    if(user) {
      setUser(user);
    }
    console.log(user);

    const app_scoped_privkey: any = await web3auth.provider?.request({
      method: "eth_private_key", // use "private_key" for other non-evm chains
    });

    if ( app_scoped_privkey ) {
      const app_pub_key = getPublicCompressed(Buffer.from(app_scoped_privkey?.padStart(64, "0"), "hex")).toString("hex");
      if(app_pub_key) {
        console.log("app_pub_key,: ",app_pub_key);
        setAppPubKey(app_pub_key);
        setState((prevState : State) => ({
          ...prevState,
          appPubKey: app_pub_key
        }));
      } 
    } 

  };


  const getUserInfo = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    console.log(user);
  };

  const logout = async () => {
    if(!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
  };

  const signMessage = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const signedMessage = await rpc.signMessage();
    console.log(signedMessage);
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    console.log(address);
  };
 
  const getPrivateKey = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    console.log(privateKey);
  };

  const getAppPubKey = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }

    console.log(appPubKey);
   
  }

  const Logout = async () => {
      if(!provider) {
        web3auth?.logout({ cleanup : true });
      }
  }

  const loggedInView = (
    <>
      <button onClick={getUserInfo} className="card">
        Get User Info
      </button>

      <button onClick={getAccounts} className="card">
        Get Accounts
      </button>
      <button onClick={signMessage} className="card">
        Sign Message
      </button>
      <button onClick={getPrivateKey} className="card">
        Get Private Key
      </button>
      <button onClick={getAppPubKey} className="card">
        Get app-pub-key 
      </button>
      <button onClick={logout} className="card">
        Log Out
      </button>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <>
    <button onClick={loginViaGoogle} className="card">
      google login
    </button>
    <button onClick={loginViafacebook} className="card">
      facebook login
    </button>
    </>
  );

  return (
    <div className="App">
      
     <div className="container">
      <h1 className="title">
        <a target="_blank" href="http://web3auth.io/" rel="noreferrer">
          Web3Auth
        </a>

        & ReactJS Example
      </h1>
      <p>{
        state.user === null ? "user not set yet " : state.user.idToken 
      }</p>
     {/*  <Layout /> */}


      <div className="grid">{state.user != null ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a href="https://github.com/Web3Auth/Web3Auth/tree/master/examples/react-app" target="_blank" rel="noopener noreferrer">
          Source code
        </a>
      </footer>
    </div>
    </div>
  );
}

export default App;
