import test from "node:test";
import assert from "node:assert/strict";
import {
  isAdminRole,
  stripLegacyAdminModeFromUiSettings,
  UI_SETTINGS_STORAGE_KEY,
} from "./auth-role.js";

test("isAdminRole returns true only for admin role", () => {
  assert.equal(isAdminRole({ role: "admin" }), true);
  assert.equal(isAdminRole({ role: "ADMIN" }), true);
  assert.equal(isAdminRole({ role: "student" }), false);
  assert.equal(isAdminRole(null), false);
});

test("stripLegacyAdminModeFromUiSettings removes persisted role toggle", () => {
  const storage = new Map();
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };

  storage.set(
    UI_SETTINGS_STORAGE_KEY,
    JSON.stringify({ theme: "dark", isAdminMode: true, contrastMode: "default" })
  );

  stripLegacyAdminModeFromUiSettings(localStorage);

  const next = JSON.parse(storage.get(UI_SETTINGS_STORAGE_KEY));
  assert.equal(next.theme, "dark");
  assert.equal("isAdminMode" in next, false);
});
