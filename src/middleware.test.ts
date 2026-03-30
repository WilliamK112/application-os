import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { middleware, middlewareAuth } from "../middleware";

test("middleware redirects unauthenticated requests to /login with callbackUrl", async () => {
  const originalGetToken = middlewareAuth.getToken;

  try {
    middlewareAuth.getToken = async () => null;

    const request = new NextRequest("http://localhost/dashboard");
    const response = await middleware(request);

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "http://localhost/login?callbackUrl=%2Fdashboard",
    );
  } finally {
    middlewareAuth.getToken = originalGetToken;
  }
});

test("middleware allows authenticated requests to pass through", async () => {
  const originalGetToken = middlewareAuth.getToken;

  try {
    middlewareAuth.getToken = async () => ({ sub: "user-123" }) as never;

    const request = new NextRequest("http://localhost/applications");
    const response = await middleware(request);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-middleware-next"), "1");
  } finally {
    middlewareAuth.getToken = originalGetToken;
  }
});
