import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SupabaseLogin() {
  const [email, setEmail] = useState("")

  const login = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Check your email")
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Login</h1>

      <input
        type="email"
        placeholder="Enter email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={login}>Login</button>
    </div>
  )
}