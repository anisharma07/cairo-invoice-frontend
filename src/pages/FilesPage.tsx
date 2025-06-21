import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { folder, refresh, moon, sunny } from "ionicons/icons";
import Files from "../components/Files/Files";
import { Local } from "../components/Storage/LocalStorage";
import WalletConnection from "../components/wallet/WalletConnection";
import MedTokenBalance from "../components/wallet/MedTokenBalance";
import { useTheme } from "../contexts/ThemeContext";
import "./FilesPage.css";

const FilesPage: React.FC = () => {
  const [selectedFile, updateSelectedFile] = useState("default");
  const [billType, updateBillType] = useState(1);
  const store = new Local();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <IonPage className={isDarkMode ? "dark-theme" : ""}>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Files</IonTitle>
            <IonButtons slot="end">
              <IonButton
                fill="clear"
                onClick={toggleDarkMode}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                <IonIcon icon={isDarkMode ? sunny : moon} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <div className="files-page-container">
          <Files
            store={store}
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
            updateBillType={updateBillType}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FilesPage;
