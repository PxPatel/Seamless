# Seamless

Seamless is a Chrome browser extension designed to simplify and streamline the process of sharing a **cloud clipboard** across multiple devices. With Seamless, users can seamlessly **copy and paste content across various devices**, ensuring a consistent and efficient workflow.


## Tech Stack

* ReactJS, Typescript, Plasmo, TailwindCSS
* Firebase (Functions, Firestore, Authentication)

## Features
* Cross-Device Clipboard: Share clipboard content across multiple devices in real-time.

* Cloud-Based: Utilizes cloud storage for seamless synchronization of clipboard data.
Secure and Private: Ensures data security and privacy through encryption protocols.

* User-Friendly Interface: Simple and intuitive interface for easy navigation and usage.


## Installation

Use the package manager [npm](https://www.npmjs.com/) to install dependencies.

```bash
npm install
```
## Development


### Firebase SDK
Initialize Firebase SDK and import necessary variables in [.env.example]("https://github.com/PxPatel/Seamless/blob/main/packages/app/.env.example")


### Firebase Function
On Firebase Console, enable Google/Firebase Cloud Function

Initialize Cloud Functions using Firebase CLI. 
```bash
cd packages/firebase
npm install -g firebase-tools
npx firebase login
npx firebase init functions
```

### Run Hot-Reload
On one Terminal each, run:
```bash
npm run dev:firebase
```
and
```bash
npm run dev:app
```

## Build

```bash
npm run deploy:functions
npm run build:app
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to include/update tests as appropriate.