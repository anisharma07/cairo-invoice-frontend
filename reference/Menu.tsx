import React, { useState, useEffect } from "react";
import * as AppGeneral from "../socialcalc/index.js";
import { Files, Local } from "../Storage/LocalStorage";
import { isPlatform, IonToast } from "@ionic/react";
import { EmailComposer } from "capacitor-email-composer";
import { Printer } from "@ionic-native/printer";
import { IonActionSheet, IonAlert } from "@ionic/react";
import { saveOutline, save, mail, print, download } from "ionicons/icons";
import medinvoiceabi from "../../utils/medinvoiceabi.json";
import { APP_NAME } from "../../app-data.js";
import { ethers } from "ethers";
import { 
  MEDT_TOKEN_ADDRESSES, 
  MEDI_INVOICE_ADDRESSES, 
  SUPPORTED_NETWORKS, 
  TOKEN_COST 
} from "../../utils/constants";
import meditokenabi from "../../utils/meditokenabi.json";
import { create } from "@web3-storage/w3up-client";
import { useSDK } from "@metamask/sdk-react";

type EmailString = `${string}@${string}`;

const Menu: React.FC<{
  showM: boolean;
  setM: Function;
  file: string;
  updateSelectedFile: Function;
  store: Local;
  bT: number;
}> = (props) => {
  const [showAlert1, setShowAlert1] = useState(false);
  const [showAlert2, setShowAlert2] = useState(false);
  const [showAlert3, setShowAlert3] = useState(false);
  const [showAlert4, setShowAlert4] = useState(false);
  const [showToast1, setShowToast1] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [numOfTokens, setNumOfTokens] = useState(0);
  const [isUserSubscribed, setIsUserSubscribed] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  /* Utility functions */
  const _validateName = async (filename) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      setToastMessage("Cannot update default file!");
      return false;
    } else if (filename === "" || !filename) {
      setToastMessage("Filename cannot be empty");
      return false;
    } else if (filename.length > 30) {
      setToastMessage("Filename too long");
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      setToastMessage("Special Characters cannot be used");
      return false;
    } else if (await props.store._checkKey(filename)) {
      setToastMessage("Filename already exists");
      return false;
    }
    return true;
  };

  const getCurrentFileName = () => {
    return props.file;
  };

  const _formatString = (filename) => {
    /* Remove whitespaces */
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  };

  const getNetworkKey = async (provider: ethers.providers.Web3Provider) => {
    const network = await provider.getNetwork();
    const chainIdHex = "0x" + network.chainId.toString(16);
    
    for (const [network, data] of Object.entries(SUPPORTED_NETWORKS)) {
      if (data.chainId === chainIdHex) {
        return network;
      }
    }
    throw new Error('Unsupported network');
  };

  const getContractAddresses = async (provider: ethers.providers.Web3Provider) => {
    const networkKey = await getNetworkKey(provider);
    console.log(networkKey);
    
    return {
      mediToken: MEDT_TOKEN_ADDRESSES[networkKey],
      mediInvoice: MEDI_INVOICE_ADDRESSES[networkKey]
    };
  };

  const fetchUserTokens = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    const { mediInvoice } = await getContractAddresses(provider);
    
    const contract = new ethers.Contract(
      mediInvoice,
      medinvoiceabi,
      signer
    );
    
    const userTokens = await contract.getUserTokens();
    console.log("User tokens: ", Number(userTokens));
    setNumOfTokens(userTokens);
  };

  const uploadToIPFS = async (fileData) => {
    try {
      // Get the saved email and space from localStorage
      const savedEmail = localStorage.getItem('ipfsUserEmail');
      const savedSpace = localStorage.getItem('ipfsUserSpace');
      
      if (!savedEmail || !savedSpace) {
        throw new Error('IPFS account not set up. Please set up your IPFS account in the Files section first.');
      }
      
      const client = await create();
      const account = await client.login(savedEmail as EmailString);
      // await client.setCurrentSpace(savedSpace);
      
      const formattedFile = new File(
        [JSON.stringify(fileData)],
        `${fileData.name}.json`,
        { type: 'application/json' }
      );
      console.log(formattedFile);
      const cid = await client.uploadDirectory([formattedFile]);
      return cid.toString();
    } catch (error) {
      console.error('IPFS Upload Error:', error);
      throw error;
    }
  };

  const updateTokenBalance = async (operation: 'SAVE' | 'SAVE_AS' | 'PRINT' | 'EMAIL') => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    const { mediToken, mediInvoice } = await getContractAddresses(provider);
    console.log(mediToken, mediInvoice);
    
    const contract = new ethers.Contract(
      mediToken,
      meditokenabi,
      signer
    );
    

    try {
      // Transfer tokens to the MediInvoice contract address for the current network
      const tx = await contract.transfer(
        mediInvoice,
        ethers.utils.parseEther(TOKEN_COST[operation])
      );
      console.log(tx);
      
      await tx.wait();
      await fetchUserTokens();
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const { mediInvoice } = await getContractAddresses(provider);
      
      const contract = new ethers.Contract(
        mediInvoice,
        medinvoiceabi,
        signer
      );
      
      const [exists, endTimeStamp] = await contract.getSubscriptionDetails();
      
      const isActive = endTimeStamp.toNumber() > Math.floor(Date.now() / 1000);
      setIsUserSubscribed(isActive);
      
      if (exists) {
        setSubscriptionEndDate(new Date(endTimeStamp.toNumber() * 1000));
      } else {
        setSubscriptionEndDate(null);
      }
      
      if (numOfTokens <= 0 && !isActive) {
        setShowSubscriptionAlert(true);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const subscribe = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const { mediInvoice } = await getContractAddresses(provider);
      
      const contract = new ethers.Contract(
        mediInvoice,
        medinvoiceabi,
        signer
      );
      
      const tx = await contract.subscribe();
      
      await tx.wait();
      
      await checkSubscriptionStatus();
      await fetchUserTokens();
      
      alert("Subscription successful! Your subscription is valid for 1 year.");
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to process subscription. Please try again.");
    }
  };

  useEffect(() => {
    try {
      if(connected && provider ){
        fetchUserTokens();
        checkSubscriptionStatus();
      }
    } catch (e) {
      console.log("Error getting user data: ", e);
    }
  }, [provider, connected, chainId]);

  const doPrint = async () => {
    if (numOfTokens < Number(TOKEN_COST.PRINT)) {
      alert(`You need at least ${TOKEN_COST.PRINT} PPT token to print`);
      return;
    }

    try {
      await updateTokenBalance('PRINT');
      if (isPlatform("hybrid")) {
        const printer = Printer;
        printer.print(AppGeneral.getCurrentHTMLContent());
      } else {
        const content = AppGeneral.getCurrentHTMLContent();
        const printWindow = window.open("/printwindow", "Print Invoice");
        printWindow.document.write(content);
        printWindow.print();
      }
    } catch (error) {
      alert("Failed to process token payment");
    }
  };

  const doSave = async () => {
    if (props.file === "default") {
      setShowAlert1(true);
      return;
    }

    if (numOfTokens < Number(TOKEN_COST.SAVE)) {
      alert(`You need at least ${TOKEN_COST.SAVE} PPT token to save`);
      return;
    }

    try {
      await updateTokenBalance('SAVE');
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const data = props.store._getFile(props.file);
      const file = new Files(
        (data as any).created,
        new Date().toString(),
        content,
        props.file,
        props.bT
      );
      props.store._saveFile(file);
      props.updateSelectedFile(props.file);
      setShowAlert2(true);
    } catch (error) {
      alert("Failed to process token payment");
    }
  };

  const doSaveAs = async (filename) => {
    if (!filename) return;
    
    // if (numOfTokens < Number(TOKEN_COST.SAVE_AS)) {
      //   alert(`You need at least ${TOKEN_COST.SAVE_AS} PPT token to save`);
      //   return;
      // }
      
      if (await _validateName(filename)) {
        try {
          const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
          const fileData = {
          name: filename,
          content: content,
          created: new Date().toString(),
          modified: new Date().toString(),
          billType : props.bT
        };
        
        try {
          // Upload to IPFS
          const cid = await uploadToIPFS(fileData);
          await updateTokenBalance('SAVE_AS');

          // Save the CID reference locally
          const file = new Files(
            new Date().toString(),
            new Date().toString(),
            content,
            filename,
            props.bT,
          );
          props.store._saveFile(file);
          props.updateSelectedFile(filename);
          setShowAlert4(true);
          window.alert(`File ${filename} saved successfully! IPFS CID: ${cid}`);
        } catch (ipfsError) {
          console.error('IPFS upload failed:', ipfsError);
          
          // // If IPFS upload fails, still save locally
          // const file = new Files(
          //   new Date().toString(),
          //   new Date().toString(),
          //   content,
          //   filename,
          //   props.bT,
          //   cid
          // );
          // props.store._saveFile(file);
          // props.updateSelectedFile(filename);
          // setShowAlert4(true);
          // window.alert(`File ${filename} saved locally. IPFS upload failed: ${ipfsError.message}`);
        }
      } catch (error) {
        alert("Failed to process token payment");
      }
    } else {
      setShowToast1(true);
    }
  };

  const sendEmail = async () => {
    if (numOfTokens < Number(TOKEN_COST.EMAIL)) {
        alert(`You need at least ${TOKEN_COST.EMAIL} PPT token to email the invoice`);
        return;
    }

    try {
        await updateTokenBalance('EMAIL');
        const content = AppGeneral.getCurrentHTMLContent();


        if (isPlatform("hybrid")) {
            
          EmailComposer.open({
            to: ["jackdwell08@gmail.com"],
            cc: [],
            bcc: [],
            body: "PFA",
            attachments: [{ type: "base64", path: btoa(content), name: "Invoice.html" }],
            subject: `${APP_NAME} attached`,
            isHtml: true,
          });
        } else {
            
            // const link = document.createElement('a');
            // link.href = URL.createObjectURL(blob);
            // link.download = `Invoice_${new Date().toISOString().split('T')[0]}.html`;
            // document.body.appendChild(link);
            // link.click();
            // document.body.removeChild(link);
            
            const subject = encodeURIComponent(`${APP_NAME} - Your Invoice`);
            const body = encodeURIComponent("Please find the attached invoice.");
            const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
            
            window.open(mailtoLink, '_self');
            
            alert("Please attach it to the email that opens.");
        }
      } catch (error) {
          console.error('Email sending error:', error);
          alert("Failed to process token payment or prepare invoice for email. Please try again.");
      }
  };

  const exportAsHTML = async () => {
    if (numOfTokens < Number(TOKEN_COST.EMAIL)) {
        alert(`You need at least ${TOKEN_COST.EMAIL} PPT token to export the invoice`);
        return;
    }

    try {
        await updateTokenBalance('EMAIL');
        const content = AppGeneral.getCurrentHTMLContent(); // Get the invoice content

        // Create a Blob for the invoice content
        const blob = new Blob([`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-container { 
                max-width: 800px; 
                margin: 0 auto; 
                border: 1px solid #ddd; 
                padding: 20px; 
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              ${content}
            </div>
          </body>
          </html>
        `], { type: 'text/html' });

        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("Invoice has been exported as HTML file.");
    } catch (error) {
        console.error('Export error:', error);
        alert("Failed to process token payment or export invoice. Please try again.");
    }
  };

  return (
    <React.Fragment>
      <IonActionSheet
        animated
        keyboardClose
        isOpen={props.showM}
        onDidDismiss={() => props.setM()}
        buttons={[
          {
            text: "Save",
            icon: saveOutline,
            handler: async () => {
              if (numOfTokens >= Number(TOKEN_COST.SAVE)) {
                await doSave();
              } else {
                alert(`You need at least ${TOKEN_COST.SAVE} PPT token to save the file`);
              }
            },
          },
          {
            text: "Save As",
            icon: save,
            handler: () => {
              if (numOfTokens >= Number(TOKEN_COST.SAVE_AS)) {
                setShowAlert3(true);
              } else {
                alert(`You need at least ${TOKEN_COST.SAVE_AS} PPT token to save the file`);
              }
            },
          },
          {
            text: "Print",
            icon: print,
            handler: async () => {
              if (numOfTokens >= Number(TOKEN_COST.PRINT)) {
                await doPrint();
              } else {
                alert(`You need at least ${TOKEN_COST.PRINT} PPT token to print`);
              }
            },
          },
          {
            text: "Email",
            icon: mail,
            handler: async () => {
              if (numOfTokens >= Number(TOKEN_COST.EMAIL)) {
                await sendEmail();
              } else {
                alert(`You need at least ${TOKEN_COST.EMAIL} PPT token to email`);
              }
            },
          },
          {
            text: "Export as HTML",
            icon: download,
            handler: async () => {
              if (numOfTokens >= Number(TOKEN_COST.EMAIL)) {
                await exportAsHTML();
              } else {
                alert(`You need at least ${TOKEN_COST.EMAIL} PPT token to email`);
              }
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Alert Message"
        message={
          "Cannot update <strong>" + getCurrentFileName() + "</strong> file!"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert2}
        onDidDismiss={() => setShowAlert2(false)}
        header="Save"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> updated successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert3}
        onDidDismiss={() => setShowAlert3(false)}
        header="Save As"
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
        ]}
        buttons={[
          {
            text: "Ok",
            handler: (alertData) => {
              doSaveAs(alertData.filename);
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert4}
        onDidDismiss={() => setShowAlert4(false)}
        header="Save As"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> saved successfully"
        }
        buttons={["Ok"]}
      />
      <IonToast
        animated
        isOpen={showToast1}
        onDidDismiss={() => {
          setShowToast1(false);
          setShowAlert3(true);
        }}
        position="bottom"
        message={toastMessage}
        duration={500}
      />
      <IonAlert
        isOpen={showSubscriptionAlert}
        onDidDismiss={() => setShowSubscriptionAlert(false)}
        header="No Tokens Found"
        message="You don't have any PPT Tokens. Would you like to subscribe to receive 10 tokens? Subscription is valid for 1 year."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Subscription cancelled');
            }
          },
          {
            text: 'Subscribe',
            handler: () => {
              subscribe();
            }
          }
        ]}
      />
    </React.Fragment>
  );
};

export default Menu;
