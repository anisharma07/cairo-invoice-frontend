import React, { useState } from "react";
import * as AppGeneral from "../socialcalc/index.js";
import { File, Local } from "../Storage/LocalStorage";
import { DATA } from "../../app-data-new";
import { IonAlert, IonIcon, IonToast } from "@ionic/react";
import { add, addCircle, addOutline, documentText } from "ionicons/icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useInvoice } from "../../contexts/InvoiceContext";
import { addIcons } from "ionicons";

const NewFile: React.FC = () => {
  const [showAlertNewFileCreated, setShowAlertNewFileCreated] = useState(false);
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [originalFileContent, setOriginalFileContent] = useState<string>("");
  const { isDarkMode } = useTheme();
  const [device] = useState("Android");
  const { selectedFile, billType, store, updateSelectedFile } = useInvoice();

  // Check if current file has unsaved changes
  const hasUnsavedChanges = async (): Promise<boolean> => {
    try {
      const currentContent = AppGeneral.getSpreadsheetContent();

      // If it's the default file, check if content differs from template
      if (selectedFile === "default") {
        const defaultTemplate = DATA["home"][device]["msc"];
        const templateContent = JSON.stringify(defaultTemplate);

        // Compare current content with default template
        // Use a more robust comparison by normalizing whitespace
        const normalizedCurrent = currentContent.replace(/\s+/g, " ").trim();
        const normalizedTemplate = templateContent.replace(/\s+/g, " ").trim();

        return normalizedCurrent !== normalizedTemplate;
      }

      // For existing files, compare current content with saved content
      try {
        const savedData = await store._getFile(selectedFile);

        if (!savedData || !savedData.content) {
          // File doesn't exist in storage or has no content, check against template
          const defaultTemplate = DATA["home"][device]["msc"];
          return currentContent !== JSON.stringify(defaultTemplate);
        }

        const savedContent = decodeURIComponent(savedData.content);

        // Use normalized comparison for more accurate detection
        const normalizedCurrent = currentContent.replace(/\s+/g, " ").trim();
        const normalizedSaved = savedContent.replace(/\s+/g, " ").trim();

        return normalizedCurrent !== normalizedSaved;
      } catch (storageError) {
        console.log("File not found in storage, assuming changes exist");
        // If file doesn't exist in storage, assume there are changes
        return true;
      }
    } catch (error) {
      console.error("Error checking for unsaved changes:", error);
      // If we can't determine, assume there are changes to be safe
      return true;
    }
  };

  const handleNewFileClick = async () => {
    const hasChanges = await hasUnsavedChanges();

    if (hasChanges) {
      // Store current content in case user wants to save
      setOriginalFileContent(AppGeneral.getSpreadsheetContent());
      setShowUnsavedChangesAlert(true);
    } else {
      // No unsaved changes, proceed directly
      createNewFile();
    }
  };

  const createNewFile = () => {
    // Save current file if it's not default
    if (selectedFile !== "default") {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const data = store._getFile(selectedFile);
      const file = new File(
        (data as any)?.created || new Date().toString(),
        new Date().toString(),
        content,
        selectedFile,
        billType
      );
      store._saveFile(file);
      updateSelectedFile(selectedFile);
    }

    // Create new file with default template
    const msc = DATA["home"][device]["msc"];

    // Update the selected file first
    updateSelectedFile("default");

    // Use setTimeout to ensure state updates before loading new content
    setTimeout(() => {
      AppGeneral.viewFile("default", JSON.stringify(msc));
      setShowAlertNewFileCreated(true);
    }, 100);
  };

  const saveCurrentAndCreateNew = () => {
    // Save current file before creating new one
    if (selectedFile === "default") {
      // For default files, show save-as dialog to let user name the file
      setShowSaveAsDialog(true);
    } else {
      // Save existing file
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const data = store._getFile(selectedFile);
      const file = new File(
        (data as any)?.created || new Date().toString(),
        new Date().toString(),
        content,
        selectedFile,
        billType
      );
      store._saveFile(file);

      // Now create new file
      createNewFile();
      setShowUnsavedChangesAlert(false);
    }
  };

  const saveWithCustomName = (fileName: string) => {
    const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
    const file = new File(
      new Date().toString(),
      new Date().toString(),
      content,
      fileName,
      billType
    );
    store._saveFile(file);

    // Show success message
    setToastMessage(`File "${fileName}" saved successfully!`);
    setShowToast(true);

    // Update the selected file to the saved file temporarily
    updateSelectedFile(fileName);

    // Now create new file after a short delay
    setTimeout(() => {
      createNewFile();
    }, 100);

    setShowUnsavedChangesAlert(false);
    setShowSaveAsDialog(false);
  };

  return (
    <React.Fragment>
      <IonIcon
        icon={addCircle}
        slot="end"
        className="new-file-icon"
        size="large"
        data-testid="new-file-btn"
        onClick={handleNewFileClick}
        title="Create New File"
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <IonAlert
        isOpen={showUnsavedChangesAlert}
        onDidDismiss={() => setShowUnsavedChangesAlert(false)}
        header="⚠️ Unsaved Changes"
        message="You have unsaved changes in the current file. What would you like to do?"
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {
              setShowUnsavedChangesAlert(false);
            },
          },
          {
            text: "Discard Changes",
            role: "destructive",
            handler: () => {
              createNewFile();
              setShowUnsavedChangesAlert(false);
            },
          },
          {
            text: "Save & New File",
            handler: () => {
              saveCurrentAndCreateNew();
            },
          },
        ]}
      />

      {/* Toast for validation messages */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastMessage.includes("successfully") ? "success" : "warning"}
        position="top"
      />

      {/* Save As Dialog for Default Files */}
      <IonAlert
        isOpen={showSaveAsDialog}
        onDidDismiss={() => setShowSaveAsDialog(false)}
        header="💾 Save Current File"
        message="Please enter a name for your current invoice:"
        inputs={[
          {
            name: "filename",
            type: "text",
            placeholder: `invoice_${new Date().toISOString().split("T")[0]}`,
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
              setShowSaveAsDialog(false);
              setShowUnsavedChangesAlert(false);
            },
          },
          {
            text: "Save & New File",
            handler: (data) => {
              let fileName = data.filename?.trim();

              // If no filename provided, use default with date
              if (!fileName) {
                fileName = `invoice_${new Date().toISOString().split("T")[0]}`;
              }

              // Basic validation
              if (fileName.length > 50) {
                setToastMessage("Filename is too long (max 50 characters)");
                setShowToast(true);
                return false;
              }

              // Check for invalid characters
              if (!/^[a-zA-Z0-9-_. ]*$/.test(fileName)) {
                setToastMessage(
                  "Filename contains invalid characters. Use only letters, numbers, spaces, hyphens, underscores, and dots."
                );
                setShowToast(true);
                return false;
              }

              saveWithCustomName(fileName);
              return true;
            },
          },
        ]}
      />

      {/* New File Created Confirmation */}
      <IonAlert
        animated
        isOpen={showAlertNewFileCreated}
        onDidDismiss={() => setShowAlertNewFileCreated(false)}
        header="✅ Success"
        message={"New file created successfully!"}
        buttons={["Ok"]}
      />
    </React.Fragment>
  );
};

export default NewFile;
