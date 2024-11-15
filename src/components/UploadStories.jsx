import React, { useState } from "react";
import { storage, db } from "./firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, query, where, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore";

const Stories = ({ currentUser }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return;

    try {
      // Step 1: Query for any existing story within the last 12 hours
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const storiesRef = collection(db, "stories");
      const userStoriesQuery = query(
        storiesRef,
        where("uid", "==", currentUser.uid),
        where("timestamp", ">=", twelveHoursAgo)
      );
      const existingStoriesSnapshot = await getDocs(userStoriesQuery);

      if (!existingStoriesSnapshot.empty) {
        alert("You can only upload one story every 12 hours.");
        return;
      }

      // Step 2: Upload the file to Firebase Storage
      const storageRef = ref(storage, `stories/${currentUser.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
        },
        async () => {
          const downloadURL = await getDownloadURL(storageRef);

          // Step 3: Add the story to the Firestore `stories` collection
          await addDoc(storiesRef, {
            uid: currentUser.uid,
            avatar: currentUser.avatar || "", // Ensure avatar URL is available
            username: currentUser.username,   // Optionally include username
            url: downloadURL,
            type: file.type.startsWith("image/") ? "image" : "video",
            timestamp: serverTimestamp(),
          });

          setFile(null);
          setProgress(0);

          // Step 4: Schedule the story deletion after 12 hours
          setTimeout(async () => {
            // Re-query and delete the document
            const outdatedQuery = query(
              storiesRef,
              where("uid", "==", currentUser.uid),
              where("url", "==", downloadURL)
            );
            const outdatedSnapshot = await getDocs(outdatedQuery);
            outdatedSnapshot.forEach(async (doc) => {
              const storageRefToDelete = ref(storage, `stories/${currentUser.uid}/${file.name}`);
              await deleteObject(storageRefToDelete); // Remove from storage
              await deleteDoc(doc.ref); // Remove from Firestore
            });
          }, 12 * 60 * 60 * 1000); // 12 hours
        }
      );
    } catch (error) {
      console.error("Error uploading story:", error);
    }
  };

  return (
    <div>
      <h2>Upload Story</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept="image/*,video/*"
      />
      {file && (
        <div>
          <button onClick={handleUpload}>Upload Story</button>
          <progress value={progress} max="100" />
        </div>
      )}
    </div>
  );
};

export default Stories;
