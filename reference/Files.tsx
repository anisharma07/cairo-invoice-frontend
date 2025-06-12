import React, { useState, useEffect } from "react";
import "./Files.css";
import * as AppGeneral from "../socialcalc/index.js";
import { DATA } from "../../app-data.js";
import { Files as FilesClass, Local } from "../Storage/LocalStorage";
import {
  IonIcon,
  IonModal,
  IonItem,
  IonButton,
  IonList,
  IonLabel,
  IonAlert,
  IonItemGroup,
  IonSegment,
  IonSegmentButton,
  IonContent,
  IonSpinner,
  IonInput,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import { fileTrayFull, trash, create, cloudDownload, cloudUpload, key } from "ionicons/icons";
import { create as createClient } from "@web3-storage/w3up-client";


type DID = `did:${string}:${string}`;

const Files: React.FC<{
  store: Local;
  file: string;
  updateSelectedFile: Function;
  updateBillType: Function;
}> = (props) => {
  const [modal, setModal] = useState(null);
  const [listFiles, setListFiles] = useState(false);
  const [showAlert1, setShowAlert1] = useState(false);
  const [currentKey, setCurrentKey] = useState(null);
  const [fileSource, setFileSource] = useState<'local' | 'ipfs'>('local');
  const [ipfsFiles, setIpfsFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMoveAlert, setShowMoveAlert] = useState(false);
  const [fileToMove, setFileToMove] = useState(null);
  
  // IPFS account management
  const [userEmail, setUserEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [ipfsClient, setIpfsClient] = useState(null);
  const [userSpace, setUserSpace] = useState(null);
  const [showSpaceSetup, setShowSpaceSetup] = useState(false);
  const [spaceDid, setSpaceDid] = useState('');
  const [isSpaceCreating, setIsSpaceCreating] = useState(false);

  const initializeIpfsClient = async (email,space) => {
    try {
      setLoading(true);
      const client = await createClient();
      console.log("Client created:", client);
      
      const account = await client.login(email);
      console.log("Account logged in:", account);
      
      console.log("Setting current space:", space);
      const currSpace = await client.setCurrentSpace(space);
      console.log("Current space set:", currSpace);
      
      setUserSpace(space);
      
      // Store client in state
      setIpfsClient(client);
      
      // Check if user has any spaces
      // const spaces = await client.spaces();
      // if (spaces.length > 0) {
      //   // Use the first space
      //   await client.setCurrentSpace(spaces[0].did());
      //   let currentspace = await client.createSpace('Upload Space', { skipGatewayAuthorization: true })
      //   await client.addSpace(await currentspace.createAuthorization(client))
      //   await account.provision(currentspace.did())
      //   await client.setCurrentSpace(currentspace.did());
      //   const recovery = await currentspace.createRecovery(account.did())
      //   await client.capability.access.delegate({
      //     space: currentspace.did(),
      //     delegations: [recovery],
      //   })
      //   setUserSpace(currentspace);
        
        localStorage.setItem('ipfsUserEmail', email);
        localStorage.setItem('ipfsUserSpace', userSpace);
      // } else {
      //   // Show space setup UI
      //   setShowSpaceSetup(true);
      // }
      
      return client;
    } catch (error) {
      console.error('Error initializing IPFS client:', error);
      alert('Failed to initialize IPFS client. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new space for the user
  const createUserSpace = async () => {
    if (!ipfsClient) return;
    
    try {
      setIsSpaceCreating(true);
      
      // Create a new space
      const space = await ipfsClient.createSpace(`${userEmail}'s Space`);
      
      // Store the space DID
      const spaceDid = space.did();
      setSpaceDid(spaceDid);
      
      // Set as current space
      await ipfsClient.setCurrentSpace(spaceDid);
      setUserSpace(space);
      
      // Save to localStorage for persistence
      localStorage.setItem('ipfsUserSpace', spaceDid);
      
      setShowSpaceSetup(false);
      alert('Your IPFS space has been created successfully!');
      
      return space;
    } catch (error) {
      console.error('Error creating space:', error);
      alert('Failed to create IPFS space. Please try again.');
      return null;
    } finally {
      setIsSpaceCreating(false);
    }
  };

  // Function to retrieve all files from user's IPFS space
  const fetchIPFSFiles = async () => {
    if (!ipfsClient || !userSpace) {
      alert('Please set up your IPFS account first');
      setShowEmailInput(true);
      return;
    }
    
    setLoading(true);
    try {
      const uploads = await ipfsClient.capability.upload.list();
      console.log(uploads.results);
      
      
      const filesPromises = uploads.results.map(async (upload) => {
        try {
          const url = `https://${upload.root.toString()}.ipfs.w3s.link`;
          
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`Failed to fetch directory for ${upload.root.toString()}`);
            return null;
          }
          
          const directoryListing = await response.text();
          console.log(directoryListing);
          
          // Extract file names from the directory listing
          const fileLinks = directoryListing.match(/<a href="([^"]+)"/g) || [];
          console.log(fileLinks);
          
          // Process each file in the directory
          const files = await Promise.all(fileLinks.map(async (link) => {
            const fileName = link.match(/<a href="([^"]+)"/)[1].split('/').pop();
            console.log(fileName)
            if (fileName.endsWith('.json')) {
              const fileUrl = `${url}/${fileName}`;
              console.log(fileUrl)
              try {
                const fileResponse = await fetch(fileUrl);
                if (fileResponse.ok) {
                  const fileData = await fileResponse.json();
                  return {
                    name: fileData.name,
                    created: fileData.created,
                    modified: fileData.modified,
                    cid: upload.root.toString(),
                    path: fileName
                  };
                }
              } catch (e) {
                console.error(`Error fetching file ${fileName}:`, e);
              }
            }
            return null;
          }));
          
          return files.filter(f => f !== null);
        } catch (e) {
          console.error(`Error processing upload ${upload.root.toString()}:`, e);
          return null;
        }
      });
      
      const allFiles = (await Promise.all(filesPromises))
        .filter(f => f !== null)
        .flat();
      
      setIpfsFiles(allFiles);
    } catch (error) {
      console.error('Error fetching IPFS files:', error);
    } finally {
      setLoading(false);
    }
  };

  const retrieveFromIPFS = async (cid, path) => {
    if (!ipfsClient) {
      alert('Please set up your IPFS account first');
      return null;
    }
    
    try {
      // Construct the URL to fetch the file
      const url = `https://${cid}.ipfs.w3s.link/${path}`;
      console.log("Fetching from IPFS URL:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const fileData = await response.json();
      return fileData;
    } catch (error) {
      console.error('IPFS Retrieval Error:', error);
      throw error;
    }
  };

  const moveToLocalStorage = async (file) => {
    try {
      const fileData = await retrieveFromIPFS(file.cid, file.path);
      console.log(fileData);
      
      const localFile = FilesClass.create(
        fileData.created,
        fileData.modified,
        fileData.content,
        fileData.name,
        fileData.billType
      );
      
      props.store._saveFile(localFile);
      props.updateSelectedFile(fileData.name);
      return true;
    } catch (error) {
      console.error('Error moving file to localStorage:', error);
      return false;
    }
  };

  const editFile = (key) => {
    props.store._getFile(key).then((data) => {
      console.log(data);
      
      AppGeneral.viewFile(key, decodeURIComponent((data as any).content));
      props.updateSelectedFile(key);
      props.updateBillType((data as any).billType);
    });
  };

  const deleteFile = (key) => {
    setShowAlert1(true);
    setCurrentKey(key);
  };

  const loadDefault = () => {
    const msc = DATA["home"][AppGeneral.getDeviceType()]["msc"];
    AppGeneral.viewFile("default", JSON.stringify(msc));
    props.updateSelectedFile("default");
  };

  const _formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // useEffect(() => {
  //   const savedEmail = localStorage.getItem('ipfsUserEmail');
  //   const savedSpace = localStorage.getItem('ipfsUserSpace');
    
  //   if (savedEmail && savedSpace) {
  //     setUserEmail(savedEmail);
  //     setUserEmail(savedSpace);
  //     // Initialize client with saved email
  //     initializeIpfsClient(savedEmail,savedSpace).then(client => {
  //       if (client && savedSpace) {
  //         client.setCurrentSpace(savedSpace as DID).catch(console.error);
  //       }
  //     });
  //   }
  // }, []);

  useEffect(() => {
    if (fileSource === 'ipfs' && ipfsClient && userSpace && ipfsFiles.length === 0) {
      fetchIPFSFiles();
    }
  }, [fileSource, ipfsClient, userSpace]);

  useEffect(() => {
    if (listFiles) {
      renderFileList();
    }
  }, [listFiles, fileSource, ipfsFiles, ipfsClient, userSpace, showEmailInput, showSpaceSetup]);

  const handleEmailSubmit = async () => {
    console.log(userEmail);
    console.log(userSpace);
    
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    await initializeIpfsClient(userEmail,userSpace);
    setShowEmailInput(false);
  };

  const renderFileList = async () => {
    let content;
    
    if (fileSource === 'local') {
      const files = await props.store._getAllFiles();
      const fileList = Object.keys(files).map((key) => {
        return (
          <IonItemGroup key={key}>
            <IonItem>
              <IonLabel>{key}</IonLabel>
              {_formatDate(files[key].modified || files[key])}

              <IonIcon
                icon={create}
                color="warning"
                slot="end"
                size="large"
                onClick={() => {
                  setListFiles(false);
                  editFile(key);
                }}
              />

              <IonIcon
                icon={trash}
                color="danger"
                slot="end"
                size="large"
                onClick={() => {
                  setListFiles(false);
                  deleteFile(key);
                }}
              />
            </IonItem>
          </IonItemGroup>
        );
      });
      
      content = (
        <IonList>
          {fileList && fileList.length > 0 ? fileList : (
            <IonItem>
              <IonLabel>No local files found</IonLabel>
            </IonItem>
          )}
        </IonList>
      );
    } else {
      // IPFS files section
      if (showEmailInput) {
        content = (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Set Up Your IPFS Account</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Enter your email to create or access your IPFS space</p>
              <IonInput
                type="email"
                placeholder="Your email address"
                value={userEmail}
                onIonChange={e => setUserEmail(e.detail.value)}
              />
              <IonInput
                type="text"
                placeholder="Your Space DID KEY"
                value={userSpace}
                onIonChange={e => setUserSpace(e.detail.value)}
              />
              <IonButton 
                expand="block" 
                onClick={handleEmailSubmit}
                disabled={loading}
              >
                {loading ? <IonSpinner name="dots" /> : 'Continue'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        );
      } else if (showSpaceSetup) {
        content = (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Create Your IPFS Space</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>You don't have any IPFS spaces yet. Create one to start storing your files.</p>
              <IonButton 
                expand="block" 
                onClick={createUserSpace}
                disabled={isSpaceCreating}
              >
                {isSpaceCreating ? <IonSpinner name="dots" /> : 'Create Space'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        );
      } else if (!ipfsClient || !userSpace) {
        content = (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>IPFS Setup Required</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Please set up your IPFS account to access your files.</p>
              <IonButton 
                expand="block" 
                onClick={() => setShowEmailInput(true)}
              >
                Set Up IPFS Account
              </IonButton>
            </IonCardContent>
          </IonCard>
        );
      } else {
        // Show IPFS files
        const fileList = ipfsFiles.map((file, index) => (
          <IonItemGroup key={`${file.cid}-${index}`}>
            <IonItem>
              <IonLabel>{file.name}</IonLabel>
              {_formatDate(file.modified)}

              <IonIcon
                icon={create}
                color="warning"
                slot="end"
                size="large"
                onClick={() => {
                  setListFiles(false);
                  editFile(file.name);
                }}
              />

              <IonIcon
                icon={cloudDownload}
                color="primary"
                slot="end"
                size="large"
                onClick={() => {
                  setFileToMove(file);
                  setShowMoveAlert(true);
                }}
              />
            </IonItem>
          </IonItemGroup>
        ));
        
        content = (
          <>
            <IonCard>
              <IonCardContent>
                <p><strong>Your IPFS Space:</strong> {userSpace ? userSpace.substring(0, 20) + '...' : 'Not set'}</p>
                <IonButton 
                  expand="block" 
                  onClick={fetchIPFSFiles}
                  disabled={loading}
                >
                  {loading ? <IonSpinner name="dots" /> : 'Refresh IPFS Files'}
                </IonButton>
              </IonCardContent>
            </IonCard>
            
            <IonList>
              {loading ? (
                <div className="loading-container">
                  <IonSpinner name="crescent" />
                  <p>Loading files from IPFS...</p>
                </div>
              ) : (
                fileList && fileList.length > 0 ? fileList : (
                  <IonItem>
                    <IonLabel>No IPFS files found</IonLabel>
                  </IonItem>
                )
              )}
            </IonList>
          </>
        );
      }
    }

    const ourModal = (
      <IonModal isOpen={listFiles} onDidDismiss={() =>{ 
        setListFiles(false)
        setModal(null)
        }}>
        <IonContent>
          <IonSegment value={fileSource} onIonChange={e => setFileSource(e.detail.value as 'local' | 'ipfs')}>
            <IonSegmentButton value="local">
              <IonLabel>Local Files</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ipfs">
              <IonLabel>IPFS Files</IonLabel>
            </IonSegmentButton>
          </IonSegment>
          
          {content}
          
          <IonButton
            expand="block"
            color="secondary"
            onClick={() => {
              setListFiles(false);
              setModal(null)
            }}
          >
            Back
          </IonButton>
        </IonContent>
      </IonModal>
    );
    setModal(ourModal);
  };

  return (
    <React.Fragment>
      <IonIcon
        icon={fileTrayFull}
        className="ion-padding-end"
        slot="end"
        size="large"
        onClick={() => {
          setListFiles(true);
        }}
      />
      {modal}
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Delete file"
        message={"Do you want to delete the " + currentKey + " file?"}
        buttons={[
          { text: "No", role: "cancel" },
          {
            text: "Yes",
            handler: () => {
              props.store._deleteFile(currentKey);
              loadDefault();
              setCurrentKey(null);
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showMoveAlert}
        onDidDismiss={() => setShowMoveAlert(false)}
        header="Move to Local Storage"
        message={`Do you want to move "${fileToMove?.name}" to your local storage?`}
        buttons={[
          { text: "Cancel", role: "cancel" },
          {
            text: "Move",
            handler: async () => {
              const success = await moveToLocalStorage(fileToMove);
              if (success) {
                alert(`File "${fileToMove.name}" has been moved to local storage.`);
              } else {
                alert(`Failed to move file "${fileToMove.name}" to local storage.`);
              }
              setFileToMove(null);
            },
          },
        ]}
      />
    </React.Fragment>
  );
};

export default Files;