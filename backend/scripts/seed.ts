/**
 * Seed dummy users, employees, projects, and tasks for local development.
 *
 * Usage:
 *   npm run seed
 *   npm run seed:fresh   # clear Acme org data and re-seed
 */
import mongoose from "mongoose";

import { connectMongoDB } from "../src/database/mongodb.js";
import { generateEmployeeCode } from "../src/modules/employees/employee-code.js";
import { Employee, EmployeeSequence } from "../src/modules/employees/employee.model.js";
import { EmployeeStatus, EmploymentType } from "../src/modules/employees/employee.types.js";
import { Organization } from "../src/modules/organizations/organization.model.js";
import { Project } from "../src/modules/projects/project.model.js";
import { ProjectPriority, ProjectStatus } from "../src/modules/projects/project.types.js";
import { Task } from "../src/modules/tasks/task.model.js";
import { TaskPriority, TaskStatus } from "../src/modules/tasks/task.types.js";
import { User } from "../src/modules/users/user.model.js";
import { UserRole } from "../src/modules/users/user.types.js";
import { hashPassword } from "../src/utils/password.js";
import { generateSlug } from "../src/utils/slug.js";

const ORG_NAME = "Acme Technologies";
const DEFAULT_PASSWORD = "Password123";

const EMPLOYEE_SEED = [
  { firstName: "Rahul", lastName: "Sharma", department: "Engineering", jobTitle: "Software Engineer", location: "Bangalore" },
  { firstName: "Priya", lastName: "Singh", department: "HR", jobTitle: "HR Manager", location: "Mumbai" },
  { firstName: "Amit", lastName: "Patel", department: "Engineering", jobTitle: "Senior Engineer", location: "Pune" },
  { firstName: "Neha", lastName: "Gupta", department: "Product", jobTitle: "Product Manager", location: "Bangalore" },
  { firstName: "Vikram", lastName: "Reddy", department: "Engineering", jobTitle: "Tech Lead", location: "Hyderabad" },
  { firstName: "Ananya", lastName: "Iyer", department: "Design", jobTitle: "UI Designer", location: "Bangalore" },
  { firstName: "Karan", lastName: "Mehta", department: "Operations", jobTitle: "Ops Analyst", location: "Delhi" },
  { firstName: "Sneha", lastName: "Nair", department: "Engineering", jobTitle: "Backend Developer", location: "Mumbai" },
  { firstName: "Arjun", lastName: "Kapoor", department: "Engineering", jobTitle: "Frontend Developer", location: "Pune" },
  { firstName: "Divya", lastName: "Rao", department: "HR", jobTitle: "Recruiter", location: "Bangalore" },
  { firstName: "Rohan", lastName: "Desai", department: "Product", jobTitle: "Business Analyst", location: "Hyderabad" },
  { firstName: "Kavya", lastName: "Menon", department: "Design", jobTitle: "UX Researcher", location: "Mumbai" },
  { firstName: "Manish", lastName: "Joshi", department: "Engineering", jobTitle: "DevOps Engineer", location: "Delhi" },
  { firstName: "Pooja", lastName: "Verma", department: "Operations", jobTitle: "Office Manager", location: "Pune" },
  { firstName: "Suresh", lastName: "Kumar", department: "Engineering", jobTitle: "QA Engineer", location: "Bangalore" },
  { firstName: "Lakshmi", lastName: "Pillai", department: "Product", jobTitle: "Associate PM", location: "Hyderabad" },
  { firstName: "Harish", lastName: "Choudhary", department: "Engineering", jobTitle: "Mobile Developer", location: "Delhi" },
  { firstName: "Meera", lastName: "Banerjee", department: "Design", jobTitle: "Graphic Designer", location: "Mumbai" },
] as const;

