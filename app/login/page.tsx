"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl,
            });

            if (result?.error) {
                setError(result.error);
            } else if (result?.ok) {
                router.push(callbackUrl);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl });
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
                    LovePlay 💕
                </h1>
                <p style={{ color: "#a0a0b0", textAlign: "center", marginBottom: "32px", fontSize: "14px" }}>
                    Sign in to continue
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

                <button
                    onClick={handleGoogleSignIn}
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: "white",
                        color: "#333",
                        border: "none",
                        borderRadius: "999px",
                        fontSize: "16px",
                        fontWeight: 500,
                        cursor: "pointer",
                        marginBottom: "24px",
                    }}
                >
                    Sign in with Google
                </button>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    color: "#6b6b80",
                    fontSize: "14px",
                    marginBottom: "24px",
                }}>
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                    or
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                </div>

                <form onSubmit={handleLogin}>
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
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#a0a0b0" }}>
                    Don&apos;t have an account?{" "}
                    <a href="/signup" style={{ color: "#e84393", textDecoration: "none" }}>Sign Up</a>
                </p>
            </div>
        </div>
    );
}
