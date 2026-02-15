package com.example.taskmanger.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.taskmanger.entity.Task; 


public interface TaskRepository  extends JpaRepository<Task, Long> {

	

}
