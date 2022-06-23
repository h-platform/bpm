import { CommandError } from "@h-platform/cqm";

export enum TaskType {
    UserTask = 'UserTask',
    ServiceTask = 'ServiceTask'
}

export class BusinessProcess {
    currentTasks: string[] = [];
    completedTasks: string[] = [];

    constructor(
        readonly inititalTasks: string[],
        readonly availableTasks: BusinessTask[]
    ) { }

    start() {
        this.currentTasks = [...this.inititalTasks];
    }

    complete(taskName: string) {
        // ensure task is currently active
        if (!this.currentTasks.includes(taskName))
            throw new CommandError(`Task "${taskName}" not in current active tasks of the process`, 'TASK_NOT_ACTIVE');
        
        // get business task
        const foundBusinessTask = this.availableTasks.find(t => t.taskName === taskName);
        if (!foundBusinessTask)
            throw new CommandError(`Task "${taskName}" not available in process`, 'TASK_NOT_AVAILABLE');
        
        // check task constraint
        const ok = foundBusinessTask.completeConstraint(this);
        if (!ok) throw new CommandError(`Task "${taskName}" transition contraint failed`, 'TASK_CONSTRAINT_FAILED');
        
        // update process
        this.currentTasks.push(...foundBusinessTask.nextTasks(this));
        this.currentTasks = this.currentTasks.filter(t => t != taskName);
        this.completedTasks.push(taskName);
    }

    load(process: BusinessProcess) {
        this.currentTasks = process.currentTasks;
        this.completedTasks = process.completedTasks;
    }
}

export type NextTasksFunc = (process: BusinessProcess) => string[];
export type TaskConstraintFunc = (process: BusinessProcess) => boolean;

export class BusinessTask {
    constructor(
        readonly taskName: string,
        readonly taskType: TaskType,
        readonly nextTasks: NextTasksFunc = () => [],
        readonly completeConstraint: TaskConstraintFunc = () => true,
    ) { }
}