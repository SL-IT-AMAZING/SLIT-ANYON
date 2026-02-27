import log from "electron-log";

const logger = log.scope("task-toast");

export interface TaskNotification {
  taskId: string;
  agentName: string;
  description: string;
  status: "completed" | "error" | "stale";
  duration?: number;
  error?: string;
}

export class TaskToastManager {
  private notifications: TaskNotification[] = [];

  onTaskComplete(notification: TaskNotification): void {
    logger.info(
      `Task complete: ${notification.description} (${notification.agentName})`,
    );
    this.notifications.push(notification);
  }

  onTaskError(notification: TaskNotification): void {
    logger.warn(
      `Task error: ${notification.description} - ${notification.error}`,
    );
    this.notifications.push(notification);
  }

  onTaskStale(notification: TaskNotification): void {
    logger.warn(
      `Task stale: ${notification.description} (${notification.agentName})`,
    );
    this.notifications.push(notification);
  }

  getRecent(limit = 10): TaskNotification[] {
    return this.notifications.slice(-limit);
  }

  clear(): void {
    this.notifications = [];
  }
}
