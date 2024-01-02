import React, { useEffect, useState } from "react"

import Login from "~components/Login/Login"
import Main from "~components/Main/Main"
import type { FullConfigSetting } from "~types/user.types"

import "./style.css"

function IndexPopup() {
  const [operationData, setOperationData] = useState<FullConfigSetting>()

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "popupPort" })

    port.onMessage.addListener((msg: FullConfigSetting) => {
      setOperationData(msg)
      console.table(msg)
    })
  }, [])

  const view = !operationData ? <Login /> : <Main />

  return (
    <div className="w-[25rem] h-[25rem] bg-slate-200">
      {view}
      <div className="absolute left-1/2 top-1/2">{}</div>
    </div>
  )
}
export default IndexPopup
