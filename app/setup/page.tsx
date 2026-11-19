import { PageHeading } from "@/components/public";
export const metadata = { title: "Application setup" };
export default function Setup() {
  return (
    <div className="container">
      <PageHeading
        eyebrow="Configuration required"
        title="Connect Rose’s booking portal"
      >
        The public website is ready to explore. Account and booking features
        need a configured backend.
      </PageHeading>
      <div className="prose">
        <div className="notice">
          Connected mode does not fall back to demonstration data when
          configuration is missing.
        </div>
        <h2>To review the complete demo</h2>
        <p>
          Run <code>npm run dev:demo</code>, then open the local website. The
          banner provides fictional customer and staff views. State is isolated
          to that demo session and disappears when the server restarts or the
          session expires.
        </p>
        <h2>To connect Supabase</h2>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code>. Add your
          Supabase URL, publishable key, server-only service-role key and a
          random APP_SECRET of at least 32 characters. Apply the migration and
          safe seed, configure authentication redirects, then restart the
          application.
        </p>
        <p>
          The README contains complete local and Vercel setup instructions.
          Never place a service-role key in a variable prefixed NEXT_PUBLIC.
        </p>
      </div>
    </div>
  );
}
