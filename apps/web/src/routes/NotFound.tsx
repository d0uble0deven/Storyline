import { Link } from "react-router-dom";
import { Button } from "../components/atoms/Button.js";
import { EmptyState } from "../components/molecules/EmptyState.js";
import { IconFilm } from "../components/icons.js";

export function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <EmptyState
        icon={<IconFilm size={24} />}
        title="This page doesn't exist"
        message="The scene you're looking for didn't make the cut. Let's get you back to your projects."
        action={
          <Link to="/projects" style={{ textDecoration: "none" }}>
            <Button variant="primary">Back to projects</Button>
          </Link>
        }
      />
    </div>
  );
}
