import type { FilterQuery, Types } from "mongoose";

import { Project, type IProject } from "./project.model.js";
import type { ProjectPriority, ProjectQueryParams, ProjectStatus } from "./project.types.js";

export interface CreateProjectInput {
  organizationId: Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  targetDate?: Date;
  ownerId?: Types.ObjectId;
  createdBy: Types.ObjectId;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: Date;
  targetDate?: Date;
  ownerId?: Types.ObjectId | null;
}

export async function createProjectRecord(input: CreateProjectInput): Promise<IProject> {
  return Project.create(input);
}

export async function findProjectByIdAndOrganization(
  id: string,
  organizationId: string,
): Promise<IProject | null> {
  return Project.findOne({ _id: id, organizationId });
}

export async function updateProjectByIdAndOrganization(
  id: string,
  organizationId: string,
  updates: UpdateProjectInput,
): Promise<IProject | null> {
  return Project.findOneAndUpdate({ _id: id, organizationId }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function listProjectsByOrganization(
  organizationId: string,
  params: ProjectQueryParams,
): Promise<{ projects: IProject[]; total: number }> {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IProject> = { organizationId };

  if (params.status) filter.status = params.status;
  if (params.priority) filter.priority = params.priority;
  if (params.ownerId) filter.ownerId = params.ownerId;

  if (params.search) {
    const regex = new RegExp(params.search.trim(), "i");
    filter.$or = [{ name: regex }, { key: regex }, { description: regex }];
  }

  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  return { projects, total };
}
