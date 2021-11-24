import './styles/App.css';
import React, { useEffect, useState } from "react";
import useStepper from "./utils/useStep";
import DraftDayNFT from "./utils/NFT.json";

const ethers = require("ethers");
const stepIds = ["wallet", "fund", "mint", "success"];

// Constants
const OPENSEA_LINK = "https://testnets.opensea.io/assets"; // TO-DO: Replace with Mainnet
// TO-DO: Set as environment variable
const CONTRACT_ADDRESS = "0xDB93165f586eA309A8008580520114b1f8fB8Bf9"; // TO-DO: Replace with Mainnet

const App = () => {
  const { currentStepId, currentStepIndex, goToNextStep } = useStepper(stepIds);

  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentBalance, setCurrentBalance] = useState("0.000 ETH");
  const [isMining, setIsMining] = useState(false);
  const [tokenId, setTokenId] = useState(null);

  const isWalletConnected = async () => {
    /* First make sure we have access to window.ethereum */
    const { ethereum } = window;

    if (!ethereum) {
      return;
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      setCurrentAccount(account);

      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x4" }], // TODO: Remove before Mainnet
      });
    }

    if (currentAccount && currentStepId === "wallet") {
      setupEventListener();
      goToNextStep();
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      setupEventListener();

      if (!ethereum) {
        alert("Download MetaMask to continue!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);

      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x4" }], // TODO:Remove before Mainnet
      });

      if (currentStepId === "wallet") {
        goToNextStep();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DraftDayNFT.abi,
          signer
        );

        const balance =
          currentAccount && (await provider.getBalance(currentAccount));
        const balanceToString = balance.toString();
        currentAccount &&
          setCurrentBalance(
            `${ethers.utils.formatEther(balanceToString).slice(0, 5)} ETH`
          );

        connectedContract.on("DraftDayNFTMinted", (from, tokenId) => {
          setTokenId(tokenId.toNumber());
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const [useWallet, setUseWallet] = useState("");
  const handleChange = (e) => {
    setUseWallet(e.target.value);
  };

  const isCreateWallet = useWallet === "create";
  const isUseWallet = useWallet === "use";

  const mintNFT = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          DraftDayNFT.abi,
          signer
        );

        console.log("Connect to MetaMask wallet...");
        let nftTxn = await connectedContract.mint();

        setIsMining(true);
        console.log("Mining... Please wait.");
        await nftTxn.wait();

        console.log(
          `Mined! See on Etherscan: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        setIsMining(false);
        goToNextStep();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Render Methods
  const renderWalletContainer = () => (
    <button
      onClick={currentAccount && isWalletConnected ? false : connectWallet}
      className="nes-btn is-primary"
    >
      {currentAccount && isWalletConnected
        ? `${currentBalance}`
        : "Connect to MetaMask"}
      {currentAccount && isWalletConnected && (
        <span className="account-address is-rounded">
          {`${currentAccount.slice(0, 6)}...${currentAccount.slice(
            currentAccount.length - 4,
            currentAccount.length
          )}`}
        </span>
      )}
    </button>
  );

  const renderCreateWalletContainer = () => (
    <div>
      <p>
        To create a MetaMask wallet, head over to their website and download
        their Chrome extension.
      </p>
      <a
        href="https://metamask.io/download.html"
        className="nes-btn is-primary"
        target="_blank"
        rel="noreferrer"
      >
        MetaMask for Web
      </a>
      <p>Or if you are using a mobile device, download the MetaMask app.</p>
      <a
        href="https://metamask.app.link/skAH3BaF99"
        className="nes-btn is-primary"
        target="_blank"
        rel="noreferrer"
      >
        MetaMask for iOS
      </a>
      <a
        href="https://metamask.app.link/bxwkE8oF99"
        className="nes-btn is-primary"
        target="_blank"
        rel="noreferrer"
      >
        MetaMask for Android
      </a>
    </div>
  );

  const renderContinueButton = () => (
    <button onClick={goToNextStep} className="nes-btn is-primary">
      Continue
    </button>
  );

  const renderMintButton = () => (
    <button onClick={mintNFT} className="nes-btn is-primary">
      {isMining ? "Minting..." : "Mint NFT"}
    </button>
  );

  const renderOpenSeaButton = () => (
    <a
      href={`${OPENSEA_LINK}/${CONTRACT_ADDRESS}/${tokenId}`}
      className="nes-btn is-primary"
    >
      View on OpenSea
    </a>
  );

  useEffect(() => {
    isWalletConnected();
    currentAccount && setupEventListener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  return (
    <div className="App is-dark">
      <div className="container">
        <div className="header-container">
          <h1 className="header uppercase">Draft Day</h1>
          {renderWalletContainer()}
        </div>
        {currentStepId === "wallet" && (
          <div className="nes-container with-title is-centered is-rounded is-dark">
            <h2 className="title">Create a wallet</h2>
            <p className="sub-text">
              Welcome! The day has come, it's your time to be drafted into the
              metaverse.
            </p>
            <p className="sub-text">
              Today, we're going to guide you through the process of creating a
              wallet, funding it, and minting your first-ever NFT.
            </p>
            <p className="sub-text">
              First thing's first: We're going to create a wallet!
            </p>
            <p className="sub-text">
              A wallet is needed in order to interact with Decentralized Apps
              (dApps) on the internet. dApps are an integral part of Web3 and
              the metaverse. Web3 is the side of the internet that integrates
              with blockchain technology.
            </p>
            <p className="sub-text">
              In the land of Web3, MetaMask is the go-to wallet for interacting
              with dApps. In fact, it oftentimes is the only wallet option
              available, as it is the most widely adopted – with over 10 million
              active monthly users.
            </p>
            <div>
              <h2>Choose your path</h2>
              <div className="path">
              <label className={isUseWallet ? "dim" : ""}>
                <input
                  type="radio"
                  className="nes-radio is-dark"
                  name="answer-wallet"
                  value="create"
                  onChange={handleChange}
                />
                <span>Create a MetaMask wallet</span>
              </label>
              <label className={isCreateWallet ? "dim" : ""}>
                <input
                  type="radio"
                  className="nes-radio is-dark"
                  name="answer-wallet"
                  value="use"
                  onChange={handleChange}
                />
                <span>I already have a MetaMask wallet</span>
              </label>
              </div>
              <div>
                {isCreateWallet && renderCreateWalletContainer()}
                {isUseWallet && renderWalletContainer()}
              </div>
            </div>
          </div>
        )}
        {isWalletConnected && currentStepId === "fund" && (
          <div className="nes-container with-title is-centered is-rounded is-dark">
            <h2 className="title">Fund your wallet</h2>
            <p className="sub-text">
              Funding your wallet will allow you to invest, purchase collectibes
              (NFTs), and send money to your friends.
            </p>
            <p className="sub-text">
              To fund your wallet, we recommend creating an account with{" "}
              <a
                href="https://www.coinbase.com/signup"
                target="_blank"
                rel="noreferrer"
              >
                Coinbase
              </a>{" "}
              in order to send funds to MetaMask wallet.
            </p>
            <p>
              Fund your Coinbase account using either a credit/debit card, Apple
              Pay or Google Pay – this is the quickest method as bank transfers
              may take a few days to process.
            </p>
            <p className="sub-text">
              In order to collect your Draft Day NFT in the next step, we
              recommend funding your wallet with a minimum of 0.025 ETH ($100
              USD) to cover "gas fees." More on that later!
            </p>
            <p className="sub-text">Your balance: {currentBalance}</p>
            {renderContinueButton()}
          </div>
        )}
        {isWalletConnected && currentStepId === "mint" && (
          <div className="nes-container with-title is-centered is-rounded is-dark">
            <h2 className="title">Mint your first NFT</h2>
            <p className="sub-text">
              NFTs (Non-Fungible Tokens) are digital assets that are tokenized
              and live forever on the blockchain.
            </p>
            <p className="sub-text">
              Gas fees are just another word for transaction fees in
              blockchain-speak. But unlike other payment processors, transaction
              fees in Web3 are not a fixed rate. Gas fees fluctuate depending on
              network congestion.
            </p>
            <p>
              If the network has heavy traffic gas fees are raised as a way to
              incentivize those processing the transactions through proof of
              work. This is a known painpoint in Web3 and it is on it's way to
              being phased out for more sustainable methods in Ethereum 2.0.
            </p>
            {renderMintButton()}
          </div>
        )}
        {isWalletConnected && currentStepId === "success" && (
          <div className="nes-container with-title is-centered is-rounded is-dark">
            <h2 className="title">Congratulations</h2>
            <p className="sub-text">You just minted your first NFT!</p>
            {renderOpenSeaButton()}
          </div>
        )}
        <h2 className="uppercase center">Progress</h2>
        <progress
          className="nes-progress is-dark is-primary"
          value={currentStepIndex}
          max="3"
        ></progress>
      </div>
    </div>
  );
};

export default App;
