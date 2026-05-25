import { describe, it, expect } from "vitest";
import { createOpenClawPlugin, createCursorPlugin, createHermesPlugin, getPluginAdapter, generatePluginConfig } from "../src/plugins/index.js";

describe("Plugin Adapters", () => {
  describe("OpenClaw", () => {
    it("returns correct manifest", () => {
      const plugin = createOpenClawPlugin();
      const manifest = plugin.getManifest();
      expect(manifest.name).toBe("aurex-advisor");
      expect(manifest.transport).toBe("http");
      expect(manifest.tools).toContain("advisor.market_status");
      expect(manifest.tools).toContain("advisor.execute");
    });

    it("returns connection config with URL", () => {
      const plugin = createOpenClawPlugin();
      const config = plugin.getConnectionConfig("http://localhost:3100");
      expect(config.type).toBe("openclaw");
      expect(config.url).toBe("http://localhost:3100/mcp");
      expect(config.transport).toBe("streamable-http");
    });
  });

  describe("Cursor", () => {
    it("returns correct manifest", () => {
      const plugin = createCursorPlugin();
      const manifest = plugin.getManifest();
      expect(manifest.transport).toBe("stdio");
      expect(manifest.tools.length).toBeGreaterThan(0);
    });

    it("returns mcpServers config", () => {
      const plugin = createCursorPlugin();
      const config = plugin.getConnectionConfig("http://localhost:3100");
      expect(config.type).toBe("cursor");
      expect(config.mcpServers).toBeDefined();
      const servers = config.mcpServers as Record<string, { command: string }>;
      expect(servers["aurex-advisor"]!.command).toBe("npx");
    });
  });

  describe("Hermes", () => {
    it("returns correct manifest", () => {
      const plugin = createHermesPlugin();
      const manifest = plugin.getManifest();
      expect(manifest.transport).toBe("sse");
    });

    it("returns SSE connection config", () => {
      const plugin = createHermesPlugin();
      const config = plugin.getConnectionConfig("http://localhost:3100");
      expect(config.type).toBe("hermes");
      expect(config.url).toBe("http://localhost:3100/mcp/sse");
      expect(config.transport).toBe("sse");
    });
  });

  describe("getPluginAdapter", () => {
    it("returns correct adapter for each type", () => {
      expect(getPluginAdapter("openclaw").getManifest().transport).toBe("http");
      expect(getPluginAdapter("cursor").getManifest().transport).toBe("stdio");
      expect(getPluginAdapter("hermes").getManifest().transport).toBe("sse");
    });
  });

  describe("generatePluginConfig", () => {
    it("returns manifest and connection for openclaw", () => {
      const config = generatePluginConfig("openclaw", "http://localhost:3100");
      expect(config.manifest).toBeDefined();
      expect(config.connection).toBeDefined();
      const conn = config.connection as { url: string };
      expect(conn.url).toContain("localhost:3100");
    });

    it("returns manifest and connection for cursor", () => {
      const config = generatePluginConfig("cursor", "http://localhost:3100");
      expect(config.manifest).toBeDefined();
      expect(config.connection).toBeDefined();
    });

    it("returns manifest and connection for hermes", () => {
      const config = generatePluginConfig("hermes", "http://localhost:3100");
      expect(config.manifest).toBeDefined();
      const conn = config.connection as { url: string };
      expect(conn.url).toContain("/mcp/sse");
    });
  });
});
