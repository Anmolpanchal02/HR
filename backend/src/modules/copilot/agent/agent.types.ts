export enum AgentRunStatus {
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  LIMIT_REACHED = "LIMIT_REACHED",
}

export interface IAgentRun {
  organizationId: import("mongoose").Types.ObjectId;
  userId: import("mongoose").Types.ObjectId;
  conversationId?: import("mongoose").Types.ObjectId;
  status: AgentRunStatus;
  toolCallCount: number;
  llmModel: string;
  latencyMs: number;
  createdAt: Date;
  completedAt?: Date;
}
