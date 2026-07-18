import { createApp } from "./app.js";
import { getDb } from "./db/db.js";
import { startJobTicker } from "./services/jobs.js";
import { runSeed } from "./db/seed.js";

const PORT = Number(process.env.PORT ?? 4175);

const db = getDb();
const projectCount = (db.prepare("SELECT COUNT(*) AS n FROM projects").get() as { n: number }).n;
if (projectCount === 0) {
  console.log("Empty database — seeding the demo projects…");
  runSeed();
}

startJobTicker();

createApp().listen(PORT, () => {
  console.log(`Storyline API listening on http://localhost:${PORT}`);
});
