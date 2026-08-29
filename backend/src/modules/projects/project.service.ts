import mongoose from "mongoose";

import {
  createProjectRecord,
  findProjectByIdAndOrganization,
  listProjectsByOrganization,
  updateProjectByIdAndOrganization,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "./project.repository.js";
import {
  ProjectPriority,
  ProjectStatus,
  canCreateProject,
  canUpdateProject,
  type ProjectDetail,
  type ProjectListItem,
  type ProjectListResult,
  type ProjectQueryParams,
} from "./project.types.js";
import type { IProject } from "./project.model.js";
import { getTaskSummaryByProject } from "../tasks/task.repository.js";
import { type AuthContext } from "../users/user.types.js";
import { AppError } from "../../utils/app-error.js";
import { getEmployeeDisplayMap, validateEmployeeInOrganization } from "../../utils/employee-lookup.js";

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  targetDate?: string;
  ownerId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  targetDate?: string;
  ownerId?: string | null;
}

function formatDate(date?: Date): string | undefined {
  return date ? date.toISOString().split("T")[0] : undefined;
}

async function resolveOwner(
  organizationId: string,
  ownerId?: mongoose.Types.ObjectId,
): Promise<{ id: string; name: string } | undefined> {
  if (!ownerId) return undefined;
  const map = await getEmployeeDisplayMap(organizationId, [ownerId.toString()]);
  const name = map.get(ownerId.toString());
  if (!name) return undefined;
  return { id: ownerId.toString(), name };
}

async function toProjectListItem(
  project: IProject,
  organizationId: string,
): Promise<ProjectListItem> {
  const owner = await resolveOwner(organizationId, project.ownerId);
  return {
    id: project._id.toString(),
    name: project.name,
    key: project.key,
    status: project.status,
    priority: project.priority,
    owner,
    startDate: formatDate(project.startDate),
    targetDate: formatDate(project.targetDate),
  };
}

async function toProjectDetail(
  project: IProject,
  organizationId: string,
): Promise<ProjectDetail> {
  const listItem = await toProjectListItem(project, organizationId);
  const taskSummary = await getTaskSummaryByProject(project._id.toString(), organizationId);

  return {
    ...listItem,
    organizationId: project.organizationId.toString(),
    description: project.description,
    createdBy: project.createdBy.toString(),
    taskSummary,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

async function assertValidOwner(ownerId: string | undefined, organizationId: string): Promise<mongoose.Types.ObjectId | undefined> {
  if (!ownerId) return undefined;
  try {
    await validateEmployeeInOrganization(ownerId, organizationId);
  } catch {
    throw new AppError("Owner not found in your organization", 400);
  }
  return new mongoose.Types.ObjectId(ownerId);
}

function handleDuplicateKey(error: unknown): never {
  if (error instanceof Error && "code" in error && (error as { code?: number }).code === 11000) {
    throw new AppError("Project key already exists in your organization", 409);
  }
  throw error;
}

export class ProjectService {
  async listProjects(authUser: AuthContext, params: ProjectQueryParams): Promise<ProjectListResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { projects, total } = await listProjectsByOrganization(authUser.organizationId, params);

    const ownerIds = projects
      .map((p) => p.ownerId?.toString())
      .filter((id): id is string => Boolean(id));
    const ownerMap = await getEmployeeDisplayMap(authUser.organizationId, ownerIds);

    const list: ProjectListItem[] = projects.map((project) => ({
      id: project._id.toString(),
      name: project.name,
      key: project.key,
      status: project.status,
      priority: project.priority,
      owner: project.ownerId
        ? {
            id: project.ownerId.toString(),
            name: ownerMap.get(project.ownerId.toString()) ?? "Unknown",
          }
        : undefined,
      startDate: formatDate(project.startDate),
      targetDate: formatDate(project.targetDate),
    }));

    return {
      projects: list,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getProject(authUser: AuthContext, projectId: string): Promise<ProjectDetail> {
    const project = await findProjectByIdAndOrganization(projectId, authUser.organizationId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    return toProjectDetail(project, authUser.organizationId);
  }

  async createProject(authUser: AuthContext, input: CreateProjectRequest): Promise<ProjectDetail> {
    if (!canCreateProject(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const ownerObjectId = await assertValidOwner(input.ownerId, authUser.organizationId);
    const organizationObjectId = new mongoose.Types.ObjectId(authUser.organizationId);

    const record: CreateProjectInput = {
      organizationId: organizationObjectId,
      name: input.name.trim(),
      key: input.key.trim().toUpperCase(),
      description: input.description?.trim(),
      status: input.status ?? ProjectStatus.PLANNING,
      priority: input.priority ?? ProjectPriority.MEDIUM,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      ownerId: ownerObjectId,
      createdBy: new mongoose.Types.ObjectId(authUser.userId),
    };

    try {
      const project = await createProjectRecord(record);
      return toProjectDetail(project, authUser.organizationId);
    } catch (error) {
      handleDuplicateKey(error);
    }
  }

  async updateProject(
    authUser: AuthContext,
    projectId: string,
    input: UpdateProjectRequest,
  ): Promise<ProjectDetail> {
    if (!canUpdateProject(authUser.role)) {
      throw new AppError("Forbidden", 403);
    }

    const existing = await findProjectByIdAndOrganization(projectId, authUser.organizationId);
    if (!existing) {
      throw new AppError("Project not found", 404);
    }

    const updates: UpdateProjectInput = {};
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.description !== undefined) updates.description = input.description.trim();
    if (input.status !== undefined) updates.status = input.status;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.startDate !== undefined) updates.startDate = new Date(input.startDate);
    if (input.targetDate !== undefined) updates.targetDate = new Date(input.targetDate);

    if (input.ownerId !== undefined) {
      if (input.ownerId === null || input.ownerId === "") {
        updates.ownerId = null;
      } else {
        updates.ownerId = await assertValidOwner(input.ownerId, authUser.organizationId);
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update", 400);
    }

    const updated = await updateProjectByIdAndOrganization(
      projectId,
      authUser.organizationId,
      updates,
    );
    if (!updated) {
      throw new AppError("Project not found", 404);
    }

    return toProjectDetail(updated, authUser.organizationId);
  }

  async archiveProject(authUser: AuthContext, projectId: string): Promise<ProjectDetail> {
    return this.updateProject(authUser, projectId, { status: ProjectStatus.ARCHIVED });
  }
}

export const projectService = new ProjectService();

// Expose for future AI agent reuse
export const projectServiceApi = {
  searchProjects: (authUser: AuthContext, params: ProjectQueryParams) =>
    projectService.listProjects(authUser, params),
  getProject: (authUser: AuthContext, id: string) => projectService.getProject(authUser, id),
  createProject: (authUser: AuthContext, input: CreateProjectRequest) =>
    projectService.createProject(authUser, input),
  updateProject: (authUser: AuthContext, id: string, input: UpdateProjectRequest) =>
    projectService.updateProject(authUser, id, input),
};
