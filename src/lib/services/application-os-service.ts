import {
  applicationOsRepository,
  type ApplicationOsRepository,
  type CreateApplicationInput,
  type CreateCompanyInput,
  type CreateFollowUpInput,
  type CreateJobInput,
  type UpdateApplicationStatusInput,
  type UpdateFollowUpStatusInput,
  type UpdateJobStatusInput,
  type CreateAutoApplyRunLogInput,
  type ListAutoApplyRunLogsInput,
} from "@/lib/repositories/application-os-repository";
import type {
  ApplicationWithJob,
  ApplicationWithJobAndInterviews,
  AutoApplyRunLog,
  Company,
  CompanyWithStats,
  DashboardSnapshot,
  Document,
  FollowUp,
  Interview,
  InterviewQuestion,
  Job,
  Profile,
  User,
} from "@/types/domain";

export interface ApplicationOsService {
  getCurrentUser(): Promise<User>;
  getProfile(userId: string): Promise<Profile | null>;
  getDashboard(userId: string): Promise<DashboardSnapshot>;
  getJobs(userId: string): Promise<Job[]>;
  createJob(userId: string, input: CreateJobInput): Promise<Job>;
  updateJobStatus(userId: string, input: UpdateJobStatusInput): Promise<Job>;
  getApplications(userId: string): Promise<ApplicationWithJob[]>;
  getApplication(userId: string, applicationId: string): Promise<ApplicationWithJobAndInterviews | null>;
  createApplication(userId: string, input: CreateApplicationInput): Promise<ApplicationWithJob>;
  updateApplicationStatus(
    userId: string,
    input: UpdateApplicationStatusInput,
  ): Promise<ApplicationWithJob>;
  createAutoApplyRunLogs(userId: string, input: CreateAutoApplyRunLogInput[]): Promise<void>;
  getAutoApplyRunLogs(userId: string, input?: ListAutoApplyRunLogsInput): Promise<AutoApplyRunLog[]>;
  getDocuments(userId: string): Promise<Document[]>;
  getFollowUps(userId: string): Promise<FollowUp[]>;
  createFollowUp(userId: string, input: CreateFollowUpInput): Promise<FollowUp>;
  updateFollowUpStatus(userId: string, input: UpdateFollowUpStatusInput): Promise<FollowUp>;
  listInterviews(userId: string, applicationId?: string): Promise<Interview[]>;
  createInterview(userId: string, input: {
    applicationId: string;
    interviewType: string;
    interviewerName?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    location?: string;
    notes?: string;
    questions?: string[];
    rating?: number;
    outcome?: string;
  }): Promise<Interview>;
  updateInterview(userId: string, interviewId: string, input: {
    interviewType?: string;
    interviewerName?: string | null;
    scheduledAt?: string | null;
    durationMinutes?: number | null;
    location?: string | null;
    notes?: string | null;
    questions?: string[] | null;
    rating?: number | null;
    outcome?: string | null;
  }): Promise<Interview>;
  deleteInterview(userId: string, interviewId: string): Promise<void>;
  listQuestions(userId: string, category?: string, search?: string): Promise<InterviewQuestion[]>;
  createQuestion(userId: string, input: { category: string; question: string; answerHints?: string; tags?: string[] }): Promise<InterviewQuestion>;
  updateQuestion(userId: string, questionId: string, input: { category?: string; question?: string; answerHints?: string; tags?: string[] }): Promise<InterviewQuestion>;
  deleteQuestion(userId: string, questionId: string): Promise<void>;
  getQuestionIdsByInterview(interviewId: string): Promise<string[]>;
  addQuestionUsages(interviewId: string, questionIds: string[]): Promise<void>;
  removeQuestionUsagesByInterview(interviewId: string): Promise<void>;
  listCompanies(userId: string): Promise<Company[]>;
  getCompany(userId: string, companyId: string): Promise<Company | null>;
  getCompanyWithStats(userId: string, companyId: string): Promise<CompanyWithStats | null>;
  createCompany(userId: string, input: CreateCompanyInput): Promise<Company>;
  updateCompany(userId: string, companyId: string, input: Partial<CreateCompanyInput>): Promise<Company>;
  deleteCompany(userId: string, companyId: string): Promise<void>;
}

class DefaultApplicationOsService implements ApplicationOsService {
  constructor(private readonly repository: ApplicationOsRepository) {}

  async getCurrentUser(): Promise<User> {
    return this.repository.getCurrentUser();
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return this.repository.getProfile(userId);
  }

  async getDashboard(userId: string): Promise<DashboardSnapshot> {
    return this.repository.getDashboardSnapshot(userId);
  }

  async getJobs(userId: string): Promise<Job[]> {
    return this.repository.listJobs(userId);
  }

  async createJob(userId: string, input: CreateJobInput): Promise<Job> {
    return this.repository.createJob(userId, input);
  }

  async updateJobStatus(userId: string, input: UpdateJobStatusInput): Promise<Job> {
    return this.repository.updateJobStatus(userId, input);
  }

