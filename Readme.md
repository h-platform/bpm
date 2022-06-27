# Simple bpm
This is a library where you can create a business process and manager it.

A business process is a sequesnce of tasks that needs to be completed towards the end of the process.

Tasks are linked together and each task completed the process will go to a new task until no furthers tasks are done.

## Design your process
You can use [Camunda Modeler](https://camunda.com/download/modeler/) to design a process like this example:

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1655766845361/Arzf85gbQ.png?auto=compress,format&format=webp)

## Implement your process

You can implement your process by creating business tasks and adding them to the process.
A business task receives the taskName, taskType and two functions.
The first function should return list of next tasks to be added to current task list in the process.
The second function is a gaurd or constraints function it should return a boolean indicating whether this task can be completed based on the current state of the process.

```
export class BusinessTask {
    constructor(
        readonly taskName: string,
        readonly taskType: TaskType,
        readonly getNextTasks: NextTasksFunc = (process) => [],
        readonly canComplete: TaskConstraintFunc = (process) => true,
    ) { }
}
```

The above examples can be implemented as follows

```
import { BusinessProcess, BusinessTask, TaskType } from '@h-platform/bpm';

createRegistrationProcess() {
        return new BusinessProcess([
            'start'
        ], [
            new BusinessTask('start', TaskType.UserTask, 
                () => ['user.verifyEmail']),
                
            new BusinessTask('user.verifyEmail', TaskType.UserTask, 
                () => ['user.fillInvestmentForm']),
                
            new BusinessTask('user.fillInvestmentForm', TaskType.UserTask,
                () => ['user.fillExperienceForm']),
                
            new BusinessTask('user.fillExperienceForm', TaskType.UserTask, 
                () => ['user.fillNeedsForm',]),
                
            new BusinessTask('user.fillNeedsForm', TaskType.UserTask,
                () => [
                    'user.uploadIdentity',
                    'user.uploadPhoto',
                ]),
                
            new BusinessTask('user.uploadIdentity', TaskType.UserTask,
                () => ['admin.approveAccount']),
                
            new BusinessTask('user.uploadPhoto', TaskType.UserTask, 
                () => ['admin.approveAccount'], 
                
            new BusinessTask('admin.approveAccount', TaskType.UserTask,
                () => ['system.sendWelcomeEmail'],
                (process) => {
                    // ensure previous tasks are completed
                    return ['user.uploadIdentity', 'user.uploadPhoto'].every((taskName) => process.completedTasks.includes(taskName)
                }),
                
            new BusinessTask('system.sendWelcomeEmail', TaskType.SystemTask,
                () => []),
        ])
    }
```

## Using the process
the above defined process can be used as follows:

```
const registrationProcess = createRegistrationProcess();

registrationProcess.start();
console.log(registrationProcess.currentTasks); // ['user.fillInvestmentForm']

registrationProcess.complete('user.fillInvestmentForm');
console.log(registrationProcess.currentTasks); // ['user.fillExperienceForm']

registrationProcess.complete('user.fillExperianceForm');
console.log(registrationProcess.currentTasks); // ['user.fillNeedsForm']

registrationProcess.complete('someRandomTaskName'); // throw taskName not found error
registrationProcess.complete('admin.approveAccount'); // throw taskName not yet active error

registrationProcess.complete('user.fillNeedsForm'); // ok
registrationProcess.complete('user.uploadPhoto'); // ok
registrationProcess.complete('user.uploadIdentity'); // ok
registrationProcess.complete('user.approveAccount'); // ok
registrationProcess.complete('system.sendWelcomeEmail'); // ok, no more active tasks

```