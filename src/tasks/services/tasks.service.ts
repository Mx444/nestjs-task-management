import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '../dto/task-status-enum';
import { createTaskDto } from '../dto/create-task.dto';
import { GetTaskFilterDto } from '../dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository } from 'typeorm';
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}
  async getAllTasks() {
    return this.taskRepository.find();
  }

  async getTasks(filterDto: GetTaskFilterDto) {
    const { status, search } = filterDto;

    const query = this.taskRepository.createQueryBuilder('task');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
    const task = await query.getMany();
    return task;
  }

  async getTaskById(id: string): Promise<Task> {
    const found = await this.taskRepository.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }
    return found;
  }

  async createTask(createTaskDto: createTaskDto): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = this.taskRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
    });

    await this.taskRepository.save(task);
    return task;
  }

  async deleteTaskById(id: string): Promise<void> {
    const result = await this.taskRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.getTaskById(id);
    task.status = status;
    await this.taskRepository.save(task);
    return task;
  }
}
