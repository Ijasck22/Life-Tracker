package com.example.taskmanger.service;

import java.awt.print.Pageable;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.example.taskmanger.Repository.TaskRepository;
import com.example.taskmanger.entity.Task;
import com.example.taskmanger.entity.TaskRequest;
import com.example.taskmanger.entity.TaskResponse;

@Service
public class TaskService {
	
	 @Autowired
	    private TaskRepository repository;

	    public TaskResponse create(TaskRequest request) {

	        Task task = new Task();
	        task.setTitle(request.getTitle());
	        task.setDescription(request.getDescription());
	        task.setStatus("PENDING");

	        Task saved = repository.save(task);

	        return mapToResponse(saved);
	    }

	    public List<TaskResponse> getAll() {
	        return repository.findAll()
	                .stream()
	                .map(this::mapToResponse)
	                .toList();
	    }

	    public TaskResponse getById(Long id) {
	        Task task = repository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Task not found"));
	        return mapToResponse(task);
	    }

	    public void delete(Long id) {
	        repository.deleteById(id);
	        
	    }

	    private TaskResponse mapToResponse(Task task) {
	        TaskResponse response = new TaskResponse();
	        response.setId(task.getId());
	        response.setTitle(task.getTitle());
	        response.setDescription(task.getDescription());
	        response.setStatus(task.getStatus());
	        return response;

	    
	    }
	    
	   

}
