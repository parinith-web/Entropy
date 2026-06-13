// This file previously contained a createServerFn() example (TanStack Start server function).
// createServerFn is a TanStack Start / SSR-only API and is not available in SPA mode.
// The example has been replaced with a plain client-side fetch pattern for reference.

export async function getGreeting(name: string): Promise<{ greeting: string }> {
  // In SPA mode, all server communication goes through the FastAPI backend.
  // Example: call your FastAPI backend instead of a server function.
  // const res = await fetch(`${import.meta.env.VITE_API_URL}/api/greet`, {
  //   method: "POST",
  //   body: JSON.stringify({ name }),
  // });
  // return res.json();
  return { greeting: `Hello, ${name}!` };
}
