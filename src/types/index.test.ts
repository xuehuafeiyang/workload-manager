// T008 类型定义测试
// 验证所有接口的结构完整性

import type {
  Member,
  Project,
  Task,
  TimeEntry,
  DashboardData,
  ProjectStat,
  TrendData,
} from "./index";

describe("类型定义完整性", () => {
  it("Member 接口包含所有必要字段", () => {
    const member: Member = {
      id: 1,
      name: "张三",
      role: "开发工程师",
      dailyHours: 8,
      createdAt: "2025-05-13T00:00:00",
    };
    expect(member.id).toBe(1);
    expect(member.name).toBe("张三");
    expect(member.dailyHours).toBe(8);
  });

  it("Project 接口包含 overBudgetWarned 字段", () => {
    const project: Project = {
      id: 1,
      name: "Q2 迭代",
      budgetHours: 200,
      status: "active",
      overBudgetWarned: false,
      createdAt: "2025-05-13T00:00:00",
    };
    expect(project.overBudgetWarned).toBe(false);
    expect(project.status).toBe("active");
  });

  it("Task 接口包含 source 和 effectiveActualHours 字段", () => {
    const task: Task = {
      id: 1,
      projectId: 1,
      title: "需求评审",
      source: "manual",
      note: "",
      status: "todo",
      estimatedHours: 4,
      createdAt: "2025-05-13T00:00:00",
    };
    expect(task.source).toBe("manual");
    expect(task.effectiveActualHours).toBeUndefined();
  });

  it("TimeEntry 接口包含所有必要字段", () => {
    const entry: TimeEntry = {
      id: 1,
      taskId: 1,
      memberId: 1,
      date: "2025-05-13",
      hours: 2,
      createdAt: "2025-05-13T00:00:00",
    };
    expect(entry.hours).toBe(2);
  });

  it("DashboardData 包含所有统计字段", () => {
    const data: DashboardData = {
      totalBudgetHours: 100,
      totalConsumedHours: 30,
      totalRemainingHours: 70,
      projectStats: [],
      memberStats: [],
      trendData: [],
    };
    expect(data.totalRemainingHours).toBe(70);
  });

  it("ProjectStat 包含 isOverBudget 字段", () => {
    const stat: ProjectStat = {
      projectId: 1,
      projectName: "Q2 迭代",
      budgetHours: 100,
      consumedHours: 110,
      percentage: 110,
      isOverBudget: true,
    };
    expect(stat.isOverBudget).toBe(true);
  });

  it("TrendData 包含 label 和 hours 字段", () => {
    const trend: TrendData = { label: "第1周", hours: 40 };
    expect(trend.label).toBe("第1周");
  });
});
