import type { BaseConfigSetting } from "~types/user.types"

export function injectScriptIntoTab(tabId: number, cb?: () => void) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: cb ? cb : contentScriptFunction
  })
}

function contentScriptFunction() {
  // const port = chrome.runtime.connect({ name: "scriptPort" })

  // // Variable to hold SessionData
  // let config: BaseConfigSetting = null

  // // // Listen for incoming messages on the port
  // port.onMessage.addListener((message: BaseConfigSetting | null) => {
  //   // Update config based on incoming messages
  //   config = message // Assuming message structure aligns with config
  //   console.log("Received message:", config)
  // })

  // // Event listener for when the user copies something
  // document.addEventListener("copy", (event) => {
  //   const copiedText = window.getSelection().toString()
  //   console.log("Copied text:", copiedText)
  //   port.postMessage({ type: "message", data: copiedText })
  //   // You might want to send this information to the background script or perform other actions with it
  // })

  console.log("I\'ve Been Injected by Background")
}

export function previousOpenedTabsInjection() {
  chrome.tabs.query({}, (tabs) => {
    if (tabs && tabs.length > 0) {
      tabs.forEach((tab) => {
        const tabId = tab.id
        injectScriptIntoTab(tabId)
      })
    }
  })
}

// function newTabInjection() {
//   chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === "complete") {
//       injectScriptIntoTab(tabId)
//     }
//   })
// }


// chrome.scripting.executeScript({
//   target: { tabId: tabId }, // Specify the tab ID where you want to change the clipboard content
//   func: () => {
//     navigator.clipboard.writeText('New content for the clipboard')
//       .then(() => {
//         console.log('Clipboard updated successfully');
//       })
//       .catch((error) => {
//         console.error('Unable to update clipboard:', error);
//       });
//   }
// });
