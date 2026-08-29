import { Types, type FilterQuery } from "mongoose";

import { Task, type ITask } from "./task.model.js";
import {
  TaskStatus,
  emptyTaskSummary,
  type TaskPriority,
  type TaskQueryParams,
  type TaskSummary,
} from "./task.types.js";

export interface CreateTaskInput {
  organizationId: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: Types.ObjectId | null;
  dueDate?: Date | null;
}

export async function createTaskRecord(input: CreateTaskInput): Promise<ITask> {
  return Task.create(input);
}

export async function findTaskByIdAndOrganization(
  id: string,
  organizationId: string,
): Promise<ITask | null> {
  return Task.findOne({ _id: id, organizationId });
}

export async function updateTaskByIdAndOrganization(
  id: string,
  organizationId: string,
  updates: UpdateTaskInput,
): Promise<ITask | null> {
  return Task.findOneAndUpdate({ _id: id, organizationId }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function listTasksByOrganization(
  organizationId: string,
  params: TaskQueryParams,
): Promise<{ tasks: ITask[]; total: number }> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<ITask> = { organizationId };

  if (params.projectId) filter.projectId = params.projectId;
  if (params.assigneeId) filter.assigneeId = params.assigneeId;
  if (params.status) filter.status = params.status;
  if (params.priority) filter.priority = params.priority;

  if (params.search) {
    const regex = new RegExp(params.search.trim(), "i");
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);

  return { tasks, total };
}

export async function listTasksByProjectAndOrganization(
  projectId: string,
  organizationId: string,
): Promise<ITask[]> {
  return Task.find({ projectId, organizationId }).sort({ updatedAt: -1 });
}

export async function getTaskSummaryByProject(
  projectId: string,
  organizationId: string,
): Promise<TaskSummary> {
  const summary = emptyTaskSummary();
  const rows = await Task.aggregate<{ _id: TaskStatus; count: number }>([
    {
      $match: {
        projectId: new Types.ObjectId(projectId),
        organizationId: new Types.ObjectId(organizationId),
      },
    },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    if (row._id in summary) {
      summary[row._id as keyof TaskSummary] = row.count;
    }
  }

  return summary;
}
