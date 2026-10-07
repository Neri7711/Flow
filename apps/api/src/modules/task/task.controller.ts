import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CurrentUser, type SessionUser } from "@/auth/session";

import { AddCommentDto, CreateTaskDto, SetStatusDto, TaskQueryDto } from "./dto";
import { TaskService } from "./task.service";

@Controller()
export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  /** GET /api/tasks?teamId=pl&cycleId=pl-c4&status=todo */
  @Get("tasks")
  findAll(@Query() query: TaskQueryDto) {
    return this.tasks.findAll(query);
  }

  @Get("task-labels")
  getLabels() {
    return this.tasks.getLabels();
  }

  @Get("tasks/:id")
  findOne(@Param("id") id: string) {
    return this.tasks.findOne(id);
  }

  @Get("tasks/:id/events")
  getEvents(@Param("id") id: string) {
    return this.tasks.getEvents(id);
  }

  @Post("tasks")
  create(@Body() body: CreateTaskDto, @CurrentUser() user: SessionUser) {
    return this.tasks.create(body, user.id);
  }

  @Patch("tasks/:id/status")
  setStatus(@Param("id") id: string, @Body() { status }: SetStatusDto, @CurrentUser() user: SessionUser) {
    return this.tasks.setStatus(id, status, user.id);
  }

  @Patch("tasks/:id/toggle-done")
  toggleDone(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    return this.tasks.toggleDone(id, user.id);
  }

  @Post("tasks/:id/comments")
  addComment(@Param("id") id: string, @Body() { body }: AddCommentDto, @CurrentUser() user: SessionUser) {
    return this.tasks.addComment(id, user.id, body);
  }
}
