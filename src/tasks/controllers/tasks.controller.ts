import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { TaskStatus } from '../dto/task-status-enum';
import { createTaskDto } from '../dto/create-task.dto';
import { GetTaskFilterDto } from '../dto/get-tasks-filter.dto';
import { UpdateTaskStatusDto } from '../dto/update-task-status.dto';
import { Task } from '../entities/task.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasks(@Query() filterDto: GetTaskFilterDto): Promise<Task[]> {
    return this.tasksService.getTasks(filterDto);
  }

  @Get(':id')
  getTaskById(@Param('id') id: string): Promise<Task> {
    return this.tasksService.getTaskById(id);
  }

  @Post()
  createTask(@Body() createTaskDto: createTaskDto): Promise<Task> {
    return this.tasksService.createTask(createTaskDto);
  }

  @Delete(':id')
  deleteTaskById(@Param('id') id: string): void {
    this.tasksService.deleteTaskById(id);
  }

  @Patch(':id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body() UpdateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const { status } = UpdateTaskStatusDto;
    return this.tasksService.updateTaskStatus(id, status);
  }
}