  async getApplications(userId: string): Promise<ApplicationWithJob[]> {
    return this.repository.listApplications(userId);
  }

  async getApplication(userId: string, applicationId: string): Promise<ApplicationWithJobAndInterviews | null> {
    return this.repository.getApplication(userId, applicationId);
  }

  async createApplication(userId: string, input: CreateApplicationInput): Promise<ApplicationWithJob> {
    return this.repository.createApplication(userId, input);
  }

  async updateApplicationStatus(
    userId: string,
    input: UpdateApplicationStatusInput,
  ): Promise<ApplicationWithJob> {
    return this.repository.updateApplicationStatus(userId, input);
  }

  async createAutoApplyRunLogs(userId: string, input: CreateAutoApplyRunLogInput[]): Promise<void> {
    return this.repository.createAutoApplyRunLogs(userId, input);
  }

  async getAutoApplyRunLogs(userId: string, input?: ListAutoApplyRunLogsInput): Promise<AutoApplyRunLog[]> {
    return this.repository.listAutoApplyRunLogs(userId, input);
  }

  async getDocuments(userId: string): Promise<Document[]> {
    return this.repository.listDocuments(userId);
  }

  async getFollowUps(userId: string): Promise<FollowUp[]> {
    return this.repository.listFollowUps(userId);
  }

  async createFollowUp(userId: string, input: CreateFollowUpInput): Promise<FollowUp> {
    return this.repository.createFollowUp(userId, input);
  }

  async updateFollowUpStatus(userId: string, input: UpdateFollowUpStatusInput): Promise<FollowUp> {
    return this.repository.updateFollowUpStatus(userId, input);
  }

  async listInterviews(userId: string, applicationId?: string): Promise<Interview[]> {
    return this.repository.listInterviews(userId, applicationId ? { applicationId } : undefined);
  }

  async createInterview(userId: string, input: {
    applicationId: string;
    interviewType: string;
    interviewerName?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    location?: string;
    notes?: string;
    questions?: string[];
    rating?: number;
    outcome?: string;
  }): Promise<Interview> {
    return this.repository.createInterview(userId, input);
  }

  async updateInterview(userId: string, interviewId: string, input: {
    interviewType?: string;
    interviewerName?: string | null;
    scheduledAt?: string | null;
    durationMinutes?: number | null;
    location?: string | null;
    notes?: string | null;
    questions?: string[] | null;
    rating?: number | null;
    outcome?: string | null;
  }): Promise<Interview> {
    return this.repository.updateInterview(userId, interviewId, input);
  }

  async deleteInterview(userId: string, interviewId: string): Promise<void> {
    return this.repository.deleteInterview(userId, interviewId);
  }

  async listQuestions(userId: string, category?: string, search?: string): Promise<InterviewQuestion[]> {
    return this.repository.listQuestions(userId, { category, search });
  }

  async createQuestion(userId: string, input: {
    category: string;
    question: string;
    answerHints?: string;
    tags?: string[];
  }): Promise<InterviewQuestion> {
    return this.repository.createQuestion(userId, input);
  }

  async updateQuestion(userId: string, questionId: string, input: {
    category?: string;
    question?: string;
    answerHints?: string;
    tags?: string[];
  }): Promise<InterviewQuestion> {
    return this.repository.updateQuestion(userId, questionId, {
      ...input,
      category: input.category ?? undefined,
    });
  }

  async deleteQuestion(userId: string, questionId: string): Promise<void> {
    return this.repository.deleteQuestion(userId, questionId);
  }

  async getQuestionIdsByInterview(interviewId: string): Promise<string[]> {
    return this.repository.getQuestionIdsByInterview(interviewId);
  }

  async addQuestionUsages(interviewId: string, questionIds: string[]): Promise<void> {
    return this.repository.addQuestionUsages(interviewId, questionIds);
  }

  async removeQuestionUsagesByInterview(interviewId: string): Promise<void> {
    return this.repository.removeQuestionUsagesByInterview(interviewId);
  }

  async listCompanies(userId: string): Promise<Company[]> {
    return this.repository.listCompanies(userId);
  }

  async getCompany(userId: string, companyId: string): Promise<Company | null> {
    return this.repository.getCompany(userId, companyId);
  }

  async getCompanyWithStats(userId: string, companyId: string): Promise<CompanyWithStats | null> {
    return this.repository.getCompanyWithStats(userId, companyId);
  }

  async createCompany(userId: string, input: CreateCompanyInput): Promise<Company> {
    return this.repository.createCompany(userId, input);
  }

  async updateCompany(userId: string, companyId: string, input: Partial<CreateCompanyInput>): Promise<Company> {
    return this.repository.updateCompany(userId, companyId, input);
  }

  async deleteCompany(userId: string, companyId: string): Promise<void> {
    return this.repository.deleteCompany(userId, companyId);
  }
}

export const applicationOsService: ApplicationOsService = new DefaultApplicationOsService(
  applicationOsRepository,
);
