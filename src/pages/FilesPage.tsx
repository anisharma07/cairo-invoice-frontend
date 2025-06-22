import React, { useState } from "react";
import { IonContent, IonPage } from "@ionic/react";
import Files from "../components/Files/Files";
import { Local } from "../components/Storage/LocalStorage";
import { useTheme } from "../contexts/ThemeContext";
import "./FilesPage.css";

const FilesPage: React.FC = () => {
  const [selectedFile, updateSelectedFile] = useState("default");
  const [billType, updateBillType] = useState(1);
  const store = new Local();
  const { isDarkMode } = useTheme();

  return (
    <IonPage className={isDarkMode ? "dark-theme" : ""}>
      <IonContent fullscreen>
        <Files
          store={store}
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
          updateBillType={updateBillType}
        />
      </IonContent>
    </IonPage>
  );
};

export default FilesPage;
