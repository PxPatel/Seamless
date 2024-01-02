import React from "react"

const Main = () => {
  const handleSignOut = async () => {
    await chrome.runtime.sendMessage({
      type: "Signout"
    })
  }

  // const handleAddingSomething = async () => {}

  return (
    <div>
      <button
        className="w-[16rem] absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-stone-200 border border-gray-300 font-mono"
        type="button"
        onClick={handleSignOut}>
        SignOut
      </button>
      {/* <button
        className="w-[16rem] absolute left-1/2 -translate-x-1/2 top-[60%] -translate-y-1/2 bg-stone-200 border border-gray-300 font-mono"
        type="button"
        onClick={handleAddingSomething}>
        Add
      </button> */}
    </div>
  )
}

export default Main
