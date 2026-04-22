package com.taskmanager.repository;

import com.taskmanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByCompletedOrderByTaskDateAscTaskTimeAsc(boolean completed);

    List<Task> findByMonthIgnoreCaseOrderByTaskDateAscTaskTimeAsc(String month);

    List<Task> findAllByOrderByTaskDateAscTaskTimeAsc();

    List<Task> findByTaskDateOrderByTaskTimeAsc(LocalDate taskDate);

    List<Task> findByTaskDateBetweenOrderByTaskDateAscTaskTimeAsc(LocalDate start, LocalDate end);
}