function emailFromName(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`;
}

async function clearAcmeData(organizationId: mongoose.Types.ObjectId): Promise<void> {
  await Task.deleteMany({ organizationId });
  await Project.deleteMany({ organizationId });
  await Employee.deleteMany({ organizationId });
  await User.deleteMany({ organizationId });
  await EmployeeSequence.deleteMany({ organizationId });
  await Organization.deleteOne({ _id: organizationId });
}

async function findEmployeeByEmail(
  organizationId: mongoose.Types.ObjectId,
  email: string,
): Promise<mongoose.Types.ObjectId | undefined> {
  const user = await User.findOne({ organizationId, email }).select("employeeId");
  return user?.employeeId ?? undefined;
}

interface ProjectSeed {
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerEmail: string;
  startDate: string;
  targetDate: string;
}

interface TaskSeed {
  projectKey: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeEmail: string;
  dueDate: string;
}

const PROJECT_SEED: ProjectSeed[] = [
  {
    key: "PAY",
    name: "Payment Platform",
    description: "Payment system modernization — APIs, retries, and gateway integration.",
    status: ProjectStatus.ACTIVE,
    priority: ProjectPriority.HIGH,
    ownerEmail: "rahul.sharma@acme.com",
    startDate: "2026-06-01",
    targetDate: "2026-12-01",
  },
  {
    key: "HR",
    name: "HR Portal",
    description: "Self-service HR portal for leave, profiles, and org directory.",
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.MEDIUM,
    ownerEmail: "priya.singh@acme.com",
    startDate: "2026-08-01",
    targetDate: "2027-02-01",
  },
  {
    key: "WEB",
    name: "Customer Web App",
    description: "Next-gen customer-facing web experience and dashboard redesign.",
    status: ProjectStatus.ACTIVE,
    priority: ProjectPriority.MEDIUM,
    ownerEmail: "amit.patel@acme.com",
    startDate: "2026-07-15",
    targetDate: "2026-11-30",
  },
  {
    key: "AI",
    name: "AI Copilot",
    description: "HR copilot agents — natural language task and project management.",
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.CRITICAL,
    ownerEmail: "vikram.reddy@acme.com",
    startDate: "2026-09-01",
    targetDate: "2027-03-01",
  },
];

const TASK_SEED: TaskSeed[] = [
  {
    projectKey: "PAY",
    title: "Fix payment API timeout",
    description: "Investigate 504 errors on checkout flow during peak load.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assigneeEmail: "rahul.sharma@acme.com",
    dueDate: "2026-09-15",
  },
  {
    projectKey: "PAY",
    title: "Add payment retry logic",
    description: "Exponential backoff for failed gateway calls.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    assigneeEmail: "sneha.nair@acme.com",
    dueDate: "2026-09-22",
  },
  {
    projectKey: "PAY",
    title: "Write payment integration tests",
    description: "Cover happy path, failures, and idempotency keys.",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.MEDIUM,
    assigneeEmail: "suresh.kumar@acme.com",
    dueDate: "2026-09-10",
  },
  {
    projectKey: "PAY",
    title: "Deploy payment service to staging",
    description: "Roll out v2 payment API to staging environment.",
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    assigneeEmail: "manish.joshi@acme.com",
    dueDate: "2026-08-28",
  },
  {
    projectKey: "HR",
    title: "Employee self-service login",
    description: "OAuth + JWT login flow for employee portal.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assigneeEmail: "arjun.kapoor@acme.com",
    dueDate: "2026-10-01",
  },
  {
    projectKey: "HR",
    title: "Leave approval workflow",
    description: "Manager approve/reject leave requests with email notifications.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assigneeEmail: "divya.rao@acme.com",
    dueDate: "2026-09-30",
  },
  {
    projectKey: "WEB",
    title: "Redesign customer dashboard",
    description: "New layout, charts, and responsive grid system.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    assigneeEmail: "ananya.iyer@acme.com",
    dueDate: "2026-10-15",
  },
  {
    projectKey: "WEB",
    title: "Mobile responsive navigation",
    description: "Hamburger menu and touch-friendly nav for mobile users.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    assigneeEmail: "harish.choudhary@acme.com",
    dueDate: "2026-10-20",
  },
  {
    projectKey: "WEB",
    title: "Fix checkout page layout bug",
    description: "Cart summary overlaps footer on small screens.",
    status: TaskStatus.BLOCKED,
    priority: TaskPriority.HIGH,
    assigneeEmail: "amit.patel@acme.com",
    dueDate: "2026-09-05",
  },
  {
    projectKey: "AI",
    title: "Design agent tool schema",
    description: "Define tool interfaces for createTask, searchProjects, etc.",
    status: TaskStatus.TODO,
    priority: TaskPriority.CRITICAL,
    assigneeEmail: "vikram.reddy@acme.com",
    dueDate: "2026-09-20",
  },
  {
    projectKey: "AI",
    title: "Wire project/task services to agent layer",
    description: "Expose projectServiceApi and taskServiceApi as agent tools.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.CRITICAL,
    assigneeEmail: "rahul.sharma@acme.com",
    dueDate: "2026-10-01",
  },
  {
    projectKey: "AI",
    title: "Prototype NL command parser",
    description: "Parse commands like 'Create a task for Rahul to fix payment API'.",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.HIGH,
    assigneeEmail: "neha.gupta@acme.com",
    dueDate: "2026-09-25",
  },
];

async function seedProjectsAndTasks(
  organizationId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId,
): Promise<{ projects: number; tasks: number }> {
  const existingProjects = await Project.countDocuments({ organizationId });
  if (existingProjects > 0) {
    return { projects: 0, tasks: 0 };
  }

  const projectIdByKey = new Map<string, mongoose.Types.ObjectId>();
  let projectsCreated = 0;

  for (const seed of PROJECT_SEED) {
    const ownerId = await findEmployeeByEmail(organizationId, seed.ownerEmail);
    const project = await Project.create({
      organizationId,
      name: seed.name,
      key: seed.key,
      description: seed.description,
      status: seed.status,
      priority: seed.priority,
      startDate: new Date(seed.startDate),
      targetDate: new Date(seed.targetDate),
      ownerId,
      createdBy,
    });
    projectIdByKey.set(seed.key, project._id);
    projectsCreated += 1;
  }

  let tasksCreated = 0;
  for (const seed of TASK_SEED) {
    const projectId = projectIdByKey.get(seed.projectKey);
    if (!projectId) continue;

    const assigneeId = await findEmployeeByEmail(organizationId, seed.assigneeEmail);
    await Task.create({
      organizationId,
      projectId,
      title: seed.title,
      description: seed.description,
      status: seed.status,
      priority: seed.priority,
      assigneeId,
      createdBy,
      dueDate: new Date(seed.dueDate),
    });
    tasksCreated += 1;
  }

  return { projects: projectsCreated, tasks: tasksCreated };
}

async function seed(): Promise<void> {
  const fresh = process.argv.includes("--fresh");

  await connectMongoDB();

  const slug = generateSlug(ORG_NAME);
  let organization = await Organization.findOne({ slug });

  if (organization && fresh) {
    console.log("Clearing existing Acme Technologies data...");
    await clearAcmeData(organization._id);
    organization = null;
  }

  if (!organization) {
    organization = await Organization.create({ name: ORG_NAME, slug });
    console.log(`Created organization: ${ORG_NAME}`);
  } else {
    const existingEmployees = await Employee.countDocuments({ organizationId: organization._id });
    const existingProjects = await Project.countDocuments({ organizationId: organization._id });
    if (existingEmployees >= 15 && existingProjects > 0) {
      console.log(
        `Seed skipped — ${existingEmployees} employees and ${existingProjects} projects already exist for ${ORG_NAME}.`,
      );
      console.log("Run `npm run seed:fresh` to reset and re-seed.");
      await mongoose.disconnect();
      return;
    }
  }

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const organizationId = organization._id;

  let admin = await User.findOne({ organizationId, email: "admin@acme.com" });
  if (!admin) {
    admin = await User.create({
      organizationId,
      name: "Admin User",
      email: "admin@acme.com",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });
    console.log("Created admin: admin@acme.com");
  }

  let hrUser = await User.findOne({ organizationId, email: "hr@acme.com" });
  if (!hrUser) {
    hrUser = await User.create({
      organizationId,
      name: "HR Manager",
      email: "hr@acme.com",
      passwordHash,
      role: UserRole.HR,
      isActive: true,
    });
    console.log("Created HR user: hr@acme.com");
  }

  let engineerUser = await User.findOne({ organizationId, email: "eng@acme.com" });
  if (!engineerUser) {
    engineerUser = await User.create({
      organizationId,
      name: "Engineering Lead",
      email: "eng@acme.com",
      passwordHash,
      role: UserRole.ENGINEER,
      isActive: true,
    });
    console.log("Created engineer user: eng@acme.com");
  }

  let managerEmployee: mongoose.Types.ObjectId | undefined;
  let created = 0;

  for (const [index, person] of EMPLOYEE_SEED.entries()) {
    const email = emailFromName(person.firstName, person.lastName);

    const existingUser = await User.findOne({ organizationId, email });
    if (existingUser) {
      continue;
    }

    const employeeCode = await generateEmployeeCode(organizationId.toString());
    const joinDate = new Date();
    joinDate.setMonth(joinDate.getMonth() - (index + 1));

    const user = await User.create({
      organizationId,
      name: `${person.firstName} ${person.lastName}`,
      email,
      passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
    });

    const employmentType =
      index % 5 === 0
        ? EmploymentType.CONTRACT
        : index % 7 === 0
          ? EmploymentType.PART_TIME
          : EmploymentType.FULL_TIME;

    const status =
      index === 16
        ? EmployeeStatus.ON_LEAVE
        : index === 17
          ? EmployeeStatus.INACTIVE
          : EmployeeStatus.ACTIVE;

    const employee = await Employee.create({
      organizationId,
      userId: user._id,
      employeeCode,
      firstName: person.firstName,
      lastName: person.lastName,
      phone: `98765${String(10000 + index).slice(-5)}`,
      department: person.department,
      jobTitle: person.jobTitle,
      dateOfJoining: joinDate,
      managerId: index > 2 ? managerEmployee : undefined,
      location: person.location,
      employmentType,
      status,
    });

    await User.findByIdAndUpdate(user._id, { employeeId: employee._id });

    if (person.jobTitle === "Tech Lead") {
      managerEmployee = employee._id;
    }

    created += 1;
  }

  const totalEmployees = await Employee.countDocuments({ organizationId });
  const totalUsers = await User.countDocuments({ organizationId });

  const { projects: projectsCreated, tasks: tasksCreated } = await seedProjectsAndTasks(
    organizationId,
    admin._id,
  );

  const totalProjects = await Project.countDocuments({ organizationId });
  const totalTasks = await Task.countDocuments({ organizationId });

  console.log("\nSeed complete!");
  console.log(`Organization : ${ORG_NAME}`);
  console.log(`Users        : ${totalUsers}`);
  console.log(`Employees    : ${totalEmployees}`);
  console.log(`Projects     : ${totalProjects} (${projectsCreated} new)`);
  console.log(`Tasks        : ${totalTasks} (${tasksCreated} new)`);
  console.log(`New employees: ${created}`);
  console.log("\nLogin credentials (all use the same password):");
  console.log(`  admin@acme.com  (ADMIN)`);
  console.log(`  hr@acme.com     (HR)`);
  console.log(`  eng@acme.com    (ENGINEER)`);
  console.log(`  rahul.sharma@acme.com … etc. (EMPLOYEE)`);
  console.log(`  Password: ${DEFAULT_PASSWORD}`);
  console.log("\nSample projects: PAY, HR, WEB, AI");
  console.log("Frontend: http://localhost:3000/login");
  console.log("Projects   : http://localhost:3000/projects");
  console.log("Tasks      : http://localhost:3000/tasks");
  console.log("Employees  : http://localhost:3000/employees\n");

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
