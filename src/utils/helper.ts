// Function to generate invoice filename with current datetime
export const generateInvoiceFilename = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `invoice-${year}${month}${day}-${hours}${minutes}${seconds}`;
};

// Function to select text in input field after dialog opens

export const selectInputText = (inputElement: HTMLIonInputElement) => {
  if (inputElement && inputElement.getInputElement) {
    inputElement.getInputElement().then((nativeInput) => {
      if (nativeInput) {
        nativeInput.select();
      }
    });
  }
};

// Add a helper function to clean server filenames
export const cleanServerFilename = (filename: string): string => {
  // Remove "server_" prefix if it exists
  let cleanName = filename.startsWith("server_")
    ? filename.substring(7)
    : filename;

  // Remove ".json" extension if it exists
  cleanName = cleanName.endsWith(".json") ? cleanName.slice(0, -5) : cleanName;

  return cleanName;
};
