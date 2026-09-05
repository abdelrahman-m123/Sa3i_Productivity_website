const test = require("node:test");
const assert = require("node:assert/strict");
const { blockDemoWrites } = require("../controllers/auth.controllers");

test("blocks writes for demo users", () => {
  const req = { baseUrl: "/tasks", method: "POST", user: { isDemo: true }, body: { title: "New" } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let calledNext = false;

  blockDemoWrites(req, res, () => {
    calledNext = true;
  });

  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.status, "fail");
  assert.match(res.body.message, /read-only/i);
});

test("allows limited task patches for demo users", () => {
  const req = {
    baseUrl: "/tasks",
    method: "PATCH",
    user: { isDemo: true },
    body: { completed: true, status: "done" },
  };
  let calledNext = false;

  blockDemoWrites(req, {}, () => {
    calledNext = true;
  });

  assert.equal(calledNext, true);
});

test("blocks full task edits for demo users", () => {
  const req = {
    baseUrl: "/tasks",
    method: "PATCH",
    user: { isDemo: true },
    body: { title: "Edited title", completed: true },
  };
  const res = {
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };

  blockDemoWrites(req, res, () => {
    throw new Error("Demo task edit should not be allowed");
  });

  assert.equal(res.statusCode, 403);
});

test("allows writes for regular users", () => {
  const req = { baseUrl: "/tasks", method: "POST", user: { isDemo: false }, body: { title: "New" } };
  let calledNext = false;

  blockDemoWrites(req, {}, () => {
    calledNext = true;
  });

  assert.equal(calledNext, true);
});
