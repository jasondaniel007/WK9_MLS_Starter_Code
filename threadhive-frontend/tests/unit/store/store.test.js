import { describe, it, expect } from "vitest";
import { store } from "../../../src/store/store";

describe("Redux Store Configuration", () => {
  it("should have all required reducers configured", () => {
    const state = store.getState();

    expect(state).toHaveProperty("auth");
    expect(state).toHaveProperty("threads");
    expect(state).toHaveProperty("currentThread");
    expect(state).toHaveProperty("comments");
    expect(state).toHaveProperty("theme");
    expect(state).toHaveProperty("subreddits");
  });

  it("should initialize auth state correctly", () => {
    const state = store.getState();

    expect(state.auth).toHaveProperty("token");
    expect(state.auth).toHaveProperty("user");
    expect(state.auth).toHaveProperty("login");
    expect(state.auth).toHaveProperty("registration");
  });

  it("should initialize threads state correctly", () => {
    const state = store.getState();

    expect(state.threads).toHaveProperty("threads");
    expect(state.threads).toHaveProperty("loading");
    expect(state.threads).toHaveProperty("error");
    expect(Array.isArray(state.threads.threads)).toBe(true);
  });

  it("should initialize currentThread state correctly", () => {
    const state = store.getState();

    expect(state.currentThread).toHaveProperty("thread");
    expect(state.currentThread).toHaveProperty("loading");
    expect(state.currentThread).toHaveProperty("error");
  });

  it("should initialize comments state correctly", () => {
    const state = store.getState();

    expect(state.comments).toHaveProperty("comments");
    expect(state.comments).toHaveProperty("loading");
    expect(state.comments).toHaveProperty("error");
    expect(Array.isArray(state.comments.comments)).toBe(true);
  });

  it("should initialize theme state correctly", () => {
    const state = store.getState();

    expect(state.theme).toHaveProperty("darkMode");
    expect(typeof state.theme.darkMode).toBe("boolean");
  });

  it("should initialize subreddits state correctly", () => {
    const state = store.getState();

    expect(state.subreddits).toHaveProperty("subreddits");
    expect(state.subreddits).toHaveProperty("loading");
    expect(state.subreddits).toHaveProperty("error");
    expect(Array.isArray(state.subreddits.subreddits)).toBe(true);
  });
});
