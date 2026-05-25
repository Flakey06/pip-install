# pip install — Orbital Development Log

## <Milestone 1 (Target: 1 Jun 2026) — Project Setup & Authentication>

## 14 May Call: 5:01:21 hours

### What we did

- chart overflow and user showcase (platform used: figma) [View Original Proposal](docs/user_story.pdf)
- milestone 1 video recording + slides creation
- milestone 1 poster [View Pip-Install Poster](docs/pip-install_poster.pdf)
- created our pip-install logo [View Pip-Install Logo](public/pip-install_logo.png)

### Technical Decisions Made -- Tech Stack

#### Frontend: React.js + Create React App

- **Linked to:** User Profiles, Group Chat UI, Block/Report buttons, Join/Leave Groups
- React's component-based design is perfect for our app — we can build reusable components like profile cards, interest tags, chat bubbles, and group tiles that appear across multiple pages
- For example, a `<ProfileCard />` component can be reused in both the Home page and the group matching page
- Create React App was chosen as the standard beginner-friendly setup with no configuration needed

#### Styling: TailwindCSS

- **Linked to:** All UI pages — Login, Profile, Chat, Groups
- Utility-first CSS lets us style directly in JSX, speeding up UI development
- Built-in responsive classes make it easy to ensure the app looks good on mobile — important since students will use the app on their phones
- No need to write and manage separate CSS files for each component

#### Backend: Node.js + Express.js

- **Linked to:** Matching Algorithm, Block/Report, Group Management
- The matching algorithm needs to run server-side — it has to query all users, compare interests and personality traits, and assign groups. This logic is too heavy and insecure to run on the frontend
- Block/Report feature requires server-side enforcement — a blocked user should not be able to access another user's data at the API level
- Node.js uses JavaScript, meaning the whole app (frontend + backend) uses one language, reducing context switching for our team

#### Database: MongoDB

- **Linked to:** User Profiles, Groups, Messages, Reports
- Our user profiles have variable fields — some users fill in bio and telegram, others don't. MongoDB's flexible schema handles optional fields naturally without empty columns
- Groups are dynamic — members join and leave, interests change. Storing members as an array in a document is simpler than managing a relational join table in SQL
- Messages can be stored as a sub-collection under each group, keeping related data together
- MongoDB Atlas provides free cloud hosting, keeping costs at zero for our MVP

#### Auth: JWT (JSON Web Tokens)

- **Linked to:** User Profiles, Safety Features, Block/Report
- Every API request (fetching profiles, sending messages, reporting users) needs to verify who the user is — JWT tokens handle this securely without storing sessions on the server
- Blocked users should not be able to access certain endpoints — JWT middleware can enforce this at the API level
- Stateless authentication scales well as more users join the app

#### Real-time Chat: Socket.io / WebSockets

- **Linked to:** Group Chat feature
- Group chat requires instant message delivery — a normal REST API would require constant polling (checking every few seconds), which is slow and inefficient
- WebSockets keep a persistent connection open between the client and server, so messages are delivered instantly the moment they are sent
- Socket.io handles edge cases like reconnecting when a user loses internet connection

#### Deployment: Vercel + Render/Heroku

- **Linked to:** Full app deployment for Milestone 3
- Vercel auto-deploys the React frontend every time we push to GitHub — no manual deployment steps needed
- Render/Heroku hosts the Node.js backend for free, with easy environment variable management for keeping API keys secure
- Both platforms integrate with GitHub, enabling a basic CI/CD pipeline where every push triggers a new deployment

## 24 May call: 2:27:43 hours

### What we did

- Set up Vite + React project
- Integrated Firebase (Authentication + Firestore)
- Implemented Google Sign-In
- Built Login page with FAQ accordion
- Built Create Profile page (username, major, year, telegram, bio, interests)
- Built Home page showing user profile
- Built Edit Profile page
- Set up routing with React Router
- Pushed to GitHub with proper .gitignore

### Technical Decisions Made

#### 1. Database: Firebase Firestore instead of MongoDB

- Our user profiles have arrays (interests) and optional fields (bio, telegram) — Firestore handles this naturally
- No separate backend needed — Firebase talks directly to React
- Firebase does everything in one place: database, login, auth, real-time chat, file storage, hosting
- MongoDB only provides the database — we would still need Express + Node.js to connect it to React

#### 2. Frontend: Vite + React instead of Create React App

- Vite is significantly faster to build and run
- More modern tooling, better developer experience

#### 3. Auth: Firebase Auth instead of JWT

- Google Sign-In is easy to implement and secure
- No password management needed
- Works natively with Firestore security rules

#### 4. No Express backend

- Originally planned Node.js + Express backend
- Removed entirely since Firebase handles all backend logic
- Reduces complexity and lets us focus on features for MVP

### Data Model (Firestore)

```
users/{uid}
├── uid
├── email
├── photoURL
├── username
├── major
├── year          # "1", "2", "3", "4", "grad"
├── telegram      # optional
├── bio           # optional
├── interests     # array e.g. ["AI", "Hackathons"]
├── createdAt
└── updatedAt
```

### Tech Stack update

---

### Current Tech Stack & Reasoning (Milestone 1)

After building the MVP, we made several changes from the original proposal. Each change was deliberate and linked to our specific features and timeline.

#### Frontend: React.js + Vite (changed from Create React App)

