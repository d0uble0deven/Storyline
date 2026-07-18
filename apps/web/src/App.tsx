import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/organisms/AppShell.js";
import { Landing } from "./routes/Landing.js";
import { ProjectsDashboard } from "./routes/ProjectsDashboard.js";
import { NewProject } from "./routes/NewProject.js";
import { ProjectLayout } from "./routes/project/ProjectLayout.js";
import { Overview } from "./routes/project/Overview.js";
import { MediaLibrary } from "./routes/project/MediaLibrary.js";
import { Brief } from "./routes/project/Brief.js";
import { Plan } from "./routes/project/Plan.js";
import { Highlights } from "./routes/project/Highlights.js";
import { Story } from "./routes/project/Story.js";
import { Editor } from "./routes/project/Editor.js";
import { ExportScreen } from "./routes/project/Export.js";
import { NotFound } from "./routes/NotFound.js";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppShell />}>
        <Route path="/projects" element={<ProjectsDashboard />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<Overview />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="brief" element={<Brief />} />
          <Route path="plan" element={<Plan />} />
          <Route path="highlights" element={<Highlights />} />
          <Route path="story" element={<Story />} />
          <Route path="editor" element={<Editor />} />
          <Route path="export" element={<ExportScreen />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
