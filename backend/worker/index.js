import { Container, getRandom } from "@cloudflare/containers";

const INSTANCE_COUNT = 1;

export class Backend extends Container {
  defaultPort = 3000;
  sleepAfter = "10m";
  envVars = {
    PORT: "3000",
    NODE_ENV: "production",
    MONGO_URI: this.env.MONGO_URI,
    DB_NAME: this.env.DB_NAME || this.env.db_Name || "productivity_app",
    db_Name: this.env.DB_NAME || this.env.db_Name || "productivity_app",
    JWT_SECRET: this.env.JWT_SECRET,
    JWT_EXPIRES_IN: this.env.JWT_EXPIRES_IN || "7d",
    GEMINI_API_KEY: this.env.GEMINI_API_KEY,
    GEMINI_MODEL: this.env.GEMINI_MODEL || "models/gemini-3.6-flash",
    GEMINI_TIMEOUT_MS: this.env.GEMINI_TIMEOUT_MS || "90000",
  };

  onStart() {
    console.log("Sa3i backend container started");
  }

  onStop() {
    console.log("Sa3i backend container stopped");
  }

  onError(error) {
    console.error("Sa3i backend container error", error);
  }
}

export default {
  async fetch(request, env) {
    const container = await getRandom(env.BACKEND, INSTANCE_COUNT);
    return container.fetch(request);
  },
};