- **Linked to:** All UI pages — Login, Profile, Chat, Groups
- Vite is significantly faster than Create React App — hot reload is near instant, making development much smoother
- Vite is the modern industry standard, replacing Create React App which is no longer actively maintained
- Same React component-based approach — reusable components like profile cards and interest tags still apply
- No change to how we build features — just a faster and more modern tooling setup

#### Styling: Inline CSS (changed from TailwindCSS)

- **Linked to:** All UI pages
- For our MVP scope, inline CSS is faster to write and requires zero configuration
- TailwindCSS requires a compiler setup which adds complexity for Milestone 1
- Each page's styles are self-contained and easy to read — good for a two-person team
- We plan to migrate to TailwindCSS or a component library in later milestones when the UI gets more complex

#### Auth: Firebase Authentication (changed from JWT)

- **Linked to:** Login, User Profiles, Safety Features
- Firebase Auth handles Google Sign-In in 3 lines of code — JWT would require building the entire auth flow from scratch
- No password management needed — students log in with their existing Google account, which they already trust
- Firebase Auth integrates natively with Firestore security rules — so only authenticated users can read/write data, enforcing our safety features automatically
- Returning users are detected instantly — we check Firestore on login to decide whether to show Create Profile or Home page

#### Database: Firebase Firestore (changed from MongoDB)

- **Linked to:** User Profiles, Groups, Messages, Reports
- Firestore handles our flexible user profiles naturally — optional fields like bio and telegram are stored without issues, just like MongoDB would
- No separate backend needed — Firestore talks directly to React, removing the need for Express.js API routes entirely
- Security rules replace our original JWT middleware — we can restrict users to only reading/writing their own profile data
- Real-time listeners mean group membership and chat updates can be reflected instantly without polling
- Free tier is generous enough for our MVP and early testing phase

#### No Backend: Firebase replaces Express.js + Node.js entirely

- **Linked to:** Matching Algorithm, Group Management, Block/Report
- Originally, Express.js was needed to run the matching algorithm server-side and enforce block/report rules at the API level
- Firebase Security Rules now handle access control — blocked users can be denied access at the database level without a custom API
- The matching algorithm currently runs client-side in React for simplicity — this is acceptable for our MVP with a small number of users
- We plan to move the matching algorithm to Firebase Cloud Functions in Milestone 2 as the user base grows, which acts as a lightweight serverless backend replacing Express.js

#### Real-time Chat: Firebase Realtime Database (changed from Socket.io)

- **Linked to:** Group Chat feature
- Firebase Realtime Database provides instant message delivery out of the box — no need to build and maintain WebSocket connections manually
- Socket.io required a running Node.js server to manage connections — removing the backend removes this dependency entirely
- Firebase handles reconnection, offline support, and message ordering automatically — features we would have had to build ourselves with Socket.io
- To be implemented in Milestone 2

#### Hosting: Vercel (frontend only, changed from Vercel + Render/Heroku)

- **Linked to:** Full app deployment
- Since there is no backend server, we only need to host the frontend
- Vercel auto-deploys from GitHub on every push — zero manual deployment steps
- Render/Heroku are no longer needed since Firebase handles all backend infrastructure
- To be set up in Milestone 2/3

### What Works

- Google login
- New user → Create Profile → Home
- Returning user → straight to Home
- Edit profile updates Firestore in real time
- Profile data persists across sessions

### What's Not Done Yet

- We plan to do an avatar (if possible)
- allow user to add their interests, and edit them into drop down, allow search too
- Matching algorithm
- Group chat
- Join / leave groups
- Block / report users
- Deployment

### Challenges Faced

- **Git initialised in wrong folder** — git was tracking the entire Desktop instead of just the project. Fixed by re-initialising git inside the project folder.
- **Firebase Firestore not enabled** — app was silently failing because Firestore wasn't turned on in the Firebase console. Fixed by enabling it in test mode.
- **`.env` not set up** — Firebase config was hardcoded in `firebase.js`. Moved to environment variables using `import.meta.env` for better security practice.
- **Unable to use Mission Control template** - We initially tried to follow the template from the Orbital Mission Control GitHub repository. However, we realised that their project used technologies such as Better Auth, Clerk, and TypeScript, and did not provide the all-in-one backend system that Firebase offers. As a result, the architecture and authentication flow were significantly different from what we intended for our project. Therefore, we decided to refer directly to the Firebase documentation instead. This allowed us to better understand Firebase Authentication and Firestore integration, and helped us build a more suitable and streamlined backend structure for our application.

### Reflections

#### Learning curve

- Had to learn Firebase from scratch — Firestore, Firebase Auth, and security rules were all new
- Understanding how React Router works with multiple pages took some trial and error
- Git concepts (remote, push, gitignore) were confusing at first but now make sense

#### What we'd do differently

- Set up `.env` and Firestore security rules from day one instead of as an afterthought
- Initialise git properly inside the project folder before writing any code
- Plan the folder structure before starting

#### Key takeaway

Starting simple and getting one full feature working end-to-end (login → profile → home) is better than trying to build everything at once. Firebase was the right choice for our timeline and MVP scope.

---

## <Milestone 2 (Target: date 2026)>

_To be updated..._

## <Milestone 3 (Target: date 2026)>

_To be updated..._

```

```
