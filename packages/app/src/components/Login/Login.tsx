import { ErrorMessage, Field, Form, Formik } from "formik"
import React, { useState } from "react"

type PageType = "CREATE" | "LOGIN"

const Login = () => {
  const [mode, setMode] = useState<PageType>()

  const handleSubmit = async (payload: { email: string; password: string }) => {
    await chrome.runtime.sendMessage({
      type: "AuthSignin",
      data: payload
    })
  }

  return (
    <div className="bg-blue-50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded w-[25rem] min-h-[30rem]  border border-pink-900">
      <div className="absolute left-1/2 top-[15%] -translate-x-1/2 w-max text-center">
        <h1 className="font-Karla text-4xl font-medium underline underline-offset-4">
          {mode === "CREATE" ? "Create an Account" : "Login"}
        </h1>
        <h2 className="mt-2 font-Alegreya font-normal">
          Began a seamless experience
        </h2>
      </div>

      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={handleSubmit}>
        <Form className="h-[15rem] p-2 absolute left-1/2 -translate-x-1/2 top-[30%] flex flex-col justify-evenly ">
          <Field
            name="email"
            type="text"
            placeholder="Example@gmail.com"
            className={`inputCX mb-8`}
          />
          <ErrorMessage name="email" />

          <Field
            name="password"
            type="text"
            placeholder="JohnnyAppleseed"
            className={`inputCX`}
          />
          <ErrorMessage name="password" />
          <button
            className="w-[16rem] bg-stone-200 border border-gray-300 font-mono"
            type="submit">
            Submit
          </button>
        </Form>
      </Formik>

      
      <button
        onClick={() => {
          setMode((prev) => (prev === "CREATE" ? "LOGIN" : "CREATE"))
        }}
        className="bg-blue-200 w-[45%] px-4 py-1 rounded-lg font-mono absolute left-1/2 -translate-x-1/2 top-[80%]">
        {mode === "CREATE" ? "Login" : "Create Account"}
      </button>
    </div>
  )
}

export default Login
