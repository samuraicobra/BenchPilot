export {};

declare global {
  namespace Cloudflare {
    /** Optional starter binding; BenchPilot contest mode intentionally uses browser persistence. */
    interface Env {
      DB?: D1Database;
    }
  }
}
