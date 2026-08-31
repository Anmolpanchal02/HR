import mongoose from "mongoose";

import {
  createTaskRecord,
  findTaskByIdAndOrganization,
  listTasksByOrganization,
  updateTaskByIdAndOrganization,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./task.repository.js";
import {
  TaskPriority,
  TaskStatus,
  canCreateTask,
  canFullyUpdateTask,
  isValidTaskTransition,
  type TaskDetail,
  type TaskListItem,
  type TaskListResult,
  type TaskQueryParams,
} from "./task.types.js";
import type { ITask } from "./task.model.js";
import { findProjectByIdAndOrganization } from "../projects/project.repository.js";
import { findEmployeeByUserIdAndOrganization } from "../employees/employee.repository.js";
import { UserRole, type AuthContext } from "../users/user.types.js";
import { AppError } from "../../utils/app-error.js";
import { isEmployeeRole, requireEmployeeId } from "../../utils/access-scope.js";
import { getEmployeeDisplayMap, validateEmployeeInOrganization } from "../../utils/employee-lookup.js";
import { Project } from "../projects/project.model.js";

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

function formatDate(date?: Date): string | undefined {
  return date ? date.toISOString().split("T")[0] : undefined;
}

async function assertProjectInOrg(projectId: string, organizationId: string) {
  const project = await findProjectByIdAndOrganization(projectId, organizationId);
  if (!project) {
    throw new AppError("Project not found in your organization", 400);
  }
  return project;
}

async function assertAssigneeInOrg(assigneeId: string | undefined, organizationId: string) {
  if (!assigneeId) return undefined;
  try {
    await validateEmployeeInOrganization(assigneeId, organizationId);
  } catch {
    throw new AppError("Assignee not found in your organization", 400);
  }
  return new mongoose.Types.ObjectId(assigneeId);
}

async function toTaskDetail(task: ITask, organizationId: string): Promise<TaskDetail> {
  const [project, assigneeMap] = await Promise.all([
    Project.findOne({ _id: task.projectId, organizationId }).select("name key"),
    getEmployeeDisplayMap(
      organizationId,
      task.assigneeId ? [task.assigneeId.toString()] : [],
    ),
  ]);

  return {
    id: task._id.toString(),
    organizationId: task.organizationId.toString(),
    projectId: task.projectId.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId?.toString(),
    createdBy: task.createdBy.toString(),
    dueDate: formatDate(task.dueDate),
    project: project
      ? { id: project._id.toString(), name: project.name, key: project.key }
      : undefined,
    assignee: task.assigneeId
      ? {
          id: task.assigneeId.toString(),
          name: assigneeMap.get(task.assigneeId.toString()) ?? "Unknown",
        }
      : undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export class TaskService {
  async listTasks(authUser: AuthContext, params: TaskQueryParams): Promise<TaskListResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const scopedParams = { ...params };

    if (isEmployeeRole(authUser.role)) {
      scopedParams.assigneeId = await requireEmployeeId(authUser);
    }

    const { tasks, total } = await listTasksByOrganization(authUser.organizationId, scopedParams);

    const projectIds = [...new Set(tasks.map((t) => t.projectId.toString()))];
    const assigneeIds = tasks
      .map((t) => t.assigneeId?.toString())
      .filter((id): id is string => Boolean(id));

    const [projects, assigneeMap] = await Promise.all([
      Project.find({ _id: { $in: projectIds }, organizationId: authUser.organizationId }).select(
        "name key",
      ),
      getEmployeeDisplayMap(authUser.organizationId, assigneeIds),
    ]);

    const projectMap = new Map(
      projects.map((p) => [p._id.toString(), { id: p._id.toString(), name: p.name, key: p.key }]),
    );

    const list: TaskListItem[] = tasks.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: formatDate(task.dueDate),
      project: projectMap.get(task.projectId.toString()),
      assignee: task.assigneeId
        ? {
            id: task.assigneeId.toString(),
            name: assigneeMap.get(task.assigneeId.toString()) ?? "Unknown",
          }
        : undefined,
    }));

    return {
      tasks: list,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getTask(authUser: AuthContext, taskId: string): Promise<TaskDetail> {
    const task = await findTaskByIdAndOrganization(taskId, authUser.organizationId);
    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if (isEmployeeRole(authUser.role)) {
      const employeeId = await requireEmployeeId(authUser);
      if (task.assigneeId?.toString() !== employeeId) {
        throw new AppError("Forbidden", 403);
      }
    }

    return toTaskDetail(task, authUser.organizationId);
  }

  async createTask(authUser: AuthContext, input: CreateTaskRequest): Promise<TaskDetail> {
    if (!canCreateTask(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    await assertProjectInOrg(input.projectId, authUser.organizationId);
    const assigneeObjectId = await assertAssigneeInOrg(input.assigneeId, authUser.organizationId);

    const record: CreateTaskInput = {
      organizationId: new mongoose.Types.ObjectId(authUser.organizationId),
      projectId: new mongoose.Types.ObjectId(input.projectId),
      title: input.title.trim(),
      description: input.description?.trim(),
      status: TaskStatus.TODO,
      priority: input.priority ?? TaskPriority.MEDIUM,
      assigneeId: assigneeObjectId,
      createdBy: new mongoose.Types.ObjectId(authUser.userId),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    };

    const task = await createTaskRecord(record);
    return toTaskDetail(task, authUser.organizationId);
  }

  async updateTask(
    authUser: AuthContext,
    taskId: string,
    input: UpdateTaskRequest,
  ): Promise<TaskDetail> {
    const existing = await findTaskByIdAndOrganization(taskId, authUser.organizationId);
    if (!existing) {
      throw new AppError("Task not found", 404);
    }

    if (authUser.role === UserRole.EMPLOYEE) {
      const employee = await findEmployeeByUserIdAndOrganization(
        authUser.userId,
        authUser.organizationId,
      );
      if (!employee || existing.assigneeId?.toString() !== employee._id.toString()) {
        throw new AppError("Forbidden", 403);
      }

      if (input.status === undefined) {
        throw new AppError("Employees can only update status on their assigned tasks", 403);
      }

      const otherFields = ["title", "description", "priority", "assigneeId", "dueDate"] as const;
      for (const field of otherFields) {
        if (input[field] !== undefined) {
          throw new AppError("Employees can only update status on their assigned tasks", 403);
        }
      }

      if (!isValidTaskTransition(existing.status, input.status)) {
        throw new AppError("Invalid task status transition", 400);
      }

      const updated = await updateTaskByIdAndOrganization(taskId, authUser.organizationId, {
        status: input.status,
      });
      if (!updated) throw new AppError("Task not found", 404);
      return toTaskDetail(updated, authUser.organizationId);
    }

    if (!canFullyUpdateTask(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const updates: UpdateTaskInput = {};
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined) updates.description = input.description.trim();
    if (input.priority !== undefined) updates.priority = input.priority;

    if (input.status !== undefined) {
      if (!isValidTaskTransition(existing.status, input.status)) {
        throw new AppError("Invalid task status transition", 400);
      }
      updates.status = input.status;
    }

    if (input.dueDate !== undefined) {
      updates.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    if (input.assigneeId !== undefined) {
      if (input.assigneeId === null || input.assigneeId === "") {
        updates.assigneeId = null;
      } else {
        updates.assigneeId = await assertAssigneeInOrg(input.assigneeId, authUser.organizationId);
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    const updated = await updateTaskByIdAndOrganization(
      taskId,
      authUser.organizationId,
      updates,
    );
    if (!updated) {
      throw new AppError("Task not found", 404);
    }

    return toTaskDetail(updated, authUser.organizationId);
  }

  async cancelTask(authUser: AuthContext, taskId: string): Promise<TaskDetail> {
    return this.updateTask(authUser, taskId, { status: TaskStatus.CANCELLED });
  }
}

export const taskService = new TaskService();

export const taskServiceApi = {
  searchTasks: (authUser: AuthContext, params: TaskQueryParams) =>
    taskService.listTasks(authUser, params),
  getTask: (authUser: AuthContext, id: string) => taskService.getTask(authUser, id),
  createTask: (authUser: AuthContext, input: CreateTaskRequest) =>
    taskService.createTask(authUser, input),
  updateTask: (authUser: AuthContext, id: string, input: UpdateTaskRequest) =>
    taskService.updateTask(authUser, id, input),
};
