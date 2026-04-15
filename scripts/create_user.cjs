#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ethers } = require("ethers");

const PROJECT_ROOT = path.join(__dirname, "..");
const LEGACY_USERS_FILE = path.join(PROJECT_ROOT, "server", "users.json");
const AUTH_STORE_FILE = path.resolve(
  process.env.AUTH_USER_STORE_FILE || path.join(PROJECT_ROOT, "server", "data", "auth_store.json")
);
const DEFAULT_USER = {
  username: "researcher",
  password: "researcher-demo-pass",
  walletAddress: "0x1111111111111111111111111111111111111111",
  role: "researcher",
};
const ALLOWED_USER_ROLES = new Set(["researcher", "admin"]);
const ALLOWED_USER_STATUSES = new Set(["active", "disabled"]);

function printUsage() {
  console.log(`
Usage:
  node scripts/create_user.cjs create --username <name> --password <password> --wallet <address> [--role <role>] [--status <status>]
  node scripts/create_user.cjs list
  node scripts/create_user.cjs delete --username <name>

Examples:
  node scripts/create_user.cjs create --username alice --password strong-pass --wallet 0x1234... --role researcher --status active
  node scripts/create_user.cjs list
  node scripts/create_user.cjs delete --username alice
`.trim());
}

function readArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    if (!key.startsWith("--")) {
      throw new Error(`Unexpected argument: ${key}`);
    }

    const value = rest[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${key}`);
    }

    options[key.slice(2)] = value;
    index += 1;
  }

  return { command, options };
}

function normalizeUsername(username) {
  const normalized = String(username || "").trim().toLowerCase();
  if (!normalized) {
    throw new Error("username is required");
  }
  if (normalized.length > 64) {
    throw new Error("username is too long");
  }
  return normalized;
}

function normalizePassword(password) {
  const normalized = String(password || "");
  if (!normalized.trim()) {
    throw new Error("password is required");
  }
  if (normalized.length > 256) {
    throw new Error("password is too long");
  }
  return normalized;
}

function normalizeRole(role) {
  const normalized = String(role || "researcher").trim().toLowerCase();
  if (!normalized) {
    throw new Error("role is required");
  }
  if (normalized.length > 64) {
    throw new Error("role is too long");
  }
  if (!ALLOWED_USER_ROLES.has(normalized)) {
    throw new Error(`role must be one of: ${Array.from(ALLOWED_USER_ROLES).join(", ")}`);
  }
  return normalized;
}

function normalizeStatus(status) {
  const normalized = String(status || "active").trim().toLowerCase();
  if (!ALLOWED_USER_STATUSES.has(normalized)) {
    throw new Error(`status must be one of: ${Array.from(ALLOWED_USER_STATUSES).join(", ")}`);
  }
  return normalized;
}

function normalizeWalletAddress(address) {
  try {
    return ethers.getAddress(String(address || ""));
  } catch {
    throw new Error("wallet must be a valid EVM address");
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const digest = crypto.scryptSync(password, salt, 64);
  return `scrypt${"$"}${salt.toString("hex")}${"$"}${digest.toString("hex")}`;
}

function isoNow() {
  return new Date().toISOString();
}

function normalizeTimestamp(value, fallback = null) {
  if (!value) {
    return fallback;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return fallback;
  }
  return parsed.toISOString();
}

function createStoredUserRecord({
  username,
  passwordHash,
  walletAddress,
  role = "researcher",
  status = "active",
  tokenVersion = 1,
  createdAt = null,
  updatedAt = null,
  passwordChangedAt = null,
  lastLoginAt = null,
  failedLoginCount = 0,
  lockedUntil = null,
}) {
  const now = isoNow();
  return {
    username: normalizeUsername(username),
    passwordHash: String(passwordHash || ""),
    walletAddress: normalizeWalletAddress(walletAddress),
    role: normalizeRole(role),
    status: normalizeStatus(status),
    tokenVersion: Number.isInteger(Number(tokenVersion)) && Number(tokenVersion) > 0 ? Number(tokenVersion) : 1,
    createdAt: normalizeTimestamp(createdAt, now),
    updatedAt: normalizeTimestamp(updatedAt, now),
    passwordChangedAt: normalizeTimestamp(passwordChangedAt, now),
    lastLoginAt: normalizeTimestamp(lastLoginAt, null),
    failedLoginCount: Number.isInteger(Number(failedLoginCount)) && Number(failedLoginCount) >= 0 ? Number(failedLoginCount) : 0,
    lockedUntil: normalizeTimestamp(lockedUntil, null),
  };
}

function ensureUserStoreFile() {
  const directory = path.dirname(AUTH_STORE_FILE);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (fs.existsSync(AUTH_STORE_FILE)) {
    return;
  }

  let sourceUsers = null;
  if (fs.existsSync(LEGACY_USERS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LEGACY_USERS_FILE, "utf8"));
      sourceUsers = Array.isArray(parsed?.users) ? parsed.users : null;
    } catch {
      sourceUsers = null;
    }
  }

  const seeded = {
    version: 2,
    users: (sourceUsers && sourceUsers.length > 0
      ? sourceUsers.map((user) =>
          createStoredUserRecord({
            username: user.username,
            passwordHash: user.passwordHash || hashPassword(DEFAULT_USER.password),
            walletAddress: user.walletAddress,
            role: user.role || "researcher",
            status: user.status || "active",
            tokenVersion: user.tokenVersion,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            passwordChangedAt: user.passwordChangedAt,
            lastLoginAt: user.lastLoginAt,
            failedLoginCount: user.failedLoginCount,
            lockedUntil: user.lockedUntil,
          })
        )
      : [
          createStoredUserRecord({
            username: DEFAULT_USER.username,
            passwordHash: hashPassword(DEFAULT_USER.password),
            walletAddress: DEFAULT_USER.walletAddress,
            role: DEFAULT_USER.role,
          }),
        ]),
  };

  fs.writeFileSync(AUTH_STORE_FILE, `${JSON.stringify(seeded, null, 2)}\n`, "utf8");
}

function loadUserStore() {
  ensureUserStoreFile();
  const parsed = JSON.parse(fs.readFileSync(AUTH_STORE_FILE, "utf8"));
  return {
    version: parsed?.version || 2,
    users: Array.isArray(parsed?.users)
      ? parsed.users.map((user) =>
          createStoredUserRecord({
            username: user.username,
            passwordHash: user.passwordHash,
            walletAddress: user.walletAddress,
            role: user.role,
            status: user.status,
            tokenVersion: user.tokenVersion,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            passwordChangedAt: user.passwordChangedAt,
            lastLoginAt: user.lastLoginAt,
            failedLoginCount: user.failedLoginCount,
            lockedUntil: user.lockedUntil,
          })
        )
      : [],
  };
}

function saveUserStore(store) {
  fs.mkdirSync(path.dirname(AUTH_STORE_FILE), { recursive: true });
  fs.writeFileSync(AUTH_STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function listUsers() {
  const store = loadUserStore();
  if (store.users.length === 0) {
    console.log("No users found.");
    return;
  }

  console.table(
    store.users.map((user) => ({
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    }))
  );
}

function createUser(options) {
  const username = normalizeUsername(options.username);
  const password = normalizePassword(options.password);
  const walletAddress = normalizeWalletAddress(options.wallet);
  const role = normalizeRole(options.role);
  const status = normalizeStatus(options.status);

  const store = loadUserStore();
  const existing = store.users.find((user) => String(user.username).toLowerCase() === username);
  if (existing) {
    throw new Error(`User '${username}' already exists`);
  }
  const walletConflict = store.users.find((user) => user.walletAddress === walletAddress);
  if (walletConflict) {
    throw new Error(`Wallet '${walletAddress}' is already bound to '${walletConflict.username}'`);
  }

  store.users.push(createStoredUserRecord({
    username,
    passwordHash: hashPassword(password),
    walletAddress,
    role,
    status,
  }));

  saveUserStore(store);
  console.log(`Created user '${username}' bound to ${walletAddress} with role '${role}' and status '${status}'.`);
}

function deleteUser(options) {
  const username = normalizeUsername(options.username);
  const store = loadUserStore();
  const remaining = store.users.filter((user) => String(user.username).toLowerCase() !== username);

  if (remaining.length === store.users.length) {
    throw new Error(`User '${username}' was not found`);
  }

  store.users = remaining;
  saveUserStore(store);
  console.log(`Deleted user '${username}'.`);
}

function main() {
  try {
    const { command, options } = readArgs(process.argv.slice(2));

    switch (command) {
      case "create":
        return createUser(options);
      case "list":
        return listUsers();
      case "delete":
        return deleteUser(options);
      case "--help":
      case "-h":
      case undefined:
        printUsage();
        return;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    printUsage();
    process.exitCode = 1;
  }
}

main();
