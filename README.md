# HiiHive 🌐🐝  

Welcome to **HiiHive**, the ultimate platform for students, developers, and professionals to **connect**, **collaborate**, and **grow**. With HiiHive, experience a seamless blend of **community-driven knowledge hubs**, **real-time chat**, and **customized profiles**, all wrapped in a **sleek, responsive design**.

## Table of Contents  
- [Features](#features)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Project Structure](#project-structure)  
- [Technologies Used](#technologies-used)  
- [Contributing](#contributing)  
- [License](#license)  
- [Contact](#contact)  

---

## Features 🌟  

- **Google OAuth Authentication**: Easy and secure login with Google.  
- **Knowledge Hub**: Discover and share resources with college-specific and global communities.  
- **Real-Time Chat**: A sidebar for live interaction with your connections.  
- **Stories**: Share updates and experiences with an Instagram-like story feature.  
- **Responsive UI**: Optimized for mobile and desktop views, offering a dynamic experience across devices.  
- **Interactive Post System**: Easily create posts, join communities, and stay notified with a hoverable quick-access menu.  
- **Gamification**: Engage users with streak-based rewards for consistent participation in KnowledgeHub.  

---

## Installation 🚀  

### Prerequisites  

- [Node.js](https://nodejs.org/) (v14 or above)  
- A [Firebase](https://firebase.google.com/) account for authentication and database configuration  

### Steps  

1. **Clone the Repository**  
   ```bash  
   git clone https://github.com/dixitk941/hiihive.git  
   cd hiihive  
   ```  

2. **Install Dependencies**  
   ```bash  
   npm install  
   ```  

3. **Setup Firebase**  
   - Navigate to [Firebase Console](https://console.firebase.google.com/) and create a project.  
   - Enable **Google Authentication** in Firebase Authentication settings.  
   - Copy the Firebase configuration and paste it into a `firebaseConfig.js` file in the root directory.  

4. **Run the Development Server**  
   ```bash  
   npm start  
   ```  

5. **Access the App**  
   - Open `http://localhost:3000` in your browser.  

---

## Usage 🛠️  

1. **Login**: Use Google to create or log into your account.  
2. **Explore Features**:  
   - **Feed**: View posts and updates from your network and communities.  
   - **Stories**: Check out and share moments with the Story feature.  
   - **Chat**: Engage in real-time conversations with connections.  
   - **Knowledge Hub**: Access events and resources tailored to your college or community.  
3. **Post Creation**:  
   - Use the **+ Icon** in the bottom-right corner for creating posts, joining communities, or managing notifications.  

---

## Project Structure 🗂️  

```plaintext  
├── public  
│   └── index.html              # Main HTML template  
├── src  
│   ├── assets                  # Static assets (logos, icons, images)  
│   ├── components              # Reusable UI components  
│   │   ├── StoryIcon.js  
│   │   ├── SearchBar.js  
│   │   ├── PostModal.js  
│   │   └── ...  
│   ├── firebaseConfig.js       # Firebase configuration (gitignored)  
│   ├── App.js                  # Root component  
│   ├── index.js                # Application entry point  
│   └── styles                  # TailwindCSS custom styles  
└── README.md  
```  

---

## Technologies Used 🛠️  

- **React**: For building the dynamic user interface.  
- **Tailwind CSS**: For modern, utility-first styling.  
- **Firebase**: For authentication and real-time database integration.  
- **React Router**: To handle in-app navigation.  
- **React Icons**: For consistent and elegant iconography.  

---

## Contributing 🤝  

We love contributions! Follow these steps to contribute:  

1. Fork the repository.  
2. Create a new branch: `git checkout -b feature/YourFeature`.  
3. Make your changes and commit them.  
4. Push your changes: `git push origin feature/YourFeature`.  
5. Submit a pull request for review.  

---

## License 📜  

This project is licensed under the **MIT License**. For more details, refer to the `LICENSE` file.  

---

## Contact 📧  

Have questions or feedback? Get in touch with the HiiHive team:  

- Email: **dixitk941@gmail.com**  

Join **HiiHive** today, where connections turn into collaborations and ideas grow into innovation! 🌟
