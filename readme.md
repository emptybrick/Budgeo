# **Budgeo**

<img src="public/images/budgeo.png" alt="Budgeo" width="200">
<img src="public/images/logo.png" alt="Budgeo Logo" width="100">

**Budgeo** is a minimalist, server-rendered budgeting app built with Node.js, Express, EJS and MongoDB. It lets users sign up, track expenses, view financial summaries, and manage their account in a clean interface.

---

## **Table of Contents**

* Features  
* Built With  
* Prerequisites  
* Installation  
* Configuration  
* Usage  
* Folder Structure  
* API Endpoints  
* Contributing  
* License

---

## **Features**

* Full user authentication (sign-up, sign-in, sign-out)  
* Create, read, update, and delete expenses  
* View all expenses, and each expense’s details  
* Dedicated financial data overview page  
* Server-rendered UI using EJS templates  
* MVC-style project organization

---

## **Built With**

* Node.js  
* Express.js  
* MongoDB & Mongoose  
* EJS templating engine  
* express-session  
* method-override  
* dotenv

---

## **Prerequisites**

* Node.js v14 or higher  
* MongoDB (local or Atlas)

---

## **Installation**

git clone https://github.com/emptybrick/Budgeo.git  
cd Budgeo  
npm install  
Create .env and configure  
npm start

Open your browser at `http://localhost:3000`.

---

## **Configuration**

Create `.env` and set:

| Variable | Description | Example |
| ----- | ----- | ----- |
| `PORT` | Port the server listens on | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/budgeo` |
| `SESSION_SECRET` | Secret key for session encryption | `yourSecretHere` |

---

## **Usage**

1. Register at `/budgeo/auth/sign-up`.  
2. Sign in at `/budgeo/auth/sign-in`.  
3. View your expenses at `/budgeo/:userId/expenses`.  
4. Add a new expense via `/budgeo/:userId/expenses/new`.  
5. Edit or delete expenses from details page.  
6. Check your summary at `/budgeo/:userId/data`.  
7. Sign out at `/budgeo/auth/sign-out`.  
8. Delete your account using the “Delete Account” button in the navbar (triggers `DELETE /budgeo/accountdeletion`).

---

## **Folder Structure**

* **controllers/**  
  * `auth.js`  
  * `budgeo.js`  
* **middleware/**  
  * `is-signed-in.js`  
  * `pass-user-to-view.js`  
* **models/**  
  * `user.js`  
* **public/**  
  * **images/**  
  * **js/**  
    * `clientUtils.js`  
    * `serverUtils.js`  
    * `sessionhelper.js`  
* **views/**  
  * **auth/**  
    * `sign-in.ejs`  
    * `sign-up.ejs`  
  * **budgeo/**  
    * `data.ejs`  
    * `edit.ejs`  
    * `index.ejs`  
    * `new.ejs`  
    * `show.ejs`  
  * **partials/**  
    * `_links.ejs`  
    * `_navbar.ejs`  
  * `index.ejs`  
  * `status.ejs`  
  * `thankyou.ejs`  
* `package.json`  
* `server.js`

---

## **API Endpoints**

| Method | Path | Description |
| ----- | ----- | ----- |
| GET | `/budgeo/auth/sign-in` | Render sign-in form |
| POST | `/budgeo/auth/sign-in` | Authenticate user credentials |
| GET | `/budgeo/auth/sign-up` | Render registration form |
| POST | `/budgeo/auth/sign-up` | Create a new user account |
| GET | `/budgeo/auth/sign-out` | Log out the current user |
| GET | `/budgeo/:userId/expenses` | List all expenses for a user |
| GET | `/budgeo/:userId/expenses/new` | Show “new expense” form |
| POST | `/budgeo/:userId/expenses` | Add a new expense |
| GET | `/budgeo/:userId/expenses/:expenseId` | View a specific expense |
| GET | `/budgeo/:userId/expenses/:expenseId/edit` | Show “edit expense” form |
| PUT | `/budgeo/:userId/expenses/:expenseId` | Update an existing expense |
| DELETE | `/budgeo/:userId/expenses/:expenseId` | Delete an expense |
| GET | `/budgeo/:userId/data` | Render financial data overview |
| DELETE | `/budgeo/accountdeletion` | Delete a user’s account (via navbar “Delete Account” button under user ID) |

---

## **Contributing**

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/YourFeature`)  
3. Commit your changes (`git commit -m 'Add feature'`)  
4. Push to your branch (`git push origin feature/YourFeature`)  
5. Open a Pull Request

---

## **License**

This project is licensed under the MIT License.
