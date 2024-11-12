# HiiHive

Welcome to **HiiHive**, a platform where students, developers, and professionals can connect, share knowledge, and grow together. HiiHive brings community-driven knowledge hubs, real-time chat, and personalized profiles into one elegant, user-friendly environment.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **User Authentication**: Simple login with Google OAuth.
- **Community and Knowledge Hub**: Connect with like-minded individuals and share resources.
- **Real-Time Chat**: Interact with your network through a live chat sidebar.
- **Responsive Design**: Optimized for both mobile and desktop views.
- **Story Feature**: Share updates with friends through an Instagram-like story feature.

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or above)
- [Firebase](https://firebase.google.com/) account for OAuth configuration

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
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Google Authentication in Firebase Authentication settings.
   - Copy your Firebase configuration details into a `firebaseConfig.js` file in the root directory.

4. **Start the Development Server**
   ```bash
   npm start
   ```

5. **Access the App**
   - The app runs on `http://localhost:3000`.

---

## Usage

1. **Login**: Sign in using Google to create an account or log in.
2. **Navigation**:
   - **Feed**: View community posts and updates.
   - **Stories**: Check out recent stories from your network.
   - **Chat Sidebar**: Engage in real-time chats.
3. **Create a Post**: Use the bottom-right hoverable icon to create a post, join a community, or access notifications.
4. **Responsive Experience**:
   - Desktop: A landscape split-view with login on the left and app description on the right.
   - Mobile: Top-and-bottom stacking for easy navigation.

---

## Project Structure

```plaintext
├── public
│   └── index.html              # Main HTML template
├── src
│   ├── assets                  # Static assets (e.g., logo, images)
│   ├── components              # Reusable UI components
│   │   ├── StoryIcon.js
│   │   ├── SearchBar.js
│   │   └── ...
│   ├── firebaseConfig.js       # Firebase configuration (gitignored)
│   ├── App.js                  # Main application component
│   ├── index.js                # Entry point
│   └── styles                  # TailwindCSS custom styles
└── README.md
```

---

## Technologies Used

- **React**: For building the user interface.
- **Tailwind CSS**: For utility-first styling.
- **Firebase**: For authentication and real-time database support.
- **React Router**: For routing within the application.
- **React Icons**: For iconography.

---

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeature`.
3. Make your changes and commit them.
4. Push to your branch: `git push origin feature/YourFeature`.
5. Open a pull request.

---

## License

This project is licensed under the MIT License.

---

## Contact

For any questions or feedback, please reach out to the HiiHive team at **dixitk941@gmail.com**.

---

**Thank you for visiting HiiHive!** Join the community, expand your knowledge, and connect with others.