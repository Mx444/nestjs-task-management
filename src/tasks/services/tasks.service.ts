import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '../dto/task-status-enum';
import { createTaskDto } from '../dto/create-task.dto';
import { GetTaskFilterDto } from '../dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Logger } from '@nestjs/common';
@Injectable()
export class TasksService {
  private logger = new Logger('TasksService', { timestamp: true });
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async getAllTasks() {
    return this.taskRepository.find();
  }

  async getTasks(filterDto: GetTaskFilterDto, user: User) {
    try {
      const { status, search } = filterDto;

      const query = this.taskRepository.createQueryBuilder('task');
      query.where('task.userId = :userId', { userId: user.id });

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
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for user "${
          user.username
        }". Filters: ${JSON.stringify(filterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.taskRepository.findOne({
      where: { id, user },
    });

    if (!found) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }

    return found;
  }

  async createTask(createTaskDto: createTaskDto, user: User): Promise<Task> {
    try {
      const { title, description } = createTaskDto;

      const task = this.taskRepository.create({
        title,
        description,
        status: TaskStatus.OPEN,
        user,
      });

      await this.taskRepository.save(task);
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to create task for user "${
          user.username
        }". Data: ${JSON.stringify(createTaskDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async deleteTaskById(id: string, user: User): Promise<void> {
    const result = await this.taskRepository.delete({ id, user });
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    try {
      const task = await this.getTaskById(id, user);
      task.status = status;
      await this.taskRepository.save(task);
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to update task for user "${
          user.username
        }". ID: ${id}, status: ${status}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
