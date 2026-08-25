# Virasat (विरासत) - Your Family's Digital Hearth 🔥

Virasat is a secure, private, and modern web application designed to be a digital hearth for your family—a central place to safeguard, share, and discover your collective history.

<img width="1919" height="971" alt="Screenshot 2025-10-11 103616" src="https://github.com/user-attachments/assets/1d159800-416c-47c5-ba59-ad206d24c594" />

## 📖 About The Project

Every family has a rich tapestry of stories, photos, and memories. Grandparents' anecdotes, old photo albums, cherished recipes—these heirlooms are often scattered and at risk of being lost to time.

**Virasat** (a Hindi word meaning "heritage") solves this by creating a collaborative, invite-only space where family members can come together to build a living, lasting archive. It's more than just storage; it's a platform for connection, discovery, and preserving your legacy for generations to come.

---

## ✨ Key Features

Virasat is packed with features designed to make preserving memories intuitive and joyful:

* **👨‍👩‍👧‍👦 Invite-Only System:** The "Family Chronicler" has complete control, ensuring your family's space remains secure and private.
* **✍️ Rich Storytelling:** Upload memories in any format—text stories, photos, audio recordings, or video clips.
* **📸 Smart Media Uploads:** Add titles, descriptions, dates, and tags to your photos and videos for easy organization.
* **🕰️ Interactive Timeline:** Every memory with a date is automatically added to a beautiful, chronological timeline of your family's history.
* **🔍 Powerful Search:** Instantly find any story, photo, or event with a powerful search that looks through titles, descriptions, tags, and even the content of stories.
* **🔒 Private Family Circles:** Create smaller, private groups (like "The Siblings" or "Cousins") to share specific stories with just the right people.
* **📚 Legacy Export:** Convert your collections of stories and photos into a beautifully formatted, printable PDF to create a tangible family heirloom.

---

## 🛠️ Tech Stack

This project is built with a modern MERN stack, ensuring a robust and scalable application.

| Frontend                               | Backend                                    | Database                             | Authentication & Comms                        |
| -------------------------------------- | ------------------------------------------ | ------------------------------------ | --------------------------------------------- |
| ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white) | ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) |
| ![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white) | ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) |                                      | ![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?style=for-the-badge&logo=gmail&logoColor=white) |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) |                                            |                                      |                                               |

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.
* npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repo**
    ```sh
    git clone [https://github.com/chetan-coder5486/Virasat.git](https://github.com/chetan-coder5486/Virasat.git)
    ```
2.  **Navigate to the Backend & Install Dependencies**
    ```sh
    cd Virasat/backend
    npm install
    ```
3.  **Set up Backend Environment Variables**
    * Create a `.env` file in the `backend` directory.
    * Add the following variables:
        ```env
        MONGO_URI="your_mongodb_connection_string"
        JWT_AUTH_SECRET="your_strong_auth_secret_key"
        JWT_INVITE_SECRET="your_different_strong_invite_secret_key"
        EMAIL_USER="your_gmail_address"
        EMAIL_PASS="your_gmail_app_password" 
        ```
4.  **Navigate to the Frontend & Install Dependencies**
    ```sh
    cd ../frontend
    npm install
    ```
5.  **Run the Development Servers**
    * In the `backend` terminal:
        ```sh
        npm run dev
        ```
    * In the `frontend` terminal:
        ```sh
        npm run dev
        ```

Your application should now be running locally!

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE.txt` for more information.

---

## 📬 Contact

Chetan Srivastav - [@chetan-coder5486](https://github.com/chetan-coder5486)

Project Link: [https://github.com/chetan-coder5486/Virasat](https://github.com/chetan-coder5486/Virasat)
