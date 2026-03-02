"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Something went wrong");
                return;
            }

            // Redirect to login after successful signup
            router.push("/login");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0f",
            color: "#f5f5f5",
            fontFamily: "system-ui, sans-serif",
        }}>
            <div style={{
                width: "100%",
                maxWidth: "400px",
                padding: "40px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
            }}>
                <h1 style={{ fontSize: "28px", marginBottom: "8px", textAlign: "center" }}>
                    Create Account 💕
                </h1>
                <p style={{ color: "#a0a0b0", textAlign: "center", marginBottom: "32px", fontSize: "14px" }}>
                    Join LovePlay today
                </p>

                {error && (
                    <div style={{
                        padding: "12px",
                        background: "rgba(255,55,55,0.15)",
                        border: "1px solid rgba(255,55,55,0.3)",
                        borderRadius: "8px",
                        color: "#ff5555",
                        fontSize: "14px",
                        marginBottom: "16px",
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup}>
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "14px 18px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "#f5f5f5",
                            fontSize: "16px",
                            marginBottom: "12px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "14px 18px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "#f5f5f5",
                            fontSize: "16px",
                            marginBottom: "12px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{
                            width: "100%",
                            padding: "14px 18px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "#f5f5f5",
                            fontSize: "16px",
                            marginBottom: "24px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            background: "linear-gradient(135deg, #e84393, #fd79a8)",
                            color: "white",
                            border: "none",
                            borderRadius: "999px",
                            fontSize: "16px",
                            fontWeight: 600,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#a0a0b0" }}>
                    Already have an account?{" "}
                    <a href="/login" style={{ color: "#e84393", textDecoration: "none" }}>Sign In</a>
                </p>
            </div>
        </div>
    );
}
