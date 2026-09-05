const { addDays, isValidDateKey } = require("./scheduler");

const DEFAULT_GEMINI_MODEL = "models/gemini-3.6-flash";
const DEFAULT_GEMINI_TIMEOUT_MS = 90000;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "A concise title for the overall goal.",
    },
    deadline: {
      type: "string",
      description: "The goal deadline as YYYY-MM-DD.",
    },
    assumptions: {
      type: "array",
      items: { type: "string" },
      description: "Short assumptions made while interpreting the request.",
    },
    tasks: {
      type: "array",
      description: "Three to eight concrete, independently actionable subtasks in execution order.",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          estimatedMinutes: {
            type: "integer",
            description: "Realistic focused-work estimate between 15 and 240 minutes.",
          },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          category: {
            type: "string",
            enum: ["work", "personal", "study", "health", "other"],
          },
          order: { type: "integer" },
        },
        required: [
          "title",
          "description",
          "estimatedMinutes",
          "priority",
          "category",
          "order",
        ],
      },
    },
  },
  required: ["title", "deadline", "assumptions", "tasks"],
};

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

const toInteractionModelName = (model) => {
  const value = String(model || DEFAULT_GEMINI_MODEL).trim();
  return value.startsWith("models/") ? value : `models/${value}`;
};

const getGeminiTimeoutMs = () => {
  const timeout = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_GEMINI_TIMEOUT_MS;
};

const normalizeTask = (task, index) => {
  const validPriorities = new Set(["low", "medium", "high"]);
  const validCategories = new Set(["work", "personal", "study", "health", "other"]);
  const rawEstimate = Number(task?.estimatedMinutes);
  const estimatedMinutes = Number.isFinite(rawEstimate)
    ? Math.max(15, Math.min(240, Math.round(rawEstimate)))
    : 60;

  return {
    clientId: `task-${index + 1}`,
    title: cleanText(task?.title, 120) || `Goal step ${index + 1}`,
    description: cleanText(task?.description, 600),
    estimatedMinutes,
    priority: validPriorities.has(task?.priority) ? task.priority : "medium",
    category: validCategories.has(task?.category) ? task.category : "other",
    order: Number.isInteger(task?.order) ? task.order : index + 1,
  };
};

const extractResponseText = (payload) => {
  const interactionText = payload?.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .filter((content) => content.type === "text")
    .map((content) => content.text || "")
    .join("")
    .trim();

  const legacyText = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  const text = interactionText || legacyText;

  if (!text) {
    const blockReason = payload?.promptFeedback?.blockReason;
    const interactionError = payload?.errors?.[0]?.message;
    throw new Error(
      blockReason || interactionError
        ? `Gemini could not create a plan: ${blockReason || interactionError}`
        : "Gemini returned an empty plan"
    );
  }

  return text;
};

const generateGoalBreakdown = async ({ goal, currentDate, targetDate, timeZone }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured on the backend");
    error.statusCode = 503;
    throw error;
  }

  const model = toInteractionModelName(process.env.GEMINI_MODEL);
  const prompt = [
    "You are the planning assistant inside a productivity application.",
    "Break the user's goal into 3 to 8 concrete, outcome-focused subtasks.",
    "Use realistic focused-work estimates in 15-minute increments, never more than 240 minutes per task.",
    "Put prerequisite work before practice or review work.",
    "Do not create calendar times; a deterministic scheduler will do that.",
    `Current local date: ${currentDate}.`,
    `User time zone: ${timeZone}.`,
    targetDate
      ? `The user explicitly selected ${targetDate} as the deadline; return that exact date.`
      : `Infer a reasonable deadline from the request. If none is present, use ${addDays(currentDate, 7)}.`,
    `User goal: ${goal}`,
  ].join("\n");

  let response;
  try {
    response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          input: prompt,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: RESPONSE_SCHEMA,
          },
          generation_config: {
            max_output_tokens: 2500,
            thinking_level: "low",
          },
        }),
        signal: AbortSignal.timeout(getGeminiTimeoutMs()),
      }
    );
  } catch (error) {
    const serviceError = new Error(
      error.name === "TimeoutError"
        ? "Gemini took too long to create the plan"
        : "Could not connect to Gemini"
    );
    serviceError.statusCode = 503;
    throw serviceError;
  }

  if (!response.ok) {
    let apiMessage = "Gemini could not create a plan";
    try {
      const errorPayload = await response.json();
      apiMessage = errorPayload?.error?.message || apiMessage;
    } catch {
      // Keep the safe fallback message when the upstream response is not JSON.
    }

    const error = new Error(apiMessage);
    error.statusCode = response.status === 429 ? 429 : 502;
    throw error;
  }

  let result;
  try {
    result = JSON.parse(extractResponseText(await response.json()));
  } catch (error) {
    const parseError = new Error(`Gemini returned an invalid plan: ${error.message}`);
    parseError.statusCode = 502;
    throw parseError;
  }

  const tasks = Array.isArray(result.tasks) ? result.tasks.slice(0, 8).map(normalizeTask) : [];
  if (tasks.length === 0) {
    const error = new Error("Gemini did not return any usable tasks");
    error.statusCode = 502;
    throw error;
  }

  return {
    title: cleanText(result.title, 120) || cleanText(goal, 120),
    deadline: isValidDateKey(result.deadline) ? result.deadline : null,
    assumptions: Array.isArray(result.assumptions)
      ? result.assumptions.slice(0, 5).map((assumption) => cleanText(assumption, 180)).filter(Boolean)
      : [],
    tasks,
  };
};

module.exports = { generateGoalBreakdown };
