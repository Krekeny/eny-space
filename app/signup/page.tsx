import { signUp } from "@/actions/auth";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="page-container" style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h1>Sign Up</h1>
      <form action={signUp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label htmlFor="email" style={{ display: "block", marginBottom: "8px" }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: "block", marginBottom: "8px" }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "12px 24px",
            borderRadius: "6px",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "1px solid #ffffff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Sign Up
        </button>
      </form>
      <p style={{ marginTop: "16px", textAlign: "center" }}>
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </main>
  );
}
