package com.taskmanager.service;

import com.taskmanager.model.Task;
import com.taskmanager.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<Task> getAllTasks() {
        return taskRepository.findAllByOrderByTaskDateAscTaskTimeAsc();
    }

    public List<Task> getTasksByStatus(boolean completed) {
        return taskRepository.findByCompletedOrderByTaskDateAscTaskTimeAsc(completed);
    }

    public List<Task> getTasksByMonth(String month) {
        return taskRepository.findByMonthIgnoreCaseOrderByTaskDateAscTaskTimeAsc(month);
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
    }

    public List<Task> getTasksByDate(LocalDate date) {
        return taskRepository.findByTaskDateOrderByTaskTimeAsc(date);
    }

    public List<Task> getTasksByDateRange(LocalDate start, LocalDate end) {
        return taskRepository.findByTaskDateBetweenOrderByTaskDateAscTaskTimeAsc(start, end);
    }

    public Task createTask(Task task) {
        task.setCompleted(false);
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task taskDetails) {
        Task task = getTaskById(id);
        task.setTitle(taskDetails.getTitle());
        task.setTaskDate(taskDetails.getTaskDate());
        task.setTaskTime(taskDetails.getTaskTime());
        task.setCompleted(taskDetails.isCompleted());
        return taskRepository.save(task);
    }

    public Task toggleTask(Long id) {
        Task task = getTaskById(id);
        task.setCompleted(!task.isCompleted());
        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        Task task = getTaskById(id);
        taskRepository.delete(task);
    }
}
