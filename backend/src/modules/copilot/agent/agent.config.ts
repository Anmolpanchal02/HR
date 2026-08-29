import { env } from "../../../config/env.js";

export { AGENT_SYSTEM_PROMPT } from "../prompts/agent.prompt.js";

export function getAgentMaxToolCalls(): number {
  const parsed = Number(process.env.AGENT_MAX_TOOL_CALLS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return env.agentMaxToolCalls;
}
