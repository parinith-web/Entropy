import { Link } from "@tanstack/react-router";
import { FormEvent, useState, useEffect } from "react";
import googleIcon from "@/assets/auth/51ce36e4a9526430e36ce1219ec95b516ae53e83.svg";
import logoIcon from "@/assets/auth/62b6799ce65a64f5570a5afed04258fd73ac5658.svg";
import paperWash from "@/assets/auth/720d43ab0f522c1c457e082999a02ea1d5fcbccd.png";
import wordmark from "@/assets/auth/1eaea8dd16a06730f6db88e50c11362f67b29814.png";
import teamIllustration from "@/assets/auth/team-cropped.png";
import teamShadow from "@/assets/auth/92d784b280fea203c407da74be3cd5b1338dd1d8.svg";
import cornerScribble from "@/assets/auth/stethoscope-figma-cropped.png";
import "@/styles/auth.css";
import { persistEmailAuth, verifyGoogleToken } from "@/lib/auth";

type AuthMode = "login" | "signup";

interface AuthPageProps {
  mode: AuthMode;
  onSuccess: () => void;
}

export function AuthPage({ mode, onSuccess }: AuthPageProps) {
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState(isSignup ? "Sign Up" : "Sign In");
  const [oauthLabel, setOauthLabel] = useState(
    isSignup ? "Sign up with Google" : "Sign in with Google",
  );
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [oauthSuccess, setOauthSuccess] = useState(false);
  const [oauthError, setOauthError] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const finishSuccess = () => {
    window.setTimeout(onSuccess, 600);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isSignup && !name.trim()) return;

    setSubmitting(true);
    setSubmitLabel(isSignup ? "Signing up..." : "Signing in...");

    window.setTimeout(() => {
      persistEmailAuth(email.trim(), isSignup ? name.trim() : undefined);
      setSubmitLabel("Success! Redirecting...");
      setSubmitSuccess(true);
      finishSuccess();
    }, 1000);
  };

  const handleGoogleAuth = async () => {
    setOauthError(true);
    setOauthLabel("Google sign-in not configured. Set VITE_GOOGLE_CLIENT_ID.");
    window.setTimeout(() => {
      setOauthError(false);
      setOauthLabel(isSignup ? "Sign up with Google" : "Sign in with Google");
    }, 3000);
  };

  const handleCredentialResponse = async (response: any) => {
    setOauthSubmitting(true);
    setOauthError(false);
    setOauthLabel("Connecting to Google...");

    try {
      const user = await verifyGoogleToken(response.credential);
      persistEmailAuth(user.email, user.name);
      setOauthLabel("Success! Redirecting...");
      setOauthSuccess(true);
      finishSuccess();
    } catch {
      setOauthLabel("Authentication failed. Try again.");
      setOauthError(true);
      window.setTimeout(() => {
        setOauthSubmitting(false);
        setOauthError(false);
        setOauthLabel(isSignup ? "Sign up with Google" : "Sign in with Google");
      }, 2000);
    }
  };

  useEffect(() => {
    const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientID) {
      console.log("VITE_GOOGLE_CLIENT_ID environment variable not set. Falling back to mock Google sign-in.");
      return;
    }

    const initGsi = () => {
      const google = (window as any).google;
      if (google) {
        try {
          google.accounts.id.initialize({
            client_id: clientID,
            callback: handleCredentialResponse,
          });
          
          const element = document.getElementById("google-signin-btn");
          if (element) {
            google.accounts.id.renderButton(element, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: isSignup ? "signup_with" : "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: "448" // matches --form-width
            });
            setGoogleLoaded(true);
          }
        } catch (err) {
          console.error("Error initializing Google Identity Services:", err);
        }
      }
    };

    if ((window as any).google) {
      initGsi();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isSignup]);

  return (
    <div className={isSignup ? "signup-page" : undefined}>
      <div className="page">
        <aside className="left" aria-hidden="true">
          <img className="paper-wash paper-wash-rotated" src={paperWash} alt="" />
          <img className="paper-wash paper-wash-wide" src={paperWash} alt="" />
          <img className="team-illustration" src={teamIllustration} alt="" />
          <img className="team-shadow" src={teamShadow} alt="" />
          <img className="corner-scribble" src={cornerScribble} alt="" />
        </aside>

        <main className="right">
          <div className="container">
            <div className="logo-wrap">
              <img className="logo-icon" src={logoIcon} alt="entropy icon" />
              <img className="logo" src={wordmark} alt="entropy logo" />
            </div>

            <h1 className="heading">{isSignup ? "Sign Up" : "Sign In"}</h1>

            {googleLoaded ? (
              <div
                className="oauth"
                id="google-signin-btn"
                style={{
                  border: "none",
                  background: "none",
                  boxShadow: "none",
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              ></div>
            ) : (
              <button
                className="btn oauth"
                type="button"
                disabled={oauthSubmitting || submitting}
                onClick={handleGoogleAuth}
                style={
                  oauthSuccess
                    ? { borderColor: "#10b981", color: "#10b981" }
                    : oauthError
                      ? { borderColor: "#ef4444", color: "#ef4444" }
                      : undefined
                }
              >
                <img className="gicon" src={googleIcon} alt="google" />
                <span>{oauthLabel}</span>
              </button>
            )}

            <div className="divider">
              <span>OR</span>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              {isSignup && (
                <div className="input">
                  <input
                    type="text"
                    placeholder="Name"
                    aria-label="Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="input">
                <input
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input">
                <input
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                className="btn submit"
                type="submit"
                disabled={submitting || oauthSubmitting}
                style={
                  submitSuccess
                    ? { backgroundColor: "#10b981", color: "#ffffff" }
                    : undefined
                }
              >
                {submitLabel}
              </button>
            </form>

            <p className="signup">
              {isSignup ? (
                <>
                  Already have an account? <Link to="/login">Sign in</Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account? <Link to="/signup">Sign up</Link>
                </>
              )}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
