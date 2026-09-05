const test = require("node:test");
const assert = require("node:assert/strict");
const { generateGoalBreakdown } = require("../services/gemini-planner");

test("requests and normalizes a structured Gemini goal breakdown", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;

  global.fetch = async (url, options) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/interactions");
    assert.equal(options.headers["x-goog-api-key"], "test-key");
    const body = JSON.parse(options.body);

    assert.equal(body.model, "models/gemini-3.6-flash");
    assert.equal(body.response_format.mime_type, "application/json");
    assert.equal(body.response_format.schema.type, "object");

    return new Response(
      JSON.stringify({
        status: "completed",
        model: "models/gemini-3.6-flash",
        steps: [
          {
            type: "model_output",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  title: "Prepare for a system design interview",
                  deadline: "2026-09-09",
                  assumptions: ["The interview is on the selected deadline."],
                  tasks: [
                    {
                      title: "Review scalability fundamentals",
                      description: "Review load balancing, caching, and replication.",
                      estimatedMinutes: 62,
                      priority: "high",
                      category: "study",
                      order: 1,
                    },
                  ],
                }),
              },
            ],
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const result = await generateGoalBreakdown({
      goal: "Prepare for my interview",
      currentDate: "2026-09-02",
      targetDate: "2026-09-09",
      timeZone: "Africa/Cairo",
    });

    assert.equal(result.deadline, "2026-09-09");
    assert.equal(result.tasks.length, 1);
    assert.equal(result.tasks[0].estimatedMinutes, 62);
    assert.equal(result.tasks[0].category, "study");
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }

    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
  }
});
