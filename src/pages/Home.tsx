import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonPopover,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonAlert,
} from "@ionic/react";
import { APP_NAME, DATA } from "../app-data-new";
import * as AppGeneral from "../components/socialcalc/index.js";
import { useEffect, useState, useRef } from "react";
import { Local, File } from "../components/Storage/LocalStorage";
import {
  settings,
  star,
  informationCircle,
  menu,
  pencil,
  share,
  save,
  saveOutline,
  saveSharp,
} from "ionicons/icons";
import "./Home.css";
import NewFile from "../components/NewFile/NewFile";
import WalletConnection from "../components/wallet/WalletConnection";
import Subscription from "../components/wallet/Subscription";
import MedTokenBalance from "../components/wallet/MedTokenBalance";
import { useAccount } from "@starknet-react/core";
import { uploadJSONToIPFS } from "../utils/ipfs";
import { useSaveFile } from "../hooks/useContractWrite";
import Menu from "../components/Menu/Menu";
import { useTheme } from "../contexts/ThemeContext";
import { moon, sunny } from "ionicons/icons";

const Home: React.FC = () => {
  const { address, account } = useAccount();
  const { saveFile, isPending: isSaving } = useSaveFile();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [showMenu, setShowMenu] = useState(false);
  const [selectedFile, updateSelectedFile] = useState("default");
  const [billType, updateBillType] = useState(1);
  const [device] = useState("Android");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [keyboardShortcutsEvent, setKeyboardShortcutsEvent] = useState<
    Event | undefined
  >(undefined);
  const [pendingSaveOperation, setPendingSaveOperation] = useState<
    "local" | "blockchain" | null
  >(null);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState("");
  const [saveAsOperation, setSaveAsOperation] = useState<
    "local" | "blockchain" | null
  >(null);

  const store = new Local();
  const menuRef = useRef<any>(null);

  const closeMenu = () => {
    setShowMenu(false);
  };

  const activateFooter = (footer) => {
    AppGeneral.activateFooterButton(footer);
  };

  // Check if file exists in local storage
  const checkFileExists = async (fileName: string): Promise<boolean> => {
    try {
      const fileData = await store._getFile(fileName);
      return fileData !== null && fileData !== undefined;
    } catch (error) {
      return false;
    }
  };

  // Handle Save As operation
  const handleSaveAs = (operation: "local" | "blockchain") => {
    const defaultName = `invoice_${
      new Date().toISOString().replace(/[:.]/g, "-").split("T")[0]
    }_${new Date().toLocaleTimeString().replace(/[:.]/g, "-")}`;
    setSaveAsFileName(defaultName);
    setSaveAsOperation(operation);
    setShowSaveAsDialog(true);
  };

  // Execute save with specified filename
  const executeSaveAs = async () => {
    if (!saveAsFileName || !saveAsFileName.trim()) {
      setToastMessage("Please enter a valid filename");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    const trimmedFileName = saveAsFileName.trim();

    // Close the dialog
    setShowSaveAsDialog(false);

    // Update the selected file to the new name
    updateSelectedFile(trimmedFileName);

    // Execute the save operation with the new filename
    if (saveAsOperation === "local") {
      await performLocalSave(trimmedFileName);
    } else if (saveAsOperation === "blockchain") {
      await performBlockchainSave(trimmedFileName);
    }

    // Clean up
    setSaveAsFileName("");
    setSaveAsOperation(null);
  };

  // Execute save with filename directly from dialog
  const executeSaveAsWithFilename = async (filename: string) => {
    // Update the selected file to the new name
    updateSelectedFile(filename);

    // Execute the save operation with the new filename
    if (saveAsOperation === "local") {
      await performLocalSave(filename);
    } else if (saveAsOperation === "blockchain") {
      await performBlockchainSave(filename);
    }

    // Clean up
    setSaveAsFileName("");
    setSaveAsOperation(null);
  };

  // Perform actual local save operation
  const performLocalSave = async (fileName: string) => {
    try {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const file = new File(
        new Date().toString(),
        new Date().toString(),
        content,
        fileName,
        billType
      );
      await store._saveFile(file);

      setToastMessage(`File "${fileName}" saved locally!`);
      setToastColor("success");
      setShowToast(true);
    } catch (error) {
      console.error("Error saving file:", error);
      setToastMessage("Failed to save file locally.");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  // Perform actual blockchain save operation
  const performBlockchainSave = async (fileName: string) => {
    if (!address) {
      setToastMessage("Please connect your wallet first");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    try {
      setToastMessage("Uploading to IPFS and blockchain...");
      setToastColor("success");
      setShowToast(true);

      // Get current spreadsheet content
      const content = AppGeneral.getSpreadsheetContent();

      // Create file metadata
      const fileData = {
        fileName: fileName,
        content: content,
        timestamp: new Date().toISOString(),
        billType: billType,
        creator: address,
      };

      // Upload to IPFS
      const ipfsHash = await uploadJSONToIPFS(fileData);
      console.log("File uploaded to IPFS:", ipfsHash);

      // Save to blockchain
      await saveFile(fileName, ipfsHash);

      // Also save locally
      const localFile = new File(
        new Date().toString(),
        new Date().toString(),
        encodeURIComponent(content),
        fileName,
        billType
      );
      await store._saveFile(localFile);

      setToastMessage(
        `File saved to blockchain! IPFS: ${ipfsHash.substring(0, 10)}...`
      );
      setToastColor("success");
      setShowToast(true);
    } catch (error) {
      console.error("Error saving to blockchain:", error);
      setToastMessage("Failed to save to blockchain. Please try again.");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  // Create new file with automatic naming for pending save operations
  const createNewFileWithPendingSave = () => {
    // Generate a timestamped filename
    const timestamp =
      new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
      "_" +
      new Date().toLocaleTimeString().replace(/[:.]/g, "-");
    const newFileName = `invoice_${timestamp}`;

    // Get current spreadsheet content (including any edits made to default file)
    const currentContent = AppGeneral.getSpreadsheetContent();

    // Save current content if not default (preserving existing files)
    if (selectedFile !== "default") {
      const content = encodeURIComponent(currentContent);
      const data = store._getFile(selectedFile);
      const file = new File(
        (data as any)?.created || new Date().toString(),
        new Date().toString(),
        content,
        selectedFile,
        billType
      );
      store._saveFile(file);
    }

    // Create new file with the current content (preserving edits from default)
    // Instead of loading default template, use the current spreadsheet content
    AppGeneral.viewFile(newFileName, currentContent);
    updateSelectedFile(newFileName);

    console.log(
      `New file created: ${newFileName} with current content preserved, pending operation: ${pendingSaveOperation}`
    );
  };

  // Save functions similar to Menu component
  const doSaveLocal = async () => {
    console.log("doSaveLocal called via keyboard shortcut");

    if (selectedFile === "default") {
      // Set pending operation and trigger new file creation
      setPendingSaveOperation("local");
      setToastMessage("Creating new file first, then saving locally...");
      setToastColor("warning");
      setShowToast(true);

      // Create a new file with a timestamped name
      createNewFileWithPendingSave();
      return;
    }

    // Check if file exists in storage
    const fileExists = await checkFileExists(selectedFile);

    if (!fileExists) {
      // File doesn't exist, show Save As dialog
      console.log(
        `File "${selectedFile}" doesn't exist, showing Save As dialog`
      );
      handleSaveAs("local");
      return;
    }

    // File exists, perform normal save
    await performLocalSave(selectedFile);
  };

  const doSaveToBlockchain = async () => {
    if (selectedFile === "default") {
      // Set pending operation and trigger new file creation
      setPendingSaveOperation("blockchain");
      setToastMessage("Creating new file first, then saving to blockchain...");
      setToastColor("warning");
      setShowToast(true);

      // Create a new file with a timestamped name
      createNewFileWithPendingSave();
      return;
    }

    if (!address) {
      setToastMessage("Please connect your wallet first");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    // Check if file exists in storage
    const fileExists = await checkFileExists(selectedFile);

    if (!fileExists) {
      // File doesn't exist, show Save As dialog
      console.log(
        `File "${selectedFile}" doesn't exist, showing Save As dialog`
      );
      handleSaveAs("blockchain");
      return;
    }

    // File exists, perform normal save
    await performBlockchainSave(selectedFile);
  };

  // Keyboard shortcut handler
  const handleKeyboardShortcuts = (event: KeyboardEvent) => {
    // Only handle shortcuts when not in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.contentEditable === "true"
    ) {
      return;
    }

    // Debug logging
    if (event.ctrlKey) {
      console.log(
        `Keyboard shortcut detected: Ctrl+${event.shiftKey ? "Shift+" : ""}${
          event.key
        }`
      );
    }

    // Ctrl+S for local save
    if (event.ctrlKey && event.key === "s" && !event.shiftKey) {
      console.log(
        "Ctrl+S detected - preventing default and calling doSaveLocal"
      );
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      doSaveLocal();
      return false;
    }
    // Ctrl+Shift+S for blockchain save
    else if (event.ctrlKey && event.shiftKey && event.key === "S") {
      console.log("Ctrl+Shift+S detected - calling doSaveToBlockchain");
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      doSaveToBlockchain();
      return false;
    }
    // Ctrl+N for new file (trigger the new file modal)
    else if (event.ctrlKey && event.key === "n") {
      console.log("Ctrl+N detected - opening new file dialog");
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // Find and click the new file button
      const newFileButton = document.querySelector(
        '[data-testid="new-file-btn"]'
      ) as HTMLElement;
      if (newFileButton) {
        newFileButton.click();
      }
      return false; // Additional prevention
    }
    // Ctrl+O for open files (trigger the files modal)
    else if (event.ctrlKey && event.key === "o") {
      console.log("Ctrl+O detected - opening files dialog");
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // Find and click the files button
      const filesButton = document.querySelector(
        '[data-testid="files-btn"]'
      ) as HTMLElement;
      if (filesButton) {
        filesButton.click();
      }
      return false; // Additional prevention
    }
  };

  useEffect(() => {
    // Add keyboard event listener with capture mode for higher priority
    document.addEventListener("keydown", handleKeyboardShortcuts, true);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcuts, true);
    };
  }, [selectedFile, billType, address]); // Dependencies for the save functions

  useEffect(() => {
    const data = DATA["home"][device]["msc"];
    AppGeneral.initializeApp(JSON.stringify(data));

    // Disable SocialCalc's built-in Ctrl+S functionality to prevent conflicts
    // Use a timeout to ensure SocialCalc is fully initialized
    setTimeout(() => {
      const globalThis = window as any;
      if (globalThis.SocialCalc && globalThis.SocialCalc.Constants) {
        globalThis.SocialCalc.Constants.AllowCtrlS = false;
        console.log("SocialCalc Ctrl+S functionality disabled");
      }
    }, 1000);
  }, []);

  useEffect(() => {
    activateFooter(billType);
  }, [billType]);

  // Handle pending save operations after new file creation
  useEffect(() => {
    if (pendingSaveOperation && selectedFile !== "default") {
      console.log(
        `Executing pending ${pendingSaveOperation} save operation for file: ${selectedFile}`
      );

      // Execute the pending save operation
      if (pendingSaveOperation === "local") {
        doSaveLocal();
      } else if (pendingSaveOperation === "blockchain") {
        doSaveToBlockchain();
      }

      // Clear the pending operation
      setPendingSaveOperation(null);
    }
  }, [selectedFile, pendingSaveOperation]);

  const footers = DATA["home"][device]["footers"];
  const footersList = footers.map((footerArray) => {
    return (
      <IonButton
        key={footerArray.index}
        color="light"
        className="ion-no-margin"
        style={{
          whiteSpace: "nowrap",
          minWidth: "max-content",
          marginRight: "8px",
          flexShrink: 0,
        }}
        onClick={() => {
          updateBillType(footerArray.index);
          activateFooter(footerArray.index);
        }}
      >
        {footerArray.name}
      </IonButton>
    );
  });

  return (
    <IonPage className={isDarkMode ? "dark-theme" : ""}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle slot="start" className="editing-title">
            <IonIcon
              icon={pencil}
              size="medium"
              style={{ marginRight: "8px" }}
            />
            {selectedFile}
          </IonTitle>

          <IonButtons slot="end" className="ion-padding-end">
            <NewFile
              file={selectedFile}
              updateSelectedFile={updateSelectedFile}
              store={store}
              billType={billType}
              data-testid="new-file-btn"
            />
            <IonIcon
              icon={saveSharp}
              size="large"
              onClick={(e) => {
                setShowMenu(true);
              }}
              style={{ cursor: "pointer" }}
            />

            <WalletConnection />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonToolbar color="secondary">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              overflowX: "auto",
              padding: "8px 16px",
              width: "100%",
              alignItems: "center",
            }}
          >
            {footersList}
          </div>
        </IonToolbar>

        <div id="container">
          <div id="workbookControl"></div>
          <div id="tableeditor"></div>
          {/* <div id="msg"></div> */}
        </div>

        {/* Toast for save notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />

        {/* Save As Dialog */}
        <IonAlert
          isOpen={showSaveAsDialog}
          onDidDismiss={() => {
            setShowSaveAsDialog(false);
            setSaveAsFileName("");
            setSaveAsOperation(null);
          }}
          header={`Save As - ${
            saveAsOperation === "local" ? "Local Storage" : "Blockchain"
          }`}
          message="Enter a filename for your invoice:"
          inputs={[
            {
              name: "filename",
              type: "text",
              placeholder: "Enter filename...",
              value: saveAsFileName,
              attributes: {
                maxlength: 50,
              },
            },
          ]}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setSaveAsFileName("");
                setSaveAsOperation(null);
              },
            },
            {
              text: "Save",
              handler: (data) => {
                if (data.filename && data.filename.trim()) {
                  setSaveAsFileName(data.filename.trim());
                  // Close dialog and execute save
                  setShowSaveAsDialog(false);
                  // Use setTimeout to ensure state updates
                  setTimeout(async () => {
                    await executeSaveAsWithFilename(data.filename.trim());
                  }, 100);
                } else {
                  setToastMessage("Please enter a valid filename");
                  setToastColor("warning");
                  setShowToast(true);
                  return false; // Prevent dialog from closing
                }
              },
            },
          ]}
        />
        <Menu
          showM={showMenu}
          setM={() => setShowMenu(false)}
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
          store={store}
          bT={billType}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
